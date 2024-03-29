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

export default function Page() {

    const [startExperience, setStartExperience] = useState(false);

    const handleClick = () => {
        console.log('Starting experience');
        setStartExperience(true);
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
                <button
                    className="mb-4 px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-700 transition duration-150"
                    onClick={handleClick}
                >
                    Start Experience
                </button>
            ) : (
                <Canvas camera={{ position: [0, 0, 20], fov: 30 }}>
                    <ambientLight intensity={0.5} />
                    <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                    <pointLight position={[-10, -10, -10]} />
                    <DynamicGeometry vertexShader={vertexShader} fragmentShader={fragmentShader} />
                    <OrbitControls />
                </Canvas>
            )}
        </div>
    )
}
