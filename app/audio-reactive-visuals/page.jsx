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
import * as spotify from 'pages/api/spotify';
import gsap from 'gsap';
import Cookies from 'js-cookie';

// SVG component to display on hover
const HoverSVG = () => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="64"
        height="64"
        fill="none"
        className="hover-svg absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 transition duration-300 hover:opacity-100"
    >
        {/* Your SVG content */}
        <path d="M3 12L3 18.9671C3 21.2763 5.53435 22.736 7.59662 21.6145L10.7996 19.8727M3 8L3 5.0329C3 2.72368 5.53435 1.26402 7.59661 2.38548L20.4086 9.35258C22.5305 10.5065 22.5305 13.4935 20.4086 14.6474L14.0026 18.131"
            stroke="#fff"
            strokeWidth="1.5"
            strokeLinecap="round" />
    </svg>
);

export default function Page() {
    const [startExperience, setStartExperience] = useState(false);
    const [devToken, setDevToken] = useState(null);
    const [token, setToken] = useState(null);
    const [songs, setSongs] = useState([]);
    const [suggestedSongs, setSuggestedSongs] = useState([]);
    const [query, setQuery] = useState('');
    const [showPlayer, setShowPlayer] = useState(false);
    const [audioUrl, setAudioUrl] = useState('');
    const [songError, setSongError] = useState(false);
    const searchDelayRef = useRef(null); // Pour conserver le timeout
    const audioManager = useRef(null);
    const [userName, setUserName] = useState('');
    const [isLogged, setIsLogged] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [noPreviewsAvailable, setNoPreviewsAvailable] = useState(false);
    const [canUseFullTrack, setCanUseFullTrack] = useState(false);
    const [alternativeSources, setAlternativeSources] = useState(false);
    const [demoMode, setDemoMode] = useState(true);
    const [demoTracks, setDemoTracks] = useState([
        {
            id: 'demo1',
            name: 'Demo Track 1 - Electronic',
            artists: [{ name: 'Demo Artist' }],
            album: { name: 'Demo Album', images: [{ url: '/demo-covers/electronic.jpg' }] },
            preview_url: '/demo-tracks/electronic.mp3',
            has_preview: true
        },
        {
            id: 'demo2',
            name: 'Demo Track 2 - Rock',
            artists: [{ name: 'Demo Artist' }],
            album: { name: 'Demo Album', images: [{ url: '/demo-covers/rock.jpg' }] },
            preview_url: '/demo-tracks/rock.mp3',
            has_preview: true
        },
        {
            id: 'demo3',
            name: 'Demo Track 3 - Techno',
            artists: [{ name: 'Demo Artist' }],
            album: { name: 'Demo Album', images: [{ url: '/demo-covers/techno.jpg' }] },
            preview_url: '/demo-tracks/techno.mp3',
            has_preview: true
        }
    ]);

    useEffect(() => {
        const name = Cookies.get('spotify_user_name');
        if (name) {
            setUserName(name);
            console.log('User name:', name);
        }
    }, []);

    const handleLogout = () => {
        Cookies.remove('spotify_access_token');
        Cookies.remove('spotify_user_name');
        window.location.reload();  // Recharger la page pour mettre à jour l'état d'authentification
    };

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
                    setShowPlayer(false);
                    setSongError(false);
                    setAudioUrl(url);
                    setStartExperience(true);
                    
                        if (audioManager.current) {
                            audioManager.current.setSong(url);
                            audioManager.current.loadAudioBuffer().then(() => {
                                audioManager.current.play();
                            }).catch(err => {
                                console.error("Erreur lors du chargement de l'audio:", err);
                            });
                        }
                }
            });
        }
    };

    const handleOver = (song) => {
        // display hoversvg with gsap

    }

    useEffect(() => {
        audioManager.current = new AudioManager();
        const userToken = Cookies.get('spotify_access_token');
        // check if token is already in cookies
        console.log('User token:', userToken);
        
        setSongs(demoTracks);

        async function fetchToken() {
            setIsLogged(false);
            const response = await fetch('/api/getSpotifyToken');
            const data = await response.json();
            setDevToken(data.token);

            if (userToken) {
                setIsLogged(true);
                setToken(userToken);
                // fetch favorite tracks
                try {
                    const response = await fetch(`/api/spotify/favorites?token=${userToken}`);
                    const data = await response.json();
                    console.log('Favorite tracks:', data);
                    setSuggestedSongs(data.items);
                } catch (error) {
                    console.error('Error fetching favorites:', error);
                }
                return;
            } else {
                try {
                    const response = await fetch(`/api/spotify/trending?token=${data.token}`);
                    const trendingData = await response.json();
                    setSuggestedSongs(trendingData.items);
                } catch (error) {
                    console.error('Error fetching trending songs:', error);
                }
            }
        }

        fetchToken();
    }, []);

    useEffect(() => {
        if (searchDelayRef.current) {
            clearTimeout(searchDelayRef.current);
        }

        searchDelayRef.current = setTimeout(() => {
            if (query) {
                setNoPreviewsAvailable(false);
                fetch(`/api/spotify/search?query=${encodeURIComponent(query)}&token=${devToken}`)
                    .then(response => response.json())
                    .then(data => {
                        const songs = data.tracks.items;
                        songs.forEach(song => song.hovered = false);
                        const hasAnyPreview = songs.some(song => song.preview_url);
                        setNoPreviewsAvailable(!hasAnyPreview);
                        setSongs(songs);
                    })
                    .catch(error => {
                        console.error('Error searching songs:', error);
                    });
            }
        }, 1000);

        return () => {
            if (searchDelayRef.current) {
                clearTimeout(searchDelayRef.current);
            }
        };
    }, [query]);

    useEffect(() => {
        gsap.from('.selectable-card', {
            duration: 1,
            autoAlpha: 0,
            y: 50,
            stagger: 0.2,
            ease: 'power3.out',
        });
    }, [songs]);

    useEffect(() => {
        const handleKeyPress = async (event) => {
            if (event.code === 'Escape') {
                if (startExperience && audioManager.current && audioManager.current.audio) {
                    audioManager.current.isPlaying ? audioManager.current.pause() : audioManager.current.play();
                    showPlayer ? setShowPlayer(false) : setShowPlayer(true);
                } else {
                    showPlayer ? setShowPlayer(false) : setShowPlayer(true);
                }
            }
            if (event.code === 'Enter') {
                if (showPlayer) {
                    onSearch(query);
                }
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
        };
    }, [token, startExperience, query])


    const onSearch = (query) => {
        setSearchLoading(true);
        setNoPreviewsAvailable(false);
        fetch(`/api/spotify/search?query=${encodeURIComponent(query)}&token=${devToken}`)
            .then(response => response.json())
            .then(data => {
                const songs = data.tracks.items;
                songs.forEach(song => song.hovered = false);
                const hasAnyPreview = songs.some(song => song.preview_url);
                setNoPreviewsAvailable(!hasAnyPreview);
                setSongs(songs);
                setSearchLoading(false);
            })
            .catch(error => {
                console.error('Error searching songs:', error);
                setSearchLoading(false);
            });
    };

    return (
        <div className="h-screen flex flex-col justify-center items-center bg-black font-metrotime">
            {!startExperience && !showPlayer && (
                <div className="fixed top-4 right-4 z-10">
                    <div className={`px-4 py-2 rounded text-white ${demoMode ? 'bg-green-700' : 'bg-gray-700'}`}>
                        {demoMode ? 'Mode Démo' : 'Mode Spotify'}
                    </div>
                </div>
            )}
            
            {/* Afficher un message de mode démo quand il est activé */}
            {demoMode && !startExperience && (
                <div className="fixed top-16 right-4 z-10 bg-green-900 bg-opacity-80 p-3 rounded shadow-lg max-w-xs">
                    <p className="text-white text-sm mb-2">
                        Mode démo actif : utilisez les morceaux préchargés pour tester l'expérience sans Spotify. (Spotify ne renvoie plus de prévisualisations audio)
                    </p>
                </div>
            )}
            
            {/* Condition de rendu pour les résultats de recherche */}
            {showPlayer && (
                <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-90 flex justify-center items-center">
                    <div className="w-full h-full p-10 grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Column for trending songs */}
                        <div className="col-span-1 md:col-span-2 flex flex-col">
                            <h1 className="text-white text-2xl mb-4">
                                {
                                    isLogged ? 'Your fav songs' : 'Trending songs'
                                }
                            </h1>
                            {suggestedSongs && suggestedSongs.length > 0 && suggestedSongs.map((song) => (
                                <div
                                    onClick={() => handleClick(song.track.preview_url)}
                                    onMouseOver={() => handleOver(song.track)}
                                    onMouseLeave={() => song.track.hovered = false}
                                    key={song.track.id}
                                    className={`flex m-2 bg-transparent rounded overflow-hidden shadow-md transition duration-300 hover:border-white ${(!song.track.preview_url && !song.track.has_preview) && 'opacity-50 pointer-events-none'}`}
                                    style={{ cursor: (song.track.preview_url || song.track.has_preview) ? 'pointer' : 'default' }}
                                >
                                    <div className="relative w-24 h-24">
                                        <img
                                            src={song.track.album.images[0].url}
                                            alt={`Cover for ${song.track.album.name}`}
                                            className="object-cover w-full h-full"
                                        />
                                        <span>
                                            <HoverSVG />
                                        </span>
                                    </div>
                                    <div className="flex flex-col justify-center ml-4">
                                        <p className="text-white truncate text-lg">{song.track.name.length > 20 ? `${song.track.name.substring(0, 20)}...` : song.track.name}</p>
                                        <p className='text-gray-500 text-sm'>{song.track.artists.map(artist => artist.name).join(', ')}</p>
                                        <p className="text-gray-500 text-sm">{song.track.album.name}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Search bar and search button */}
                        <div className="col-span-1 flex flex-col justify-start">
                            <input
                                className="w-full mb-2 bg-transparent border-b border-white px-4 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none"
                                placeholder="SEARCH FOR A SONG..."
                                onChange={(e) => setQuery(e.target.value)}
                                value={query}
                            />
                            <button
                                className="w-full bg-transparent border border-white px-4 py-2 text-white hover:bg-white hover:text-black transition duration-300"
                                onClick={() => onSearch(query)}
                            >
                                Search
                            </button>
                            
                            {noPreviewsAvailable && (
                                <div className="mt-4 p-3 bg-red-900 bg-opacity-50 text-white rounded">
                                    <p className="text-sm mb-2">
                                        Spotify a restreint l'accès aux prévisualisations audio pour ces morceaux. 
                                        Voici quelques solutions :
                                    </p>
                                    <ul className="list-disc list-inside text-xs space-y-1">
                                        <li>Essayez une autre recherche ou des artistes plus populaires</li>
                                        <li>Essayez cette recherche sur une autre région (US, UK)</li>
                                        <li>Connectez-vous avec votre compte Spotify Premium</li>
                                    </ul>
                                    <div className="mt-3 flex justify-between">
                                        <button 
                                            onClick={() => onSearch('The Beatles')}
                                            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                        >
                                            Essayer "The Beatles"
                                        </button>
                                        <button 
                                            onClick={() => onSearch('Michael Jackson')}
                                            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                        >
                                            Essayer "Michael Jackson"
                                        </button>
                                        <button 
                                            onClick={() => onSearch('Queen')}
                                            className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded hover:bg-opacity-30"
                                        >
                                            Essayer "Queen"
                                        </button>
                                    </div>
                                </div>
                            )}
                            
                            {
                                /* Display songs from search */
                                searchLoading ? (
                                    <div className="text-white text-center mt-4">Loading...</div>
                                ) :
                                    (
                                        songs.map((song) => (
                                            <div
                                                onClick={() => handleClick(song.preview_url)}
                                                onMouseOver={() => handleOver(song)}
                                                onMouseLeave={() => song.hovered = false}
                                                key={song.id}
                                                className={`flex m-2 bg-transparent rounded overflow-hidden shadow-md transition duration-300 hover:border-white ${(!song.preview_url && !song.has_preview) && 'opacity-50 pointer-events-none'}`}
                                                style={{ cursor: (song.preview_url || song.has_preview) ? 'pointer' : 'default' }}
                                            >
                                                <div className="relative w-24 h-24">
                                                    <img
                                                        src={song.album.images[0].url}
                                                        alt={`Cover for ${song.album.name}`}
                                                        className="object-cover w-full h-full"
                                                    />
                                                    <span>
                                                        <HoverSVG />
                                                    </span>
                                                </div>
                                                <div className="flex flex-col justify-center ml-4">
                                                    <p className="text-white truncate text-lg">{song.name.length > 20 ? `${song.name.substring(0, 20)}...` : song.name}</p>
                                                    <p className='text-gray-500 text-sm'>{song.artists.map(artist => artist.name).join(', ')}</p>
                                                    <p className="text-gray-500 text-sm">{song.album.name}</p>
                                                </div>
                                            </div>
                                        ))
                                    )
                            }
                        </div>

                        {/* Account / login link */}
                        <div>
                            {userName ? (
                                <div className="text-white hover:text-gray-500 transition duration-300">
                                    <span>{userName + ' '}</span>
                                    <button onClick={handleLogout}> (Déconnexion)</button>
                                </div>
                            ) : (
                                <a href="/api/auth/spotify" className="text-white hover:text-gray-500 transition duration-300">
                                    Login
                                </a>
                            )}
                        </div>
                    </div>
                </div>


            )}
            {(!startExperience && !showPlayer) && (
                <div className='search-layout'>
                    <div className="w-full flex flex-col justify-center items-center fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        {!demoMode ? (
                            <>
                                <input
                                    className="w-1/4 mb-24 bg-transparent border-b border-white px-4 py-2 text-white placeholder-white placeholder-opacity-50 focus:outline-none"
                                    placeholder="SEARCH FOR A SONG..."
                                    onChange={(e) => setQuery(e.target.value)}
                                    value={query}
                                />
                                <div className="mt-4">
                                    <button
                                        onClick={() => {
                                            setDemoMode(true);
                                            setSongs(demoTracks);
                                        }}
                                        className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded transition duration-300"
                                    >
                                        Revenir au mode démo
                                    </button>
                                </div>
                            </>
                        ) : (
                            <>
                                <h2 className="text-white text-2xl mb-24">Sélectionnez un morceau démo ci-dessous</h2>
                              
                            </>
                        )}
                    </div>
                    
                    <div className="flex flex-wrap justify-center items-center w-full mt-72">
                        {songs.map((song) => (
                            <div
                                onClick={() => handleClick(song.preview_url)}
                                onMouseOver={() => handleOver(song)}
                                onMouseLeave={() => song.hovered = false}
                                key={song.id}
                                className={`m-4 w-64 selectable-card ${(!song.preview_url && !song.has_preview) && 'opacity-50 pointer-events-none '}`}
                                style={{ cursor: (song.preview_url || song.has_preview) ? 'pointer' : 'default' }}
                            >
                                <div className=" bg-transparent rounded overflow-hidden shadow-md border border-transparent transition duration-300 hover:border-white relative">
                                    <div className='relative'>
                                        <img
                                            src={song.album.images[0].url}
                                            alt={`Cover for ${song.album.name}`}
                                            className="w-full h-40 object-cover"
                                        />
                                        <span>
                                            <HoverSVG />
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
            {(startExperience && !showPlayer) && (
                <>
                    {/* Tell to press escape to play/pause the song */}

                    <Canvas camera={{ position: [0, 0, 20], fov: 30 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                        <pointLight position={[-10, -10, -10]} />
                        <DynamicGeometry audioManager={audioManager} audioUrl={audioUrl} vertexShader={vertexShader} fragmentShader={fragmentShader} />
                        <OrbitControls />
                    </Canvas>
                </>
            )}
            {
                !showPlayer && (
                    <div className="fixed top-0 left-0 ">
                        <small className="text-white">Press <span className="text-red-500">Escape</span> to play/pause the song</small>
                    </div>
                )
            }
        </div>
    );
}
