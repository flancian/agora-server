// app/js-src/music.ts

import { makeDraggable } from './draggable';

export function initMusicPlayer() {
    const musicPlayerContainer = document.getElementById('music-player-container');
    const musicCheckboxes = document.querySelectorAll(".music-checkbox-input") as NodeListOf<HTMLInputElement>;
    const musicCloseButton = document.getElementById('music-player-close-btn');
    const prevButton = document.getElementById('music-player-prev');
    const pauseButton = document.getElementById('music-player-pause');
    const nextButton = document.getElementById('music-player-next');
    const trackInfo = document.getElementById('track-info');
    const trackInfoContent = document.getElementById('track-info-content');
    const trackNameSpan = document.getElementById('music-player-track-name');
    const artistNameSpan = document.getElementById('music-player-artist-name');
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
    
    // Audio Context for Visualizer
    let audioCtx: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let dataArray: Uint8Array | null = null;
    let opusSource: MediaElementAudioSourceNode | null = null;
    let visualizerFrame: number | null = null;
    
    // MIDI Visuals state
    let activeMidiNotes: { [key: number]: number } = {}; // note -> velocity

    const shuffle = (array: any[]) => {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    };

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
            musicPlayer.stop();
            // Don't nullify immediately if we want to reuse, but here we rebuild per track.
            // musicPlayer = null; 
        }
        if (opusPlayer) {
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
        console.log("Music stopped.");
    };

    const drawVisualizer = () => {
        if (!canvasCtx || !canvas) return;

        visualizerFrame = requestAnimationFrame(drawVisualizer);

        const WIDTH = canvas.width;
        const HEIGHT = canvas.height;

        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.2)'; // Fade out
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

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
    };

    const playTrack = (trackIndex: number) => {
        stopMusic();
        isPaused = false;
        if (pauseButton) pauseButton.textContent = '⏸';
        currentTrackIndex = trackIndex;
        
        if (!playlist || playlist.length === 0) return;
        
        const track = playlist[trackIndex];
        if (trackNameSpan) trackNameSpan.textContent = track.name;
        // Link to the Node (wikilink) instead of User profile
        if (artistNameSpan) artistNameSpan.innerHTML = track.artist ? `by <a href="/${track.artist.replace('@','')}" target="_blank">${track.artist}</a>` : '';

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

        if (track.type === 'mid') {
            const ac = initAudioContext();
            
            // Import libraries if needed
            // Note: In a real build, these should be handled better, but preserving existing dynamic import pattern.
            import('soundfont-player').then(({ default: Soundfont }) => {
                import('midi-player-js').then(({ default: MidiPlayer }) => {
                    
                    Soundfont.instrument(ac, 'acoustic_grand_piano').then(function (instrument) {
                        const activeNotesDict: { [key: number]: any } = {};
                        
                        // We need to connect instrument to analyser if possible?
                        // soundfont-player usually connects to destination.
                        // Currently hard to hook into soundfont-player's internal node without modifying it.
                        // So we stick to note-event visualization for MIDI.

                        const player = new MidiPlayer.Player(function (event: any) {
                            if (event.name === 'Note on' && event.velocity > 0) {
                                instrument.play(event.noteName, ac.currentTime, { gain: (event.velocity / 100) * 2 });
                                activeMidiNotes[event.noteNumber] = event.velocity;
                                activeNotesDict[event.noteNumber] = true; // Track for Note off logic if needed
                            } else if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
                                // instrument handles decay usually
                                // We rely on visual decay in draw loop
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
                                // Convert to base64 for midi-player-js (it expects data URI or base64)
                                // Actually midi-player-js loadArrayBuffer is better if supported, but loadDataUri is standard.
                                const binary = new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '');
                                const base64 = btoa(binary);
                                const dataUri = `data:audio/midi;base64,${base64}`;
                                
                                player.loadDataUri(dataUri);
                                
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
                    });
                });
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
            console.log(`Playing Opus: ${track.name}`);
        }
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
                 fetch('/api/music/tracks')
                    .then(res => res.json())
                    .then(tracks => {
                        playlist = shuffle(tracks);
                        console.log("Loaded playlist:", playlist);
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
        const isMusicActive = JSON.parse(localStorage.getItem("ambient-music-active") || 'false');
        // If active on load, fetch playlist and start
        if (isMusicActive) {
             fetch('/api/music/tracks')
                .then(res => res.json())
                .then(tracks => {
                    playlist = shuffle(tracks);
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

        pauseButton?.addEventListener('click', () => {
            isPaused = !isPaused;
            if (isPaused) {
                // @ts-ignore
                if (musicPlayer && musicPlayer.isPlaying()) musicPlayer.pause();
                if (opusPlayer && !opusPlayer.paused) opusPlayer.pause();
                if (pauseButton) pauseButton.textContent = '▶️';
            } else {
                // @ts-ignore
                if (musicPlayer && !musicPlayer.isPlaying()) musicPlayer.play();
                if (opusPlayer && opusPlayer.paused) opusPlayer.play();
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
