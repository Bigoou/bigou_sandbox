"use client"

import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useControls } from 'leva';
import * as THREE from 'three';

export default function DynamicGeometry({ vertexShader, fragmentShader }) {
    const meshRef = useRef();
    const { scene } = useThree();
    const timeRef = useRef(0);

    const { meshType, width, height, depth, widthSegments, heightSegments, depthSegments, autoRotate, frequency, amplitude, autoRandom } = useControls('Geometry Controls', {
        meshType: { value: 'Cube', options: ['Cube', 'Cylinder'] },
        width: { value: 10, min: 5, max: 20 },
        height: { value: 10, min: 1, max: 40 },
        depth: { value: 12, min: 5, max: 80 },
        widthSegments: { value: 24, min: 1, max: 32 },
        heightSegments: { value: 24, min: 1, max: 32 },
        depthSegments: { value: 24, min: 1, max: 32 },
        autoRotate: true,
        autoRandom: false,
        frequency: { value: 0, min: 2.5, max: 5 },
        amplitude: { value: 1.5, min: 0, max: 3 },
    });

    useEffect(() => {
        let geometry;
        if (meshType === 'Cube') {
            geometry = new THREE.BoxGeometry(width, height, depth, widthSegments, heightSegments, depthSegments);
        } else {
            geometry = new THREE.CylinderGeometry(1, 1, height, widthSegments, heightSegments, false);
        }
        const material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            side: THREE.DoubleSide,
            transparent: true,
            uniforms: {
                time: { value: 0 },
                frequency: { value: frequency },
                amplitude: { value: amplitude },
                offsetSize: { value: 2 },
                size: { value: 2 },
                offsetGain: { value: 0.5 },
                maxDistance: { value: 1.8 },
            },
        });

        const pointsMesh = new THREE.Points(geometry, material);
        meshRef.current = pointsMesh;
        scene.add(pointsMesh);

        return () => {
            scene.remove(pointsMesh);
        };
    }, [meshType, width, height, depth, frequency, amplitude, scene, vertexShader, fragmentShader]);

    useFrame(() => {
        if (autoRotate) {
            meshRef.current.rotation.x += 0.01;
            meshRef.current.rotation.y += 0.01;
        }
        timeRef.current += 0.1;
        meshRef.current.material.uniforms.time.value = timeRef.current;
    });

    useEffect(() => {
        if (autoRandom) {
            const interval = setInterval(() => {

                console.log("Randomize Meshes");
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [autoRandom]);

    return null;
};

