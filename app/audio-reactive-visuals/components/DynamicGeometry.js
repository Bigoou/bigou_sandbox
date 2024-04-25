"use client"

import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';
import BPMManager from '../managers/BPMManager';
import AudioManager from '../managers/AudioManager';
import gsap from 'gsap'


export default function DynamicGeometry({ audioManager, audioUrl, vertexShader, fragmentShader }) {
    const meshRef = useRef();
    const { scene } = useThree();
    const timeRef = useRef(0);
    const bpmManager = useRef(null);
    const materialRef = useRef();
    const [geometryControls, setGeometryControls] = useState({
        meshType: 'Cylinder',
        width: 10,
        radius: 5,
        height: 10,
        depth: 12,
        autoRotate: false,
        autoRandom: true,
        frequency: 0.8,
        amplitude: 1,
        startColor: '#ff0000',
        endColor: '#0000ff',
    });

    // Method to update geometryControls state
    const updateGeometryControls = (newControls) => {
        setGeometryControls(prevControls => ({ ...prevControls, ...newControls }));
    };

    // Use this method to set random control values, similar to what was previously being done inside setRandomControls
    const randomizeControls = () => {
        updateGeometryControls({
            meshType: Math.random() > 0.5 ? 'Cube' : 'Cylinder',
            width: THREE.MathUtils.randInt(5, 20),
            height: THREE.MathUtils.randInt(1, 40),
            depth: THREE.MathUtils.randInt(5, 80),
            radius: Math.random() * 10,
            frequency: Math.random() * 1.5,
            amplitude: Math.random() * 2,
            startColor: `#${Math.floor(Math.random() * 0xffffff).toString(16)}`,
            endColor: `#${Math.floor(Math.random() * 0xffffff).toString(16)}`,
        });
    };


    // const geometryControls = useControls('Geometry Controls', {
    //     meshType: { value: 'Cylinder', options: ['Cube', 'Cylinder'] },
    //     width: { value: 10, min: 5, max: 20 },
    //     radius: { value: 5, min: 1, max: 10 },
    //     height: { value: 10, min: 1, max: 40 },
    //     depth: { value: 12, min: 5, max: 80 },
    //     autoRotate: true,
    //     autoRandom: true,
    //     frequency: { value: 0, min: 2.5, max: 5 },
    //     amplitude: { value: 1.5, min: 0, max: 3 },
    //     startColor: '#ff0000',
    //     endColor: '#0000ff',
    // });

    const updateGeometry = (controls) => {
        if (!meshRef.current) return;

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
            geometryControls.width = THREE.MathUtils.randInt(2, 6);
            geometryControls.height = THREE.MathUtils.randInt(1, 20);
            geometryControls.depth = THREE.MathUtils.randInt(5, 80);
        } else {
            geometryControls.radius = Math.random() * 10;
            geometryControls.height = THREE.MathUtils.randInt(1, 40);
        }
        geometryControls.frequency = Math.random();
        if (geometryControls.frequency < 0.8) {
            geometryControls.frequency = 0.8;
        }
        geometryControls.amplitude = Math.random();
        if (geometryControls.amplitude < 1) {
            geometryControls.amplitude = 1;
        }
        // set random color but make sure it isnt too dark to see on the black background
        // geometryControls.startColor = `#${Math.floor(Math.random() * 0xffffff).toString(16)}`;
        // geometryControls.endColor = `#${Math.floor(Math.random() * 0xffffff).toString(16)}`;
    }

    const createBoxMesh = (controls) => {
        // console.log(controls);
        let geometry;
        let widthSeg = Math.floor(THREE.MathUtils.randInt(2, 50))
        let heightSeg = Math.floor(THREE.MathUtils.randInt(1, 20))
        let depthSeg = Math.floor(THREE.MathUtils.randInt(5, 80))
        let radialSeg = Math.floor(THREE.MathUtils.randInt(1, 3))
        if (controls.meshType === 'Cube') {
            geometry = new THREE.BoxGeometry(controls.width, controls.width, controls.width, widthSeg, widthSeg, depthSeg);
        } else {
            geometry = new THREE.CylinderGeometry(controls.radius, controls.radius, controls.height, 34 * radialSeg, 34 * heightSeg, false);
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
                offsetSize: { value: Math.floor(THREE.MathUtils.randInt(30, 60)) },
                size: { value: 9 },
                offsetGain: { value: 0 },
                maxDistance: { value: 1.8 },
                startColor: { value: new THREE.Color(controls.startColor) },
                endColor: { value: new THREE.Color(controls.endColor) }
            },
        });
        materialRef.current = material;

        const pointsMesh = new THREE.Points(geometry, materialRef.current);
        pointsMesh.rotateX(Math.PI / 2) // Rotate the mesh for better visual orientation

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
        bpmManager.current = new BPMManager();
        const setupAudioAndBPM = async () => {
            console.log(audioUrl);
            audioManager.current.setSong(audioUrl);
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
            }, 2000);
            return () => clearInterval(interval);
        }
    }, [geometryControls.autoRandom]);

    useEffect(() => {
        if (audioUrl) {
            audioManager.current.setSong(audioUrl);
        }
    }, [audioUrl]);

    useFrame(() => {
        if (geometryControls.autoRotate && meshRef.current) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }

        if (audioManager.current && audioManager.current.isPlaying && audioManager.current.frequencyData) {
            audioManager.current.update();
            const { high, mid, low } = audioManager.current.frequencyData;

            // Intensité des couleurs basées sur les fréquences audio
            const redIntensity = THREE.MathUtils.clamp(high * 2, 0, 1); // Limite pour le rouge
            const greenIntensity = THREE.MathUtils.clamp(mid * 2, 0, 1); // Limite pour le vert
            const blueIntensity = THREE.MathUtils.clamp(low * 2, 0, 1); // Limite pour le bleu

            // Ajustez dynamiquement la couleur de départ et de fin en fonction des fréquences
            gsap.to(meshRef.current.material.uniforms.startColor.value, {
                r: redIntensity,
                g: greenIntensity,
                b: blueIntensity,
                duration: 0.1, // Animation rapide pour un changement réactif
                ease: 'sine.inOut',
                onUpdate: () => meshRef.current.material.uniforms.startColor.value.needsUpdate = true,
            });

            // Pour la couleur de fin, vous pouvez choisir d'inverser les intensités, de les mélanger autrement, ou de les laisser identiques
            gsap.to(meshRef.current.material.uniforms.endColor.value, {
                r: blueIntensity, // Inverse pour l'exemple
                g: redIntensity,
                b: greenIntensity,
                duration: 0.5,
                ease: 'sine.inOut',
                onUpdate: () => meshRef.current.material.uniforms.endColor.value.needsUpdate = true,
            });

            // Logique de mise à l'échelle en fonction de 'high'
            if (high > 0.2) {
                gsap.to(meshRef.current.scale, {
                    x: 2 + high * 0.5, // Exemple de mise à l'échelle basée sur 'high'
                    y: 2 + high * 0.5,
                    z: 2 + high * 0.5,
                    duration: 0.1,
                    ease: 'elastic.out(0.2)',
                });
            } else {
                gsap.to(meshRef.current.scale, {
                    x: 1, // Réinitialisation de la mise à l'échelle
                    y: 1,
                    z: 1,
                    duration: 0.5,
                });
            }

            // Ajustements des uniformes du matériel basés sur les fréquences
            materialRef.current.uniforms.frequency.value = geometryControls.frequency + THREE.MathUtils.mapLinear(low, 0, 0.6, -0.1, 0.2);
            materialRef.current.uniforms.amplitude.value = geometryControls.amplitude + THREE.MathUtils.mapLinear(high, 0, 0.6, -0.1, 0.2);
            materialRef.current.uniforms.offsetGain.value = mid * 0.6


            // Ajustement du temps basé sur les fréquences low
            const t = THREE.MathUtils.mapLinear(low, 0.6, 1, 0.2, 0.5);
            timeRef.current += THREE.MathUtils.clamp(t, 0.2, 0.5);
            materialRef.current.uniforms.time.value = timeRef.current;
        } else {
            // Réinitialisation des valeurs lorsque l'audio n'est pas en cours de lecture
            // materialRef.current.uniforms.frequency.value = 0.8;
            // materialRef.current.uniforms.amplitude.value = 1;
            timeRef.current += 0.2;
            materialRef.current.uniforms.time.value = timeRef.current;
        }

        meshRef.current.material = materialRef.current;
    });



    return null;
};

