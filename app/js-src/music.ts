// app/js-src/music.ts

import { makeDraggable } from './draggable';

export function initMusicPlayer() {
    const musicPlayerContainer = document.getElementById('music-player-container');
    const musicCheckboxes = document.querySelectorAll(".music-checkbox-input") as NodeListOf<HTMLInputElement>;
    const musicCloseButton = document.getElementById('music-player-close-btn');
    const prevButton = document.getElementById('music-player-prev');
    const pauseButton = document.getElementById('music-player-pause');
    const nextButton = document.getElementById('music-player-next');
    const starButton = document.getElementById('music-player-star-btn');
    const playlistToggle = document.getElementById('music-player-list-toggle');
    const playlistContainer = document.getElementById('music-player-playlist');
    const trackInfo = document.getElementById('track-info');
    const trackInfoContent = document.getElementById('track-info-content');
    const trackNameSpan = document.getElementById('music-player-track-name');
    const artistNameSpan = document.getElementById('music-player-artist-name');
    const timeDisplay = document.getElementById('music-player-time');
    const notesOverlay = document.getElementById('music-player-notes-overlay');
    const autoplayMessage = document.getElementById('music-player-autoplay-message');
    const musicControls = document.getElementById('music-player-controls');
    
    // Visualizer
    const canvas = document.getElementById('music-visualizer') as HTMLCanvasElement;
    const canvasCtx = canvas ? canvas.getContext('2d') : null;

    let musicPlayer: any = null;
    let opusPlayer: HTMLAudioElement | null = null;
    let currentTrackIndex = 0;
    let isPaused = false;
    let playlist: any[] = [];
    let starredTracks: Set<string> = new Set();
    let lastTimeString = "";
    
    // Concurrency control
    let currentPlayId = 0;
    
    // Audio Context for Visualizer
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let opusSource: MediaElementAudioSourceNode | null = null;
    let visualizerFrame: number | null = null;
    
    // MIDI Visuals state
    let activeMidiNotes: { [key: number]: number } = {}; // note -> velocity
    let cachedInstrument: any = null;

    const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

    const fetchStarredTracks = () => {
        fetch('/api/starred_external_urls')
            .then(res => res.json())
            .then((urls: string[]) => {
                starredTracks = new Set(urls);
                // Update current track button if playing
                if (playlist.length > 0) {
                    const track = playlist[currentTrackIndex];
                    updateStarButton(track);
                }
            })
            .catch(err => console.error("Error fetching starred tracks:", err));
    };

    const updateStarButton = (track: any) => {
        if (!starButton) return;
        // Construct full URL if needed, but the API returns what we stored.
        // tracks API returns relative path usually e.g. /static/mid/...
        // We probably stored the full URL or relative? star_external takes URL.
        // Let's assume we store the relative path for internal tracks or full for external.
        // Ideally we resolve to full URL.
        const url = new URL(track.path, window.location.origin).href;
        
        if (starredTracks.has(url)) {
            starButton.textContent = '★';
            starButton.title = "Unstar this track";
            starButton.classList.add('starred');
        } else {
            starButton.textContent = '☆';
            starButton.title = "Star this track";
            starButton.classList.remove('starred');
        }
    };

    const toggleStar = async () => {
        if (!playlist.length) return;
        const track = playlist[currentTrackIndex];
        const url = new URL(track.path, window.location.origin).href;
        
        if (starredTracks.has(url)) {
            // Unstar
            try {
                const res = await fetch('/api/unstar_external', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                if (res.ok) {
                    starredTracks.delete(url);
                    updateStarButton(track);
                }
            } catch (e) {
                console.error("Error unstarring:", e);
            }
        } else {
            // Star
            try {
                const res = await fetch('/api/star_external', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        url,
                        title: track.name,
                        source: 'Music Player' // or 'Agora Music'
                    })
                });
                if (res.ok) {
                    starredTracks.add(url);
                    updateStarButton(track);
                }
            } catch (e) {
                console.error("Error starring:", e);
            }
        }
    };

    if (starButton) {
        starButton.addEventListener('click', toggleStar);
    }

    // Initialize AudioContext if needed
    const initAudioContext = () => {
        if (!audioCtx) {
            // @ts-ignore
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    };

    const stopMusic = () => {
        if (musicPlayer) {
            try {
                musicPlayer.stop();
            } catch (e) {
                console.warn("Error stopping MIDI player:", e);
            }
            musicPlayer = null; 
        }
        if (opusPlayer) {
            // prevent triggering events during reset
            opusPlayer.onended = null;
            opusPlayer.onerror = null;
            opusPlayer.pause();
            opusPlayer.src = "";
            // We keep the element but reset source
        }
        if (visualizerFrame) {
            cancelAnimationFrame(visualizerFrame);
        }
        // Clear canvas
        if (canvasCtx && canvas) {
            canvasCtx.fillStyle = '#000';
            canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        }
        activeMidiNotes = {};
        if (notesOverlay) notesOverlay.textContent = '';
        console.log("Music stopped.");
    };

    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || !isFinite(seconds)) return "--:--";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getNoteName = (midi: number) => {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const note = notes[midi % 12];
        const octave = Math.floor(midi / 12) - 1;
        return `${note}${octave}`;
    };

    const drawVisualizer = () => {
        if (!canvasCtx || !canvas) return;

        // Auto-resume audio context if it suspended while we think we are playing
        if (audioCtx && audioCtx.state === 'suspended' && !isPaused && ((musicPlayer && musicPlayer.isPlaying()) || (opusPlayer && !opusPlayer.paused))) {
            console.warn("AudioContext suspended while playing, attempting resume...");
            audioCtx.resume();
        }

        visualizerFrame = requestAnimationFrame(drawVisualizer);

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Fade out
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

        // Update Time Display
        let currentTime = 0;
        let totalTime = 0;
        let isPlaying = false;

        if (opusPlayer && !opusPlayer.paused) {
            currentTime = opusPlayer.currentTime;
            totalTime = opusPlayer.duration;
            if (!isFinite(totalTime) && Math.random() < 0.01) {
                console.log(`Opus Debug: Duration=${totalTime}, ReadyState=${opusPlayer.readyState}, NetworkState=${opusPlayer.networkState}`);
            }
            isPlaying = true;
        } else if (musicPlayer && musicPlayer.isPlaying()) {
            totalTime = musicPlayer.getSongTime();
            const remaining = musicPlayer.getSongTimeRemaining();
            currentTime = totalTime - remaining;
            isPlaying = true;

            // Fallback: If remaining is 0 (or very close), force next track
            // This handles cases where 'end' event might be missed
            if (remaining <= 0 && totalTime > 0) {
                console.log("Visualizer detected end of MIDI track, advancing.");
                playTrack((currentTrackIndex + 1) % playlist.length);
            }
        }

        if (isPlaying && timeDisplay) {
            const timeString = `${formatTime(currentTime)} / ${formatTime(totalTime)}`;
            if (timeString !== lastTimeString) {
                timeDisplay.textContent = timeString;
                lastTimeString = timeString;
            }
        }

        if (opusPlayer && !opusPlayer.paused && analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            const barWidth = (WIDTH / dataArray.length) * 2.5;
            let barHeight;
            let x = 0;

            for (let i = 0; i < dataArray.length; i++) {
                barHeight = dataArray[i] / 2; // Scale down
                
                // Rainbow coloring based on frequency
                const r = barHeight + (25 * (i/dataArray.length));
                const g = 250 * (i/dataArray.length);
                const b = 50;

                canvasCtx.fillStyle = `rgb(${r},${g},${b})`;
                canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);

                x += barWidth + 1;
            }
        } else if (musicPlayer && musicPlayer.isPlaying()) {
            // MIDI Visualizer
            // Draw active notes
            const notes = Object.keys(activeMidiNotes).map(Number);
            
            // Update Overlay
            if (notesOverlay) {
                 if (notes.length > 0) {
                      notes.sort((a,b) => a-b);
                      notesOverlay.textContent = notes.map(getNoteName).join(' ');
                 } else {
                      notesOverlay.textContent = '';
                 }
            }

            const barWidth = WIDTH / 88; // 88 keys
            
            notes.forEach(note => {
                const velocity = activeMidiNotes[note];
                const x = (note - 21) * barWidth; // MIDI notes 21-108 usually
                const barHeight = (velocity / 127) * HEIGHT;
                
                canvasCtx.fillStyle = `hsl(${note * 3}, 100%, 50%)`;
                canvasCtx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
                
                // Decay velocity for visual fade
                activeMidiNotes[note] *= 0.9;
                if (activeMidiNotes[note] < 1) delete activeMidiNotes[note];
            });
        }
        // Draw Playhead
        if (isPlaying && totalTime > 0 && isFinite(totalTime)) {
            const x = (currentTime / totalTime) * WIDTH;
            canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            canvasCtx.fillRect(x, 0, 2, HEIGHT);
        }
    };

    const seek = (e: MouseEvent) => {
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const percent = Math.max(0, Math.min(1, x / rect.width));
        
        let totalTime = 0;
        
        if (opusPlayer && !opusPlayer.paused) {
             totalTime = opusPlayer.duration;
             if (totalTime > 0) {
                 opusPlayer.currentTime = percent * totalTime;
             }
        } else if (musicPlayer && musicPlayer.isPlaying()) {
             totalTime = musicPlayer.getSongTime();
             if (totalTime > 0) {
                 const target = percent * totalTime;
                 console.log(`Seeking MIDI to ${target} / ${totalTime}`);
                 musicPlayer.skipToSeconds(target);
                 // Ensure it keeps playing
                 if (!musicPlayer.isPlaying()) {
                     console.log("MIDI stopped after seek, resuming.");
                     musicPlayer.play();
                 }
                 activeMidiNotes = {}; 
             }
        }
    };
    
    if (canvas) {
        canvas.style.cursor = 'pointer';
        canvas.addEventListener('click', seek);
    }

    const playTrack = (trackIndex: number) => {
        stopMusic();
        isPaused = false;
        if (pauseButton) pauseButton.textContent = '⏸';
        currentTrackIndex = trackIndex;
        
        // Concurrency token
        const playId = ++currentPlayId;
        
        if (!playlist || playlist.length === 0) return;
        
        const track = playlist[trackIndex];
        if (trackNameSpan) trackNameSpan.textContent = track.name;
        // Link to the Node (wikilink) instead of User profile
        if (artistNameSpan) artistNameSpan.innerHTML = track.artist ? `by <a href="/${track.artist.replace('@','')}" target="_blank">${track.artist}</a>` : '';
        
        updateStarButton(track);

        // Check for overflow and apply marquee
        if (trackInfoContent) {
            trackInfoContent.classList.remove('scrolling-track');
            trackInfoContent.style.removeProperty('--scroll-distance');
        }
        
        // Small delay to allow layout update
        setTimeout(() => {
            if (trackInfo && trackInfoContent && trackInfo.scrollWidth > trackInfo.clientWidth) {
                const distance = trackInfo.scrollWidth - trackInfo.clientWidth + 10; // Extra buffer
                trackInfoContent.style.setProperty('--scroll-distance', `-${distance}px`);
                trackInfoContent.classList.add('scrolling-track');
            }
        }, 50);

        // Start Visualizer Loop
        drawVisualizer();
        
        // Update playlist UI highlight if visible
        if (playlistContainer && playlistContainer.style.display === 'block') {
            renderPlaylist();
        }

        if (track.type === 'mid') {
            const ac = initAudioContext();
            
            // Define a function to play using the instrument (cached or new)
            const playWithInstrument = (instrument: any, MidiPlayer: any) => {
                if (playId !== currentPlayId) return;

                const activeNotesDict: { [key: number]: any } = {};
                
                // If we already have a player, we can try to reuse it, but creating a new one 
                // is safer to ensure clean state, provided we stop the old one (which we did).
                const player = new MidiPlayer.Player(function (event: any) {
                    try {
                        if (event.name === 'Note on' && event.velocity > 0) {
                            console.log('Midi Note:', event.noteName, event.velocity);
                            instrument.play(event.noteName, ac.currentTime, { gain: (event.velocity / 100) * 4 });
                            activeMidiNotes[event.noteNumber] = event.velocity;
                            activeNotesDict[event.noteNumber] = true; 
                        } else if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
                            // instrument handles decay usually
                        }
                    } catch (e) {
                        console.error("Error processing MIDI event:", e);
                    }
                });

                player.on('end', function () {
                    console.log('Midi file finished, playing next track.');
                    playTrack((currentTrackIndex + 1) % playlist.length);
                });

                musicPlayer = player;
                
                fetch(track.path)
                    .then(response => response.arrayBuffer())
                    .then(arrayBuffer => {
                        if (playId !== currentPlayId) return;

                        // Convert to base64 for midi-player-js
                        const bytes = new Uint8Array(arrayBuffer);
                        if (bytes.length === 0) {
                            console.warn(`MIDI file ${track.name} is empty, skipping.`);
                            playTrack((currentTrackIndex + 1) % playlist.length);
                            return;
                        }
                        let binary = '';
                        const len = bytes.byteLength;
                        for (let i = 0; i < len; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const base64 = btoa(binary);
                        const dataUri = `data:audio/midi;base64,${base64}`;
                        
                        player.loadDataUri(dataUri);

                        if (player.getSongTime() <= 0) {
                            console.warn(`MIDI track ${track.name} has 0 duration, skipping.`);
                            playTrack((currentTrackIndex + 1) % playlist.length);
                            return;
                        }
                        
                        if (ac.state === 'suspended') {
                            if (musicControls) musicControls.style.display = 'none';
                            if (autoplayMessage) {
                                autoplayMessage.style.display = 'block';
                                autoplayMessage.textContent = '▶️ Click to play';
                            }
                        } else {
                            player.play();
                        }
                        console.log(`Playing MIDI: ${track.name}`);
                    });
            };

            // Import libraries if needed
            import('midi-player-js').then(({ default: MidiPlayer }) => {
                if (playId !== currentPlayId) return;

                if (cachedInstrument) {
                    playWithInstrument(cachedInstrument, MidiPlayer);
                } else {
                    import('soundfont-player').then(({ default: Soundfont }) => {
                        if (playId !== currentPlayId) return;
                        
                        Soundfont.instrument(ac, 'acoustic_grand_piano').then(function (instrument) {
                            if (playId !== currentPlayId) return;
                            cachedInstrument = instrument;
                            playWithInstrument(instrument, MidiPlayer);
                        });
                    });
                }
            });
        } else if (track.type === 'opus' || track.path.endsWith('.opus') || track.path.endsWith('.ogg')) {
            const ac = initAudioContext();
            
            if (!opusPlayer) {
                opusPlayer = new Audio();
                opusPlayer.crossOrigin = "anonymous";
            }
            opusPlayer.src = track.path;
            opusPlayer.loop = false;
            
            // Connect to Visualizer
            if (!opusSource && analyser) {
                try {
                    opusSource = ac.createMediaElementSource(opusPlayer);
                    opusSource.connect(analyser);
                    analyser.connect(ac.destination);
                } catch (e) {
                    // source already connected?
                    console.warn("Could not connect audio source (maybe already connected):", e);
                }
            }

            const playPromise = opusPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('Autoplay was prevented.');
                        if (musicControls) musicControls.style.display = 'none';
                        if (autoplayMessage) {
                            autoplayMessage.style.display = 'block';
                            autoplayMessage.textContent = '▶️ Click to play';
                        }
                    } else {
                        console.error('An error occurred during playback:', error);
                    }
                });
            }
            
            opusPlayer.onended = () => {
                console.log('Opus file finished, playing next track.');
                playTrack((currentTrackIndex + 1) % playlist.length);
            };
            opusPlayer.onerror = () => {
                console.error(`Error loading Opus track ${track.name}, skipping.`);
                playTrack((currentTrackIndex + 1) % playlist.length);
            };
            console.log(`Playing Opus: ${track.name}`);
        }
    };

    const renderPlaylist = () => {
        if (!playlistContainer) return;
        playlistContainer.innerHTML = '';
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.padding = '0';
        
        playlist.forEach((track, index) => {
            const li = document.createElement('li');
            li.style.cursor = 'pointer';
            li.style.padding = '4px 0';
            li.style.borderBottom = '1px solid rgba(255,255,255,0.1)';
            if (index === currentTrackIndex) {
                li.style.fontWeight = 'bold';
                li.style.color = 'var(--accent-color)';
                li.innerHTML = `▶ ${track.name} <span style="font-size: 0.8em; opacity: 0.7;">(${track.artist})</span>`;
            } else {
                li.innerHTML = `${index + 1}. ${track.name} <span style="font-size: 0.8em; opacity: 0.7;">(${track.artist})</span>`;
            }
            
            li.addEventListener('click', () => {
                playTrack(index);
            });
            ul.appendChild(li);
        });
        playlistContainer.appendChild(ul);
    };

    const loadPlaylist = () => {
        return fetch(`/api/music/tracks?t=${Date.now()}`)
            .then(res => res.json())
            .then(tracks => {
                 let midis = tracks.filter((t: any) => t.type === 'mid');
                 let opuses = tracks.filter((t: any) => t.type === 'opus');
                 
                 playlist = [];

                 // Sort MIDIs by size ascending (helper for fallback)
                 midis.sort((a: any, b: any) => (a.size || 0) - (b.size || 0));

                 // 1. Pick one "Interesting" track first.
                 // Calibration: 399 bytes was 35s (sparse).
                 // Target: 7-17 seconds.
                 // If sparse (~0.7 notes/sec), we need 5-12 notes.
                 // (Size - 200) / 8
                 const interestingCandidates = midis.filter((m: any) => {
                     const estimatedNotes = Math.max(0, (m.size - 200) / 8);
                     return estimatedNotes >= 3 && estimatedNotes <= 15;
                 });
                 
                 let firstTrack = null;
                 
                 if (interestingCandidates.length > 0) {
                     // Pick random from interesting candidates
                     const idx = Math.floor(Math.random() * interestingCandidates.length);
                     firstTrack = interestingCandidates[idx];
                 } else if (midis.length > 0) {
                     // Fallback: Pick from the middle 50% (avoiding extremes) to avoid tiny files
                     const start = Math.floor(midis.length * 0.25);
                     const end = Math.floor(midis.length * 0.75);
                     const candidates = midis.slice(start, end);
                     if (candidates.length > 0) {
                         firstTrack = candidates[Math.floor(Math.random() * candidates.length)];
                     } else {
                         firstTrack = midis[0];
                     }
                 }

                 if (firstTrack) {
                      playlist.push(firstTrack);
                      // Remove it from midis list to avoid dupes
                      const index = midis.indexOf(firstTrack);
                      if (index > -1) midis.splice(index, 1);
                 }
                 
                 // 2. Add one Opus track (if available)
                 if (opuses.length > 0) {
                     const idx = Math.floor(Math.random() * opuses.length);
                     
                     playlist.push(opuses[idx]);
                     opuses.splice(idx, 1);
                 }

                 // 3. Add the rest of the MIDIs (SHUFFLED)
                 shuffle(midis);
                 playlist.push(...midis);

                 // 4. Add remaining Opuses at the end (SHUFFLED)
                 if (opuses.length > 0) {
                    shuffle(opuses);
                    playlist.push(...opuses);
                 }
                 
                 console.log("Loaded playlist (Short(10%) -> Opus(Rainbow?) -> Rest-Shuffled):", playlist);
                 return playlist;
            });
    };

    // Make the Music player draggable
    const musicDragHandle = document.getElementById('music-player-header');
    let musicDraggable: { reposition: () => void } | null = null;
    if (musicPlayerContainer && musicDragHandle) {
        musicDraggable = makeDraggable(musicPlayerContainer, musicDragHandle, 'music-player-position', 'top-right');
    }

    const setMusicState = (isPlaying: boolean) => {
        localStorage.setItem("ambient-music-active", JSON.stringify(isPlaying));
        musicCheckboxes.forEach(checkbox => {
            checkbox.checked = isPlaying;
        });

        if (isPlaying) {
            const isPlayerVisible = JSON.parse(localStorage.getItem("music-player-visible") || 'true');
            if (musicPlayerContainer && isPlayerVisible) {
                musicPlayerContainer.classList.add('active');
                if (musicDraggable) musicDraggable.reposition();
            }
            
            // If playlist empty, fetch it
            if (playlist.length === 0) {
                 loadPlaylist()
                    .then(() => {
                        playTrack(currentTrackIndex);
                    })
                    .catch(err => console.error("Failed to load playlist", err));
            } else {
                playTrack(currentTrackIndex);
            }
        } else {
            if (musicPlayerContainer) musicPlayerContainer.classList.remove('active');
            stopMusic();
        }
    };

    if (musicCheckboxes.length > 0) {
        fetchStarredTracks();
        const isMusicActive = JSON.parse(localStorage.getItem("ambient-music-active") || 'false');
        // If active on load, fetch playlist and start
        if (isMusicActive) {
             loadPlaylist()
                .then(() => {
                    setMusicState(true);
                });
        }

        musicCheckboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const isPlaying = checkbox.checked;
                if (isPlaying) {
                    localStorage.setItem("music-player-visible", "true");
                }
                setMusicState(isPlaying);
            });
        });

        // Allow clicking anywhere on the container to resume if blocked
        if (musicPlayerContainer) {
            musicPlayerContainer.addEventListener('click', (e) => {
                // If clicking a button, link, or playlist, ignore
                if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a') || (e.target as HTMLElement).closest('#music-player-playlist')) return;

                if (autoplayMessage && autoplayMessage.style.display === 'block') {
                    autoplayMessage.click();
                }
            });
        }

        autoplayMessage?.addEventListener('click', () => {
            autoplayMessage.style.display = 'none';
            if (musicControls) musicControls.style.display = 'flex';
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            playTrack(currentTrackIndex);
        });

        musicCloseButton?.addEventListener('click', () => {
            setMusicState(false);
        });

        if (playlistToggle && playlistContainer) {
            playlistToggle.addEventListener('click', () => {
                if (playlistContainer.style.display === 'none') {
                    renderPlaylist();
                    playlistContainer.style.display = 'block';
                } else {
                    playlistContainer.style.display = 'none';
                }
            });
        }

        pauseButton?.addEventListener('click', () => {
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            isPaused = !isPaused;
            if (isPaused) {
                // @ts-ignore
                if (musicPlayer && musicPlayer.isPlaying()) musicPlayer.pause();
                if (opusPlayer && !opusPlayer.paused) opusPlayer.pause();
                if (pauseButton) pauseButton.textContent = '▶️';
            } else {
                const track = playlist[currentTrackIndex];
                if (track && track.type === 'mid') {
                    // @ts-ignore
                    if (musicPlayer && !musicPlayer.isPlaying()) musicPlayer.play();
                } else {
                    if (opusPlayer && opusPlayer.paused && opusPlayer.src) opusPlayer.play();
                }
                if (pauseButton) pauseButton.textContent = '⏸';
            }
        });

        nextButton?.addEventListener('click', () => {
            playTrack((currentTrackIndex + 1) % playlist.length);
        });

        prevButton?.addEventListener('click', () => {
            playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);
        });
    }
}