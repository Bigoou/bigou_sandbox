"use client"
import React, { useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import AudioManager from './managers/AudioManager';
import BPMManager from './managers/BPMManager';
import vertexShader from './glsl/shader.vert';
import fragmentShader from './glsl/shader.frag';
import DynamicGeometry from './components/DynamicGeometry';

export default function Page() {
    const audioManager = useRef(null);
    const bpmManager = useRef(null);

    useEffect(() => {
        audioManager.current = new AudioManager();
        bpmManager.current = new BPMManager();

        const setupAudioAndBPM = async () => {
            await audioManager.current.loadAudioBuffer();
            await bpmManager.current.detectBPM(audioManager.current.audio.buffer);
            bpmManager.current.addEventListener('beat', () => {
                console.log('Beat detected');
            });
        };

        setupAudioAndBPM();

        return () => {
            bpmManager.current.removeEventListener('beat');
        };
    }, []);

    return (
        <div className="h-screen flex justify-center items-center bg-black">
            <Canvas camera={{ position: [0, 0, 20], fov: 75 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-0, -0, -0]} />
                <DynamicGeometry vertexShader={vertexShader} fragmentShader={fragmentShader} />
                <OrbitControls
                />
            </Canvas>
        </div>
    );
}
