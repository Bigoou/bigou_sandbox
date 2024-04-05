"use client"

import { Common } from "@/components/canvas/View";
import { Canvas } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import GUI from 'lil-gui'
import gsap from 'gsap'
import vertexShader from './glsl/particles/vertex.glsl'
import fragmentShader from './glsl/particles/fragment.glsl'
import gpgpuParticlesShader from './glsl/gpgpu/particles.glsl'

export default function Page() {

    const canvasRef = useRef(null);

    useEffect(() => {
        const renderScene = async () => {
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
            dracoLoader.setDecoderPath('/draco/')

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
            camera.position.set(4.5, 4, 11)
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

            debugObject.clearColor = '#29191f'
            renderer.setClearColor(debugObject.clearColor)

            /**
             * Load Model (SI ÇA NE MARCHE PAS AVEC UN AUTRE MODÈLE, CF LE TUTO DE BRUNO VERS 1:25:00)
             */
            const gltf = await gltfLoader.loadAsync('./new_basketball.glb')
            console.log(gltf);


            /**
             * Base geometry
             */

            const baseGeometry = {}
            baseGeometry.instance = gltf.scene.children[0].geometry
            // change size
            baseGeometry.instance.scale(15.1, 15.1, 15.1)
            baseGeometry.count = baseGeometry.instance.attributes.position.count

            // Get texture
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('./ball_ball_BaseColor.png')

            /**
             * GPU Compute
             */
            // Setup
            const gpgpu = {}
            gpgpu.size = Math.ceil(Math.sqrt(baseGeometry.count))
            gpgpu.computation = new GPUComputationRenderer(gpgpu.size, gpgpu.size, renderer)

            // Base particles
            const baseParticlesTexture = gpgpu.computation.createTexture()
            for (let i = 0; i < baseGeometry.count; i++) {
                const i3 = i * 3
                const i4 = i * 4

                // Position based on geometry
                baseParticlesTexture.image.data[i4 + 0] = baseGeometry.instance.attributes.position.array[i3 + 0]
                baseParticlesTexture.image.data[i4 + 1] = baseGeometry.instance.attributes.position.array[i3 + 1]
                baseParticlesTexture.image.data[i4 + 2] = baseGeometry.instance.attributes.position.array[i3 + 2]
                baseParticlesTexture.image.data[i4 + 3] = 0
            }

            // Particles variable
            gpgpu.particlesVariable = gpgpu.computation.addVariable('uParticles', gpgpuParticlesShader, baseParticlesTexture)
            gpgpu.computation.setVariableDependencies(gpgpu.particlesVariable, [gpgpu.particlesVariable])

            // Init
            gpgpu.computation.init()

            // Debug
            gpgpu.debug = new THREE.Mesh(
                new THREE.PlaneGeometry(3, 3),
                new THREE.MeshBasicMaterial({
                    map: gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture
                })
            )
            gpgpu.debug.position.x = 3
            scene.add(gpgpu.debug)

            /**
             * Particles
             */
            const particles = {}

            // Geometry
            const particlesUvArray = new Float32Array(baseGeometry.count * 2)

            for (let y = 0; y < gpgpu.size; y++) {
                for (let x = 0; x < gpgpu.size; x++) {
                    const i = (y * gpgpu.size + x)
                    const i2 = i * 2

                    const uvX = (x + 0.5) / gpgpu.size
                    const uvY = (y + 0.5) / gpgpu.size

                    particlesUvArray[i2 + 0] = uvX
                    particlesUvArray[i2 + 1] = uvY
                }
            }

            particles.geometry = new THREE.BufferGeometry()
            particles.geometry.setDrawRange(0, baseGeometry.count)
            particles.geometry.setAttribute('aParticlesUv', new THREE.BufferAttribute(particlesUvArray, 2))
            // particles.geometry.setAttribute('aColor', baseGeometry.instance.attributes.color)

            // Material
            particles.material = new THREE.ShaderMaterial({
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                uniforms:
                {
                    uSize: new THREE.Uniform(0.06),
                    uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
                    uParticlesTexture: new THREE.Uniform,
                    uColorTexture: { type: "t", value: texture }
                }
            })

            // Points
            particles.points = new THREE.Points(particles.geometry, particles.material)
            scene.add(particles.points)

            /**
             * Tweaks
             */
            gui.addColor(debugObject, 'clearColor').onChange(() => { renderer.setClearColor(debugObject.clearColor) })
            gui.add(particles.material.uniforms.uSize, 'value').min(0).max(1).step(0.001).name('uSize')

            /**
             * Animate
             */
            const clock = new THREE.Clock()
            let previousTime = 0

            const tick = () => {
                const elapsedTime = clock.getElapsedTime()
                const deltaTime = elapsedTime - previousTime
                previousTime = elapsedTime

                // Update controls
                controls.update()

                // GPGPU update
                gpgpu.computation.compute()
                particles.material.uniforms.uParticlesTexture.value = gpgpu.computation.getCurrentRenderTarget(gpgpu.particlesVariable).texture

                // Render normal scene
                renderer.render(scene, camera)

                // Call tick again on the next frame
                window.requestAnimationFrame(tick)
            }

            tick()
        }

        renderScene()

    }, [])

    return (
        <>
            <div className='relative z-10 mx-auto flex w-full flex-col flex-wrap items-center md:flex-row  lg:w-4/5'>
                <div className='flex w-full flex-col items-start justify-center p-12  md:w-3/5 md:text-left'>
                    <h1 className='my-4 text-5xl font-bold leading-tight text-white'>Flow Field</h1>
                </div>
            </div>

            <canvas ref={canvasRef} className="absolute top-0 flex h-screen w-full flex-col items-center justify-center" />
        </>
    )
}