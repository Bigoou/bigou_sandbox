"use client"

import { Common } from "@/components/canvas/View";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import GUI from 'lil-gui'
import gsap from 'gsap'
import vertexShader from './glsl/vertex.glsl'
import fragmentShader from './glsl/fragment.glsl'

export default function Page() {

    const canvasRef = useRef(null);

    useEffect(() => {
        /**
         * Base
         */
        // Debug
        const gui = new GUI({ width: 340 })
        const debugObject = {}

        // Canvas
        const canvas = canvasRef.current;

        // Scene
        const scene = new THREE.Scene()

        // Loaders
        const dracoLoader = new DRACOLoader()
        dracoLoader.setDecoderPath('./draco/')
        const gltfLoader = new GLTFLoader()
        gltfLoader.setDRACOLoader(dracoLoader)

        /**
         * Sizes
         */
        const sizes = {
            width: window.innerWidth,
            height: window.innerHeight,
            pixelRatio: Math.min(window.devicePixelRatio, 2)
        }

        window.addEventListener('resize', () => {
            // Update sizes
            sizes.width = window.innerWidth
            sizes.height = window.innerHeight
            sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

            // Materials
            particles.material.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

            // Update camera
            camera.aspect = sizes.width / sizes.height
            camera.updateProjectionMatrix()

            // Update renderer
            renderer.setSize(sizes.width, sizes.height)
            renderer.setPixelRatio(sizes.pixelRatio)
        })

        /**
         * Camera
         */
        // Base camera
        const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
        camera.position.set(0, 0, 8 * 2)
        scene.add(camera)

        // Controls
        const controls = new OrbitControls(camera, canvas)
        controls.enableDamping = true

        /**
         * Renderer
         */
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
        })

        renderer.setSize(sizes.width, sizes.height)
        renderer.setPixelRatio(sizes.pixelRatio)

        debugObject.clearColor = '#160920'
        gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
        renderer.setClearColor(debugObject.clearColor)

        /**
         * Particles
         */
        const particles = {}

        // Geometry
        particles.geometry = new THREE.SphereGeometry(3)

        // Material
        particles.material = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms:
            {
                uSize: new THREE.Uniform(0.4),
                uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio))
            }
        })

        // Points
        particles.points = new THREE.Points(particles.geometry, particles.material)
        scene.add(particles.points)

        /**
         * Animate
         */
        const tick = () => {
            // Update controls
            controls.update()

            // Render normal scene
            renderer.render(scene, camera)

            // Call tick again on the next frame
            window.requestAnimationFrame(tick)
        }

        tick()
    }, [])

    return (
        <>
            <div className='relative z-10 mx-auto flex w-full flex-col flex-wrap items-center md:flex-row  lg:w-4/5'>
                <div className='flex w-full flex-col items-start justify-center p-12 text-center md:w-3/5 md:text-left'>
                    <h1 className='my-4 text-5xl font-bold leading-tight'>Particles Morphing</h1>
                </div>
            </div>

            <canvas ref={canvasRef} className="absolute top-0 flex h-screen w-full flex-col items-center justify-center" />
        </>
    )
}