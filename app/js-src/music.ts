// app/js-src/music.ts

import { makeDraggable } from './draggable';

export function initMusicPlayer() {
    const musicPlayerContainer = document.getElementById('music-player-container');
    const musicCheckboxes = document.querySelectorAll(".music-checkbox-input") as NodeListOf<HTMLInputElement>;
    const musicCloseButton = document.getElementById('music-player-close-btn');
    const prevButton = document.getElementById('music-player-prev');
    const pauseButton = document.getElementById('music-player-pause');
    const nextButton = document.getElementById('music-player-next');
    const trackNameSpan = document.getElementById('music-player-track-name');
    const artistNameSpan = document.getElementById('music-player-artist-name');
    const autoplayMessage = document.getElementById('music-player-autoplay-message');
    const musicControls = document.getElementById('music-player-controls');

    let musicPlayer: any = null;
    let opusPlayer: HTMLAudioElement | null = null;
    let currentTrackIndex = 0;
    let isPaused = false;

    const playlist = [
        { name: "Burup", path: '/static/mid/burup.mid', artist: "@flancian", artistUrl: "/@flancian" },
        { name: "Rainbow Folding", path: 'https://anagora.org/assets/rainbow-folding-64.opus', artist: "Heinali", artistUrl: "https://www.heinali.info/" }
    ];

    const stopMusic = () => {
        if (musicPlayer) {
            musicPlayer.stop();
            musicPlayer = null;
        }
        if (opusPlayer) {
            opusPlayer.pause();
            opusPlayer.src = "";
            opusPlayer = null;
        }
        console.log("Music stopped.");
    };

    const playTrack = (trackIndex: number) => {
        stopMusic();
        isPaused = false;
        pauseButton.textContent = '⏸';
        currentTrackIndex = trackIndex;
        const track = playlist[trackIndex];
        trackNameSpan.textContent = track.name;
        artistNameSpan.innerHTML = `by <a href="${track.artistUrl}" target="_blank">${track.artist}</a>`;

        if (track.path.endsWith('.mid')) {
            // Dynamically import and start music
            import('soundfont-player').then(({ default: Soundfont }) => {
                import('midi-player-js').then(({ default: MidiPlayer }) => {
                    const ac = new AudioContext();
                    Soundfont.instrument(ac, 'acoustic_grand_piano').then(function (instrument) {
                        const activeNotes: { [key: number]: any } = {};
                        const player = new MidiPlayer.Player(function (event: any) {
                            if (event.name === 'Note on' && event.velocity > 0) {
                                const note = instrument.play(event.noteName, ac.currentTime, { gain: (event.velocity / 100) * 5 });
                                activeNotes[event.noteNumber] = note;
                            } else if (event.name === 'Note off' || (event.name === 'Note on' && event.velocity === 0)) {
                                if (activeNotes[event.noteNumber]) {
                                    activeNotes[event.noteNumber].stop();
                                    delete activeNotes[event.noteNumber];
                                }
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
                                const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                                const dataUri = `data:audio/midi;base64,${base64}`;
                                player.loadDataUri(dataUri);
                                if (ac.state === 'suspended') {
                                    musicControls.style.display = 'none';
                                    autoplayMessage.style.display = 'block';
                                    autoplayMessage.textContent = '▶️ Click to play';
                                } else {
                                    player.play();
                                }
                                console.log(`Playing MIDI: ${track.name}`);
                            });
                    });
                });
            });
        } else if (track.path.endsWith('.opus')) {
            opusPlayer = new Audio(track.path);
            opusPlayer.loop = false; // We want to advance to the next track, not loop this one.
            const playPromise = opusPlayer.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    if (error.name === 'NotAllowedError') {
                        console.warn('Autoplay was prevented. Showing "Click to play" message.');
                        musicControls.style.display = 'none';
                        autoplayMessage.style.display = 'block';
                        autoplayMessage.textContent = '▶️ Click to play';
                    } else {
                        console.error('An error occurred during playback:', error);
                    }
                });
            }
            opusPlayer.addEventListener('ended', () => {
                console.log('Opus file finished, playing next track.');
                playTrack((currentTrackIndex + 1) % playlist.length);
            });
            console.log(`Playing Opus: ${track.name}`);
        }
    };

    const setMusicState = (isPlaying: boolean) => {
        localStorage.setItem("ambient-music-active", JSON.stringify(isPlaying));
        musicCheckboxes.forEach(checkbox => {
            checkbox.checked = isPlaying;
        });

        if (isPlaying) {
            const isPlayerVisible = JSON.parse(localStorage.getItem("music-player-visible") || 'true');
            if (isPlayerVisible) {
                musicPlayerContainer.classList.add('active');
            }
            playTrack(currentTrackIndex);
        } else {
            musicPlayerContainer.classList.remove('active');
            stopMusic();
        }
    };

    if (musicCheckboxes.length > 0) {
        const isMusicActive = JSON.parse(localStorage.getItem("ambient-music-active") || 'false');
        setMusicState(isMusicActive);

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
            musicControls.style.display = 'flex'; // Use flex to match the original display style
            playTrack(currentTrackIndex);
        });

        musicCloseButton?.addEventListener('click', () => {
            setMusicState(false);
        });

        pauseButton?.addEventListener('click', () => {
            isPaused = !isPaused;
            if (isPaused) {
                musicPlayer?.pause();
                opusPlayer?.pause();
                pauseButton.textContent = '▶️';
            } else {
                musicPlayer?.play();
                opusPlayer?.play();
                pauseButton.textContent = '⏸';
            }
        });

        nextButton?.addEventListener('click', () => {
            playTrack((currentTrackIndex + 1) % playlist.length);
        });

        prevButton?.addEventListener('click', () => {
            playTrack((currentTrackIndex - 1 + playlist.length) % playlist.length);
        });
    }

    // Make the Music player draggable
    const musicDragHandle = document.getElementById('music-player-header');
    if (musicPlayerContainer && musicDragHandle) {
        makeDraggable(musicPlayerContainer, musicDragHandle, 'music-player-position');
    }
}