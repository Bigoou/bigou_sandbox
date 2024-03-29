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

export default function Page() {

    const [startExperience, setStartExperience] = useState(false);
    const [token, setToken] = useState(null);
    const [songs, setSongs] = useState([]);
    const [query, setQuery] = useState('');
    const [audioUrl, setAudioUrl] = useState('');
    const searchDelayRef = useRef(null); // Pour conserver le timeout

    const handleClick = (url) => {
        setAudioUrl(url);
        setStartExperience(true);
    };

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
                    setSongs(data.tracks.items);
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


    const onSearch = (query) => {
        searchSpotify(query, token).then((data) => {
            setSongs(data.tracks.items);
        });
    };



    // const position = useRef({ x: 0, y: 0, z: 10 });

    // gsap.to(position, {
    //     duration: 0.6,
    //     z: THREE.MathUtils.randInt(9, 11), // Random depth positioning within a range
    //     ease: 'elastic.out(0.8)', // Elastic ease-out for a bouncy effect
    // })
    return (
        <div className="h-screen flex flex-col justify-center items-center bg-black">
            {!startExperience ? (
                // search input
                <div>
                    <input
                        className="mb-4 px-4 py-2 text-black bg-white rounded"
                        placeholder="Search for a song..."
                        onChange={(e) => setQuery(e.target.value)}
                        value={query}
                    />
                    <div className="mb-4">
                        {songs.map((song) => (
                            <div key={song.id} className="flex items-center justify-between px-4 py-2 rounded">
                                {/* Afficher la couverture de l'album */}
                                <img
                                    src={song.album.images[0].url} // Prend la première image (la plus grande)
                                    alt={`Cover for ${song.album.name}`}
                                    className="w-20 h-20 object-cover mr-4" // Taille de l'image, ajustez selon le besoin
                                />
                                <div>
                                    <p className="text-white">{song.name} - {song.artists.map(artist => artist.name).join(', ')}</p>
                                    <p className="text-gray-500">{song.album.name}</p>
                                </div>
                                <button
                                    className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 transition duration-150"
                                    onClick={() => handleClick(song.preview_url)}
                                >
                                    Start Experience
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
                // <button
                //     className="mb-4 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 transition duration-150"
                //     onClick={handleClick}
                // >
                //     Start Experience
                // </button>
            ) : (
                <Canvas camera={{ position: [0, 0, 20], fov: 30 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} />
                    <DynamicGeometry audioUrl={audioUrl} vertexShader={vertexShader} fragmentShader={fragmentShader} />
                    <OrbitControls />
                </Canvas>
            )}
        </div>
    )
}
