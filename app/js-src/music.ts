
// app/js-src/music.ts

import { makeDraggable } from './draggable';

export function initMusicPlayer() {
    const musicPlayerContainer = document.getElementById('music-player-container');
    const musicCheckboxes = document.querySelectorAll(".music-checkbox-input") as NodeListOf<HTMLInputElement>;
    const musicCloseButton = document.getElementById('music-player-close-btn');
    let musicPlayer: any = null;

    const stopMusic = () => {
        if (musicPlayer) {
            musicPlayer.stop();
            musicPlayer = null;
            console.log("Ambient music stopped.");
        }
    };

    const setMusicState = (isPlaying: boolean) => {
        localStorage.setItem("ambient-music-active", JSON.stringify(isPlaying));
        musicCheckboxes.forEach(checkbox => {
            checkbox.checked = isPlaying;
        });

        if (isPlaying) {
            // Only show the player if it wasn't manually closed.
            const isPlayerVisible = JSON.parse(localStorage.getItem("music-player-visible") || 'true');
            if (isPlayerVisible) {
                musicPlayerContainer.classList.add('active');
            }

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
                        musicPlayer = player;
                        fetch('/static/mid/burup.mid')
                            .then(response => response.arrayBuffer())
                            .then(arrayBuffer => {
                                const base64 = btoa(new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
                                const dataUri = `data:audio/midi;base64,${base64}`;
                                player.loadDataUri(dataUri);
                                player.play();
                                console.log("Ambient music started.");
                            });
                    });
                });
            });
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

        musicCloseButton?.addEventListener('click', () => {
            // This will turn off the music, uncheck the toggles, and hide the player.
            setMusicState(false);
        });
    }

    // Make the Music player draggable
    const musicDragHandle = document.getElementById('music-player-header');
    if (musicPlayerContainer && musicDragHandle) {
        makeDraggable(musicPlayerContainer, musicDragHandle, 'music-player-position');
    }
}
