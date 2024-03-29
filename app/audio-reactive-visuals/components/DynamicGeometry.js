"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import BPMManager from '../managers/BPMManager';
import AudioManager from '../managers/AudioManager';
import gsap from 'gsap'


export default function DynamicGeometry({ vertexShader, fragmentShader }) {
    const meshRef = useRef();
    const { scene } = useThree();
    const timeRef = useRef(0);
    const audioManager = useRef(null);
    const bpmManager = useRef(null);
    const materialRef = useRef();

    const geometryControls = useControls('Geometry Controls', {
        meshType: { value: 'Cylinder', options: ['Cube', 'Cylinder'] },
        width: { value: 10, min: 5, max: 20 },
        radius: { value: 5, min: 1, max: 10 },
        height: { value: 10, min: 1, max: 40 },
        depth: { value: 12, min: 5, max: 80 },
        autoRotate: true,
        autoRandom: false,
        frequency: { value: 0, min: 2.5, max: 5 },
        amplitude: { value: 1.5, min: 0, max: 3 },
        startColor: '#ff0000',
        endColor: '#0000ff',
    });

    const updateGeometry = (controls) => {
        if (!meshRef.current) return;
        let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20))
        let heightSeg = Math.floor(THREE.MathUtils.randInt(10, 40))
        let depthSeg = Math.floor(THREE.MathUtils.randInt(20, 80))
        let geometry;
        if (controls.meshType === 'Cube') {
            geometry = new THREE.BoxGeometry(controls.width, controls.height, controls.depth, controls.widthSeg, controls.heightSeg, controls.depthSeg);
        } else {
            geometry = new THREE.CylinderGeometry(controls.radius, controls.radius, controls.height, controls.depthSeg, controls.heightSeg, false);
        }
        meshRef.current.geometry.dispose(); // Dispose of the old geometry
        meshRef.current.geometry = geometry; // Assign the new geometry
    };

    const updateMaterialUniforms = (controls) => {
        if (!meshRef.current) return;

        meshRef.current.material.uniforms.frequency.value = controls.frequency;
        meshRef.current.material.uniforms.amplitude.value = controls.amplitude;
        meshRef.current.material.uniforms.startColor.value.set(controls.startColor);
        meshRef.current.material.uniforms.endColor.value.set(controls.endColor);
    };

    const setRandomControls = () => {
        geometryControls.meshType = Math.random() > 0.5 ? 'Cube' : 'Cylinder';
        if (geometryControls.meshType === 'Cube') {
            geometryControls.width = THREE.MathUtils.randInt(5, 20);
            geometryControls.height = THREE.MathUtils.randInt(1, 40);
            geometryControls.depth = THREE.MathUtils.randInt(5, 80);
        } else {
            geometryControls.radius = Math.random() * 10;
            geometryControls.height = THREE.MathUtils.randInt(1, 40);
        }
        geometryControls.frequency = Math.random() * 5;
        geometryControls.amplitude = Math.random() * 3;
        geometryControls.startColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
        geometryControls.endColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
    }

    const createBoxMesh = (controls) => {
        let geometry;
        let widthSeg = Math.floor(THREE.MathUtils.randInt(5, 20))
        let heightSeg = Math.floor(THREE.MathUtils.randInt(10, 40))
        let depthSeg = Math.floor(THREE.MathUtils.randInt(20, 80))
        if (controls.meshType === 'Cube') {
            geometry = new THREE.BoxGeometry(controls.width, controls.height, controls.depth, widthSeg, heightSeg, depthSeg);
        } else {
            geometry = new THREE.CylinderGeometry(controls.radius, controls.radius, controls.height, controls.depthSeg, heightSeg, false);
        }
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                time: { value: 0 },
                frequency: { value: controls.frequency },
                amplitude: { value: controls.amplitude },
                offsetSize: { value: 2 },
                size: { value: 6 },
                offsetGain: { value: 0.5 },
                maxDistance: { value: 1.8 },
                startColor: { value: new THREE.Color(controls.startColor) },
                endColor: { value: new THREE.Color(controls.endColor) }
            },
        });
        materialRef.current = material;

        const pointsMesh = new THREE.Points(geometry, materialRef.current);

        // Animate the rotation of the of the container
        gsap.to(pointsMesh.rotation, {
            duration: 3,
            x: Math.random() * Math.PI,
            z: Math.random() * Math.PI * 2,
            ease: 'none', // No easing for a linear animation
        })

        meshRef.current = pointsMesh;

        scene.add(pointsMesh);

        return () => {
            scene.remove(pointsMesh);
        };
    }

    const onBPMBeat = () => {
        // Calculate a reduced duration based on the BPM (beats per minute) duration
        const duration = bpmManager.current.getBPMDuration() / 100

        if (audioManager.isPlaying) {
            if (Math.random() < 0.3 && geometryControls.autoRotate) {
                gsap.to(meshRef.current.rotation, {
                    duration: Math.random() < 0.8 ? 15 : duration,
                    // y: Math.random() * Math.PI * 2,
                    z: Math.random() * Math.PI,
                    ease: 'elastic.out(0.2)',
                })

            }

            // Randomly decide whether to reset the mesh
            if (Math.random() < 0.3) {
                this.resetMesh()
            }
        }
    }


    useEffect(() => {
        audioManager.current = new AudioManager();
        bpmManager.current = new BPMManager();
        const setupAudioAndBPM = async () => {
            await audioManager.current.loadAudioBuffer();
            await bpmManager.current.detectBPM(audioManager.current.audio.buffer);
            bpmManager.current.addEventListener('beat', () => {
                onBPMBeat()
            })
            // document.querySelector('.user_interaction').remove()
            audioManager.current.play()
        };

        setupAudioAndBPM();

        return () => {
            bpmManager.current.removeEventListener('beat');
        };
    }, []);

    useEffect(() => {
        // if no mesh is created yet, create one
        if (!meshRef.current) {
            createBoxMesh(geometryControls);
        } else {
            // update mesh with new controls
            updateGeometry(geometryControls);
            updateMaterialUniforms(geometryControls);
        }
    }, [geometryControls]);

    useFrame(() => {
        if (geometryControls.autoRotate && meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }

        if (audioManager.current && audioManager.current.isPlaying && audioManager.current.frequencyData) {
            audioManager.current.update();
            console.log(audioManager.current.frequencyData);
            const { high, mid, low } = audioManager.current.frequencyData;
            materialRef.current.uniforms.amplitude.value = geometryControls.amplitude + THREE.MathUtils.mapLinear(high, 0, 0.6, -0.1, 0.2);
            materialRef.current.uniforms.offsetGain.value = mid * 3.6;

            const t = THREE.MathUtils.mapLinear(low, 1.2, 2, 0.4, 1);
            timeRef.current += THREE.MathUtils.clamp(t, 0.2, 0.5);
            materialRef.current.uniforms.time.value = timeRef.current;
        } else {
            materialRef.current.uniforms.frequency.value = 0.8;
            materialRef.current.uniforms.amplitude.value = 1;
            timeRef.current += 0.2;
            materialRef.current.uniforms.time.value = timeRef.current;
        }

        meshRef.current.material = materialRef.current;
    });

    useEffect(() => {
        if (geometryControls.autoRandom) {
            const interval = setInterval(() => {
                scene.remove(meshRef.current);
                if (Math.random() > 0.5) {
                    setRandomControls();
                    createBoxMesh(geometryControls);
                } else {
                    setRandomControls();
                    createBoxMesh(geometryControls);
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [geometryControls.autoRandom]);

    return null;
};

