import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { LabyrinthGenerator } from '../labyrinth/LabyrinthGenerator.js';

export function GameView({ labyrinth, room, isMobile }) {
    const containerRef = useRef(null);
    const rendererRef = useRef(null);
    const sceneRef = useRef(null);
    const cameraRef = useRef(null);
    const controlsRef = useRef(null);
    const playerRef = useRef({
        position: new THREE.Vector3(0, 1.7, 0),
        velocity: new THREE.Vector3(),
        onFloor: true,
        canJump: true
    });
    const keyStatesRef = useRef({
        forward: false,
        backward: false,
        left: false,
        right: false,
        jump: false
    });
    
    const labyGeneratorRef = useRef(null);
    const [isLoading, setIsLoading] = useState(true);
    
    // Initialize 3D scene
    useEffect(() => {
        if (!containerRef.current) return;
        
        // Initialize Three.js scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x111122);
        scene.fog = new THREE.FogExp2(0x111122, 0.02);
        sceneRef.current = scene;
        
        // Initialize camera
        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 1.7, 0); // Eye level height
        cameraRef.current = camera;
        
        // Initialize renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.shadowMap.enabled = true;
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        scene.add(directionalLight);
        
        // Point light that follows the player
        const pointLight = new THREE.PointLight(0x8844ff, 1, 15);
        pointLight.position.set(0, 2, 0);
        pointLight.castShadow = true;
        camera.add(pointLight);
        scene.add(camera);
        
        // Initialize controls based on device type
        if (isMobile) {
            const orbitControls = new OrbitControls(camera, renderer.domElement);
            orbitControls.enableDamping = true;
            orbitControls.dampingFactor = 0.05;
            orbitControls.screenSpacePanning = false;
            orbitControls.enableZoom = true;
            orbitControls.maxPolarAngle = Math.PI / 2;
            controlsRef.current = orbitControls;
        } else {
            const pointerControls = new PointerLockControls(camera, document.body);
            scene.add(pointerControls.getObject());
            
            const handleClick = () => {
                pointerControls.lock();
            };
            
            document.addEventListener('click', handleClick);
            controlsRef.current = pointerControls;
        }
        
        // Initialize labyrinth generator
        labyGeneratorRef.current = new LabyrinthGenerator(scene);
        
        // Handle window resize
        const handleResize = () => {
            if (cameraRef.current && rendererRef.current) {
                cameraRef.current.aspect = window.innerWidth / window.innerHeight;
                cameraRef.current.updateProjectionMatrix();
                rendererRef.current.setSize(window.innerWidth, window.innerHeight);
            }
        };
        
        window.addEventListener('resize', handleResize);
        
        // Set up keyboard controls
        const onKeyDown = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    keyStatesRef.current.forward = true;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    keyStatesRef.current.left = true;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    keyStatesRef.current.backward = true;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    keyStatesRef.current.right = true;
                    break;
                case 'Space':
                    keyStatesRef.current.jump = true;
                    break;
            }
        };
        
        const onKeyUp = (event) => {
            switch (event.code) {
                case 'ArrowUp':
                case 'KeyW':
                    keyStatesRef.current.forward = false;
                    break;
                case 'ArrowLeft':
                case 'KeyA':
                    keyStatesRef.current.left = false;
                    break;
                case 'ArrowDown':
                case 'KeyS':
                    keyStatesRef.current.backward = false;
                    break;
                case 'ArrowRight':
                case 'KeyD':
                    keyStatesRef.current.right = false;
                    break;
                case 'Space':
                    keyStatesRef.current.jump = false;
                    break;
            }
        };
        
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        
        return () => {
            // Cleanup
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('keydown', onKeyDown);
            document.removeEventListener('keyup', onKeyUp);
            document.removeEventListener('click', handleClick);
            
            if (rendererRef.current && containerRef.current) {
                containerRef.current.removeChild(rendererRef.current.domElement);
            }
            
            scene.clear();
        };
    }, [isMobile]);
    
    // Update labyrinth when a new one is selected
    useEffect(() => {
        if (labyrinth && sceneRef.current && labyGeneratorRef.current) {
            setIsLoading(true);
            
            // Clear previous labyrinth
            const objectsToRemove = [];
            sceneRef.current.traverse((object) => {
                if (object.userData && object.userData.isLabyrinthElement) {
                    objectsToRemove.push(object);
                }
            });
            
            objectsToRemove.forEach((object) => {
                sceneRef.current.remove(object);
            });
            
            // Generate new labyrinth
            labyGeneratorRef.current.generate(labyrinth).then(() => {
                // Reset player position to start
                if (cameraRef.current) {
                    cameraRef.current.position.set(2, 1.7, 2);
                    playerRef.current.position.set(2, 1.7, 2);
                }
                setIsLoading(false);
                
                // Update player position in multiplayer
                room.send({
                    type: 'playerPosition',
                    position: [2, 1.7, 2],
                    rotation: cameraRef.current ? cameraRef.current.rotation.y : 0
                });
            });
        }
    }, [labyrinth, room]);
    
    // Animation loop
    useEffect(() => {
        let lastTime = 0;
        const clock = new THREE.Clock();
        
        const animate = (time) => {
            const delta = clock.getDelta();
            const elapsedTime = clock.getElapsedTime();
            
            // Update controls
            if (controlsRef.current) {
                if (isMobile) {
                    // OrbitControls
                    controlsRef.current.update();
                } else {
                    // PointerLockControls - handle movement
                    if (controlsRef.current.isLocked) {
                        const velocity = playerRef.current.velocity;
                        const playerPos = playerRef.current.position;
                        
                        // Simulated gravity
                        if (playerRef.current.onFloor) {
                            velocity.y = -0.1; // Small downward force to check if still on ground
                        } else {
                            velocity.y -= 9.8 * delta; // Gravity
                        }
                        
                        // Get camera direction
                        const camera = cameraRef.current;
                        const direction = new THREE.Vector3();
                        camera.getWorldDirection(direction);
                        direction.y = 0;
                        direction.normalize();
                        
                        const sideDirection = new THREE.Vector3(-direction.z, 0, direction.x);
                        
                        // Reset movement velocity
                        velocity.x = 0;
                        velocity.z = 0;
                        
                        const moveSpeed = 5.0;
                        
                        // Apply movement based on key states
                        if (keyStatesRef.current.forward) {
                            velocity.x += direction.x * moveSpeed * delta;
                            velocity.z += direction.z * moveSpeed * delta;
                        }
                        if (keyStatesRef.current.backward) {
                            velocity.x -= direction.x * moveSpeed * delta;
                            velocity.z -= direction.z * moveSpeed * delta;
                        }
                        if (keyStatesRef.current.left) {
                            velocity.x += sideDirection.x * moveSpeed * delta;
                            velocity.z += sideDirection.z * moveSpeed * delta;
                        }
                        if (keyStatesRef.current.right) {
                            velocity.x -= sideDirection.x * moveSpeed * delta;
                            velocity.z -= sideDirection.z * moveSpeed * delta;
                        }
                        
                        // Jump
                        if (keyStatesRef.current.jump && playerRef.current.canJump && playerRef.current.onFloor) {
                            velocity.y = 5.0;
                            playerRef.current.canJump = false;
                            playerRef.current.onFloor = false;
                            
                            // Reset jump ability after a short delay
                            setTimeout(() => {
                                playerRef.current.canJump = true;
                            }, 1000);
                        }
                        
                        // Collision detection with walls
                        const nextPos = new THREE.Vector3(
                            playerPos.x + velocity.x,
                            playerPos.y + velocity.y,
                            playerPos.z + velocity.z
                        );
                        
                        // Floor collision (simple)
                        if (nextPos.y <= 1.7) {
                            nextPos.y = 1.7;
                            velocity.y = 0;
                            playerRef.current.onFloor = true;
                        } else {
                            playerRef.current.onFloor = false;
                        }
                        
                        // Update player position
                        playerPos.copy(nextPos);
                        camera.position.copy(playerPos);
                        
                        // Wall collision (simple) - TODO: Add better collision
                        // ...
                        
                        // Send position updates to multiplayer
                        if (time - lastTime > 100) { // Limit updates to every 100ms
                            room.send({
                                type: 'playerPosition',
                                position: [playerPos.x, playerPos.y, playerPos.z],
                                rotation: camera.rotation.y
                            });
                            lastTime = time;
                        }
                    }
                }
            }
            
            // Update dynamic labyrinth elements if needed
            if (labyGeneratorRef.current) {
                labyGeneratorRef.current.update(elapsedTime);
            }
            
            // Render
            if (rendererRef.current && sceneRef.current && cameraRef.current) {
                rendererRef.current.render(sceneRef.current, cameraRef.current);
            }
            
            requestAnimationFrame(animate);
        };
        
        const animationId = requestAnimationFrame(animate);
        
        return () => {
            cancelAnimationFrame(animationId);
        };
    }, [isMobile, room]);
    
    // Handle mobile control input
    const handleMobileControl = (direction) => {
        if (!controlsRef.current || isMobile) return;
        
        const camera = cameraRef.current;
        const moveSpeed = 0.5;
        
        let moveVector = new THREE.Vector3();
        camera.getWorldDirection(moveVector);
        moveVector.y = 0;
        moveVector.normalize();
        
        const sideVector = new THREE.Vector3(-moveVector.z, 0, moveVector.x);
        
        switch (direction) {
            case 'up':
                camera.position.addScaledVector(moveVector, moveSpeed);
                break;
            case 'down':
                camera.position.addScaledVector(moveVector, -moveSpeed);
                break;
            case 'left':
                camera.position.addScaledVector(sideVector, moveSpeed);
                break;
            case 'right':
                camera.position.addScaledVector(sideVector, -moveSpeed);
                break;
            case 'jump':
                if (playerRef.current.onFloor) {
                    playerRef.current.velocity.y = 5.0;
                    playerRef.current.onFloor = false;
                }
                break;
        }
        
        // Update player reference position
        playerRef.current.position.copy(camera.position);
        
        // Send position to multiplayer
        room.send({
            type: 'playerPosition',
            position: [camera.position.x, camera.position.y, camera.position.z],
            rotation: camera.rotation.y
        });
    };
    
    return (
        <div ref={containerRef} className="canvas-container">
            {isLoading && (
                <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <p>Generating labyrinth...</p>
                </div>
            )}
        </div>
    );
}

