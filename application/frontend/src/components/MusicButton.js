import React, { useState, useRef, useEffect } from 'react';
import track1 from "../assets/music/Cartoon, Jéja - C U Again ft. Mikk Mäe (Cartoon, Jéja, Futuristik VIP).mp3";
import track2 from "../assets/music/Cartoon, Jéja - On & On (feat. Daniel Levi).mp3";
import track3 from "../assets/music/Cartoon, Jéja - Why We Lose (feat. Coleman Trapp).mp3";
import track4 from "../assets/music/Defqwop - Heart Afire (feat. Strix).mp3";
import '../styles/MusicButton.css';

const tracks = [
    { title: "C U Again", src: track1 },
    { title: "On & On", src: track2 },
    { title: "Why We Lose", src: track3 },
    { title: "Heart Afire", src: track4 },
];

function MusicButton() {
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
    const [playing, setPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef(new Audio(tracks[0].src));

    useEffect(() => {
        const audio = audioRef.current;

        // Update the slider based on the current time of the audio
        const updateProgress = () => {
            setCurrentTime(audio.currentTime);
        };

        audio.addEventListener('timeupdate', updateProgress);

        return () => {
            audio.removeEventListener('timeupdate', updateProgress);
            audio.pause();
        };
    }, []);

    useEffect(() => {
        const audio = audioRef.current;
        if (playing) {
            audio.play();
        } else {
            audio.pause();
        }
    }, [playing]);

    useEffect(() => {
        const audio = audioRef.current;
        audio.src = tracks[currentTrackIndex].src;
        setPlaying(false);
        setCurrentTime(0); // Reset time when track changes
    }, [currentTrackIndex]);

    const togglePlayPause = () => {
        setPlaying(!playing);
    };

    const handleSeek = (e) => {
        const audio = audioRef.current;
        audio.currentTime = e.target.value;
        setCurrentTime(audio.currentTime);
    };

    return (
        <div className='MusicButton'>
            <h2>{"Currently Playing: " + tracks[currentTrackIndex].title}</h2>
            <div className="controls">
                <button onClick={togglePlayPause}>
                    {playing ? '⏸️' : '▶️'}
                </button>
                <input
                    type="range"
                    min="0"
                    max={audioRef.current.duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                />
                <div className="track-list">
                    {tracks.map((track, index) => (
                        <div key={index} className="track-item">
                            <button onClick={() => setCurrentTrackIndex(index)}>
                                {track.title}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
    
}

export default MusicButton;