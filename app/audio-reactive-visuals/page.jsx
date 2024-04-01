"use client"

import React, { useRef, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AudioManager from './managers/AudioManager';
import BPMManager from './managers/BPMManager';
import vertexShader from './glsl/shader.vert';
import fragmentShader from './glsl/shader.frag';
import DynamicGeometry from './components/DynamicGeometry';
import * as THREE from 'three';
import { getSpotifyToken, searchSpotify } from 'pages/api/spotify';
import gsap from 'gsap';

// SVG component to display on hover
const HoverSVG = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="64"
        height="64"
        fill="none"
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
    >
        {/* Your SVG content */}
        <path d="M3 12L3 18.9671C3 21.2763 5.53435 22.736 7.59662 21.6145L10.7996 19.8727M3 8L3 5.0329C3 2.72368 5.53435 1.26402 7.59661 2.38548L20.4086 9.35258C22.5305 10.5065 22.5305 13.4935 20.4086 14.6474L14.0026 18.131"
            stroke="#fff"
            stroke-width="1.5"
            stroke-linecap="round" />
    </svg>
);

export default function Page() {
    const [startExperience, setStartExperience] = useState(false);
    const [token, setToken] = useState(null);
    const [songs, setSongs] = useState([]);
    const [query, setQuery] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const [songError, setSongError] = useState(false);
    const searchDelayRef = useRef(null); // Pour conserver le timeout

    const handleClick = (url) => {
        if (!url) {
            setSongError(true);
            return;
        } else {
            gsap.to('.search-layout', {
                y: '100%',
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    setSongError(false);
                    setAudioUrl(url);
                    setStartExperience(true);
                }
            });
        }
    };

    const handleOver = (song) => {
        // display play svg on hover and add a hovered class
        // song.preview_url && gsap.to('.selectable-card', { opacity: 0.5, duration: 0.3 });
        song.hovered = true;

    }

    useEffect(() => {
        if (!token) {
            async function fetchToken() {
                const response = await fetch('/api/getSpotifyToken');
                const data = await response.json();
                setToken(data.token);
            }

            fetchToken();
        }
    }, []);

    useEffect(() => {
        // Annule le délai précédent à chaque modification de la requête
        if (searchDelayRef.current) {
            clearTimeout(searchDelayRef.current);
        }

        // Ne lance pas la recherche immédiatement; attend 1 seconde.
        searchDelayRef.current = setTimeout(() => {
            if (query) {
                searchSpotify(query, token).then((data) => {
                    const songs = data.tracks.items;
                    songs.forEach(song => song.hovered = false);
                    setSongs(songs);
                });
            }
        }, 1000); // Attend 1 seconde avant d'exécuter la recherche

        // Nettoyage du useEffect
        return () => {
            if (searchDelayRef.current) {
                clearTimeout(searchDelayRef.current);
            }
        };
    }, [query]); // Ce useEffect s'exécute à chaque changement de 'query'

    // Animation des cartes successivement avec GSAP
    useEffect(() => {
        gsap.from('.selectable-card', {
            duration: 1,
            autoAlpha: 0,
            y: 50,
            stagger: 0.2,
            ease: 'power3.out',
        });
    }, [songs]);

    const onSearch = (query) => {
        searchSpotify(query, token).then((data) => {
            setSongs(data.tracks.items);
        });
    };

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-black font-metrotime">
            {/* Condition de rendu pour les résultats de recherche */}
            {!startExperience && (
                <div className='search-layout'>
                    <div className="w-full flex flex-col justify-center items-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <input
                            className="w-1/4 mb-24 bg-transparent border-b border-white px-4 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none"
                            placeholder="SEARCH FOR A SONG..."
                            onChange={(e) => setQuery(e.target.value)}
                            value={query}
                        />
                    </div>
                    <div className="flex flex-wrap justify-center items-center w-full mt-72">
                        {songs.map((song) => (
                            <div
                                onClick={() => handleClick(song.preview_url)}
                                onMouseOver={() => handleOver(song)}
                                onMouseLeave={() => song.hovered = false}
                                key={song.id}
                                className={`m-4 w-64 selectable-card ${!song.preview_url && 'opacity-50 pointer-events-none '}`}
                                style={{ cursor: song.preview_url ? 'pointer' : 'default' }}
                            >
                                <div className=" bg-transparent rounded overflow-hidden shadow-md border border-transparent transition duration-300 hover:border-white relative">
                                    <div className='relative'>
                                        <img
                                            src={song.album.images[0].url}
                                            alt={`Cover for ${song.album.name}`}
                                            className="w-full h-40 object-cover"
                                        />
                                        <span>
                                            {song.hovered && <HoverSVG />}
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 text-center">
                                        <p className="text-white truncate">{song.name.length > 45 ? `${song.name.substring(0, 45)}...` : song.name}</p>
                                        <p className='text-gray-500'>{song.artists.map(artist => artist.name).join(', ')}</p>
                                        <p className="text-gray-500">{song.album.name}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Condition de rendu pour la scène */}
            {startExperience && (
                <Canvas camera={{ position: [0, 0, 20], fov: 30 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} />
                    <DynamicGeometry audioUrl={audioUrl} vertexShader={vertexShader} fragmentShader={fragmentShader} />
                    <OrbitControls />
                </Canvas>
            )}
        </div>
    );
}
