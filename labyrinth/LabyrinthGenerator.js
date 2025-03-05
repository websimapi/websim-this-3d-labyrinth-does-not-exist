import * as THREE from 'three';

export class LabyrinthGenerator {
    constructor(scene) {
        this.scene = scene;
        this.segments = [];
        this.textureLoader = new THREE.TextureLoader();
        this.wallMaterials = new Map();
        this.floorMaterials = new Map();
        this.chunkSize = 20; // Size of each generated chunk
        this.visibleChunks = new Set(); // Currently visible chunks
        this.generatedChunks = new Map(); // Map of all generated chunks by position key
        this.currentChunk = { x: 0, z: 0 }; // Player's current chunk
    }
    
    async generate(labyrinthData) {
        // Clear existing chunks
        this.visibleChunks.clear();
        this.generatedChunks.clear();
        
        // Store labyrinth data for procedural generation
        this.labyrinthData = labyrinthData;
        
        // Load textures if needed
        await this.loadTextures(labyrinthData);
        
        // Generate the initial chunks around the player
        this.currentChunk = { x: 0, z: 0 };
        await this.generateSurroundingChunks(this.currentChunk.x, this.currentChunk.z);
        
        return true;
    }
    
    async loadTextures(labyrinthData) {
        // Load wall texture
        if (labyrinthData.wallTextureUrl) {
            try {
                const wallTexture = await this.loadTexture(labyrinthData.wallTextureUrl);
                wallTexture.wrapS = THREE.RepeatWrapping;
                wallTexture.wrapT = THREE.RepeatWrapping;
                
                // Create wall material
                const wallMaterial = new THREE.MeshStandardMaterial({
                    map: wallTexture,
                    roughness: 0.7,
                    metalness: 0.1,
                });
                
                this.wallMaterials.set(labyrinthData.id, wallMaterial);
            } catch (error) {
                console.error('Error loading wall texture:', error);
                // Fallback to default material
                this.wallMaterials.set(labyrinthData.id, this.createDefaultWallMaterial(labyrinthData));
            }
        } else {
            // Create procedural wall material
            this.wallMaterials.set(labyrinthData.id, this.createDefaultWallMaterial(labyrinthData));
        }
        
        // Load floor texture
        if (labyrinthData.floorTextureUrl) {
            try {
                const floorTexture = await this.loadTexture(labyrinthData.floorTextureUrl);
                floorTexture.wrapS = THREE.RepeatWrapping;
                floorTexture.wrapT = THREE.RepeatWrapping;
                
                // Create floor material
                const floorMaterial = new THREE.MeshStandardMaterial({
                    map: floorTexture,
                    roughness: 0.8,
                    metalness: 0.2,
                });
                
                this.floorMaterials.set(labyrinthData.id, floorMaterial);
            } catch (error) {
                console.error('Error loading floor texture:', error);
                // Fallback to default material
                this.floorMaterials.set(labyrinthData.id, this.createDefaultFloorMaterial(labyrinthData));
            }
        } else {
            // Create procedural floor material
            this.floorMaterials.set(labyrinthData.id, this.createDefaultFloorMaterial(labyrinthData));
        }
    }
    
    loadTexture(url) {
        return new Promise((resolve, reject) => {
            this.textureLoader.load(url, resolve, undefined, reject);
        });
    }
    
    createDefaultWallMaterial(labyrinthData) {
        // Create a procedural texture based on labyrinth description
        const biome = labyrinthData.biome || '';
        
        let color, emissive = 0x000000;
        
        if (biome.includes('forest') || biome.includes('jungle')) {
            color = 0x2d4c1e;
        } else if (biome.includes('desert') || biome.includes('sand')) {
            color = 0xd2b48c;
        } else if (biome.includes('ice') || biome.includes('snow') || biome.includes('frost')) {
            color = 0xd6f0ff;
        } else if (biome.includes('cave') || biome.includes('dungeon')) {
            color = 0x4a4a4a;
        } else if (biome.includes('crystal') || biome.includes('gem')) {
            color = 0x7fb0ff;
            emissive = 0x102040;
        } else if (biome.includes('volcanic') || biome.includes('fire')) {
            color = 0x8b0000;
            emissive = 0x340000;
        } else {
            // Default color for other biomes
            color = 0x7a7265;
        }
        
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.8,
            metalness: 0.1,
            emissive: emissive,
            emissiveIntensity: emissive !== 0x000000 ? 0.5 : 0
        });
    }
    
    createDefaultFloorMaterial(labyrinthData) {
        // Create a procedural texture based on labyrinth description
        const biome = labyrinthData.biome || '';
        
        let color, emissive = 0x000000;
        
        if (biome.includes('forest') || biome.includes('jungle')) {
            color = 0x3a5a28;
        } else if (biome.includes('desert') || biome.includes('sand')) {
            color = 0xe6c288;
        } else if (biome.includes('ice') || biome.includes('snow') || biome.includes('frost')) {
            color = 0xe0f0ff;
        } else if (biome.includes('cave') || biome.includes('dungeon')) {
            color = 0x333333;
        } else if (biome.includes('crystal') || biome.includes('gem')) {
            color = 0x5d80bf;
            emissive = 0x0a1428;
        } else if (biome.includes('volcanic') || biome.includes('fire')) {
            color = 0x5a0000;
            emissive = 0x200000;
        } else {
            // Default color for other biomes
            color = 0x535049;
        }
        
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.9,
            metalness: 0.05,
            emissive: emissive,
            emissiveIntensity: emissive !== 0x000000 ? 0.3 : 0
        });
    }
    
    async generateSurroundingChunks(centerX, centerZ) {
        const promises = [];
        
        // Generate a 3x3 area of chunks around the player
        for (let x = centerX - 1; x <= centerX + 1; x++) {
            for (let z = centerZ - 1; z <= centerZ + 1; z++) {
                const chunkKey = `${x},${z}`;
                
                if (!this.generatedChunks.has(chunkKey)) {
                    // Generate new chunk
                    promises.push(this.generateChunk(x, z));
                } else if (!this.visibleChunks.has(chunkKey)) {
                    // Make existing chunk visible
                    const chunk = this.generatedChunks.get(chunkKey);
                    chunk.forEach(mesh => {
                        mesh.visible = true;
                    });
                    this.visibleChunks.add(chunkKey);
                }
            }
        }
        
        // Hide chunks that are now too far away
        for (const chunkKey of this.visibleChunks) {
            const [x, z] = chunkKey.split(',').map(Number);
            
            if (Math.abs(x - centerX) > 1 || Math.abs(z - centerZ) > 1) {
                const chunk = this.generatedChunks.get(chunkKey);
                chunk.forEach(mesh => {
                    mesh.visible = false;
                });
                this.visibleChunks.delete(chunkKey);
            }
        }
        
        // Wait for all chunks to generate
        await Promise.all(promises);
    }
    
    async generateChunk(chunkX, chunkZ) {
        const chunkKey = `${chunkX},${chunkZ}`;
        const chunkObjects = [];
        
        // Get materials for the current labyrinth
        const wallMaterial = this.wallMaterials.get(this.labyrinthData.id);
        const floorMaterial = this.floorMaterials.get(this.labyrinthData.id);
        
        // Determine maze pattern based on chunk position and labyrinth seed
        const seed = (this.labyrinthData.seed || 0) + (chunkX * 10000) + chunkZ;
        const rng = this.seededRandom(seed);
        
        // Generate floor
        const floorGeometry = new THREE.PlaneGeometry(this.chunkSize, this.chunkSize);
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.position.set(
            chunkX * this.chunkSize,
            0,
            chunkZ * this.chunkSize
        );
        floor.userData.isLabyrinthElement = true;
        this.scene.add(floor);
        chunkObjects.push(floor);
        
        // Determine complexity factor based on labyrinth setting
        let complexityFactor;
        switch (this.labyrinthData.complexity) {
            case 'simple': complexityFactor = 0.15; break;
            case 'medium': complexityFactor = 0.25; break;
            case 'complex': complexityFactor = 0.35; break;
            case 'insane': complexityFactor = 0.5; break;
            default: complexityFactor = 0.3;
        }
        
        // Create walls
        const wallHeight = 4;
        const wallThickness = 1;
        const wallGeometry = new THREE.BoxGeometry(1, wallHeight, wallThickness);
        
        // Create a grid for wall placement
        const gridSize = 4; // Number of grid cells in each chunk
        const cellSize = this.chunkSize / gridSize;
        
        // Generate maze using a basic algorithm
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                const cellX = chunkX * this.chunkSize + i * cellSize + cellSize/2;
                const cellZ = chunkZ * this.chunkSize + j * cellSize + cellSize/2;
                
                // Determine if we should place walls
                // North wall
                if (rng() < complexityFactor || j === 0) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(cellX, wallHeight/2, cellZ - cellSize/2);
                    wall.scale.set(cellSize, 1, 1);
                    wall.userData.isLabyrinthElement = true;
                    this.scene.add(wall);
                    chunkObjects.push(wall);
                }
                
                // East wall
                if (rng() < complexityFactor || i === gridSize-1) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(cellX + cellSize/2, wallHeight/2, cellZ);
                    wall.rotation.y = Math.PI / 2;
                    wall.scale.set(cellSize, 1, 1);
                    wall.userData.isLabyrinthElement = true;
                    this.scene.add(wall);
                    chunkObjects.push(wall);
                }
                
                // South wall (only if not generated by north wall of next cell)
                if ((rng() < complexityFactor || j === gridSize-1) && 
                    !(j < gridSize-1 && rng() < complexityFactor)) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(cellX, wallHeight/2, cellZ + cellSize/2);
                    wall.scale.set(cellSize, 1, 1);
                    wall.userData.isLabyrinthElement = true;
                    this.scene.add(wall);
                    chunkObjects.push(wall);
                }
                
                // West wall (only if not generated by east wall of previous cell)
                if ((rng() < complexityFactor || i === 0) && 
                    !(i > 0 && rng() < complexityFactor)) {
                    const wall = new THREE.Mesh(wallGeometry, wallMaterial);
                    wall.position.set(cellX - cellSize/2, wallHeight/2, cellZ);
                    wall.rotation.y = Math.PI / 2;
                    wall.scale.set(cellSize, 1, 1);
                    wall.userData.isLabyrinthElement = true;
                    this.scene.add(wall);
                    chunkObjects.push(wall);
                }
                
                // Occasionally add special features based on labyrinth data
                if (rng() < 0.05) {
                    await this.addSpecialFeature(cellX, cellZ, chunkObjects, rng);
                }
            }
        }
        
        // Store the generated chunk
        this.generatedChunks.set(chunkKey, chunkObjects);
        this.visibleChunks.add(chunkKey);
        
        return chunkObjects;
    }
    
    async addSpecialFeature(x, z, chunkObjects, rng) {
        const biome = this.labyrinthData.biome || '';
        const featureHeight = 1 + rng() * 3;
        
        let geometry, material;
        
        if (biome.includes('crystal') || biome.includes('gem')) {
            // Crystal formation
            geometry = new THREE.ConeGeometry(0.5 + rng(), featureHeight, 5);
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.2 + rng() * 0.3, 0.3 + rng() * 0.5, 0.7 + rng() * 0.3),
                roughness: 0.2,
                metalness: 0.8,
                emissive: new THREE.Color(0.1, 0.2, 0.4),
                emissiveIntensity: 0.5
            });
        } else if (biome.includes('forest') || biome.includes('jungle')) {
            // Tree or mushroom
            geometry = new THREE.CylinderGeometry(0.2, 0.3, featureHeight);
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.3, 0.2, 0.1),
                roughness: 0.9
            });
        } else if (biome.includes('desert') || biome.includes('sand')) {
            // Rock formation
            geometry = new THREE.DodecahedronGeometry(0.7 + rng() * 0.5);
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.8, 0.7, 0.5),
                roughness: 0.9
            });
        } else if (biome.includes('volcanic') || biome.includes('fire')) {
            // Lava pool or rock
            geometry = new THREE.SphereGeometry(0.5 + rng() * 0.5);
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.8, 0.3, 0.1),
                roughness: 0.7,
                emissive: new THREE.Color(0.8, 0.3, 0),
                emissiveIntensity: 0.8
            });
        } else {
            // Default mysterious object
            geometry = new THREE.IcosahedronGeometry(0.4 + rng() * 0.4);
            material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(0.4 + rng() * 0.4, 0.4 + rng() * 0.4, 0.4 + rng() * 0.4),
                roughness: 0.5,
                metalness: 0.5
            });
        }
        
        const feature = new THREE.Mesh(geometry, material);
        feature.position.set(x + (rng() - 0.5) * 2, featureHeight/2, z + (rng() - 0.5) * 2);
        feature.rotation.y = rng() * Math.PI * 2;
        feature.userData.isLabyrinthElement = true;
        feature.userData.isSpecialFeature = true;
        feature.userData.featureType = biome;
        this.scene.add(feature);
        chunkObjects.push(feature);
        
        // Add a light source to some special features
        if (rng() < 0.3) {
            const light = new THREE.PointLight(
                new THREE.Color(0.5 + rng() * 0.5, 0.5 + rng() * 0.5, 0.5 + rng() * 0.5),
                1,
                5 + rng() * 5
            );
            light.position.set(x, featureHeight + 0.5, z);
            light.userData.isLabyrinthElement = true;
            this.scene.add(light);
            chunkObjects.push(light);
        }
    }
    
    update(elapsedTime) {
        // Animate special features
        this.scene.traverse((object) => {
            if (object.userData && object.userData.isSpecialFeature) {
                object.rotation.y = elapsedTime * 0.2;
                
                if (object.userData.featureType && 
                    (object.userData.featureType.includes('crystal') || 
                     object.userData.featureType.includes('gem'))) {
                    
                    object.scale.y = 1 + Math.sin(elapsedTime) * 0.1;
                    
                    if (object.material) {
                        object.material.emissiveIntensity = 0.3 + Math.sin(elapsedTime * 2) * 0.2;
                    }
                } else if (object.userData.featureType && 
                          (object.userData.featureType.includes('volcanic') || 
                           object.userData.featureType.includes('fire'))) {
                    
                    if (object.material) {
                        object.material.emissiveIntensity = 0.6 + Math.sin(elapsedTime * 3) * 0.4;
                    }
                }
            }
        });
    }
    
    // Update player position and load/unload chunks as needed
    updatePlayerPosition(x, z) {
        const chunkX = Math.floor(x / this.chunkSize);
        const chunkZ = Math.floor(z / this.chunkSize);
        
        if (chunkX !== this.currentChunk.x || chunkZ !== this.currentChunk.z) {
            this.currentChunk = { x: chunkX, z: chunkZ };
            this.generateSurroundingChunks(chunkX, chunkZ);
        }
    }
    
    // Seeded random function for deterministic generation
    seededRandom(seed) {
        return function() {
            seed = (seed * 9301 + 49297) % 233280;
            return seed / 233280;
        };
    }
}

