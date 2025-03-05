import React, { useState } from 'react';

export function GeneratorPanel({ onClose, room, setCurrentLabyrinth, setLoadingMessage }) {
    const [theme, setTheme] = useState('');
    const [complexity, setComplexity] = useState('medium');
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedText, setGeneratedText] = useState('');
    
    // Generate a labyrinth description using the LLM
    const generateLabyrinthDescription = async () => {
        setIsGenerating(true);
        setLoadingMessage('Generating labyrinth description...');
        
        try {
            const completion = await websim.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are an AI specialized in creating evocative, rich descriptions of fantastical labyrinths and mazes.
                        Create a detailed, vivid description of a unique labyrinth with the following:
                        1. A name for the labyrinth
                        2. The biome/environment type 
                        3. Architectural style and materials
                        4. Special features (magical elements, traps, mysteries)
                        5. The atmosphere and mood
                        6. Wall textures and visual elements
                        
                        Make it highly visual, atmospheric, and suitable for generating imagery.
                        
                        Response must be in the following JSON structure:
                        {
                          "name": "The name of the labyrinth",
                          "biome": "The biome/environment",
                          "description": "Full descriptive paragraph",
                          "wallTexture": "Detailed description of the wall textures",
                          "floorTexture": "Detailed description of the floor texture",
                          "lighting": "Description of the lighting conditions",
                          "specialFeatures": "Special elements in the labyrinth"
                        }`
                    },
                    {
                        role: "user",
                        content: `Create a unique ${complexity} complexity labyrinth with the theme: ${theme || "fantasy world"}.`,
                    }
                ],
                json: true
            });
            
            const labyrinthDesc = JSON.parse(completion.content);
            setGeneratedText(labyrinthDesc);
            
            // Generate the image based on the description
            setLoadingMessage('Generating labyrinth visualization...');
            
            // Create image prompt from the description
            const imagePrompt = `A photorealistic 3D render of the entrance to "${labyrinthDesc.name}" labyrinth. ${labyrinthDesc.description} The walls are made of ${labyrinthDesc.wallTexture}. The floor is ${labyrinthDesc.floorTexture}. The lighting is ${labyrinthDesc.lighting}. Dramatic lighting, highly detailed, cinematic.`;
            
            const imageResult = await websim.imageGen({
                prompt: imagePrompt,
                aspect_ratio: "16:9"
            });
            
            // Store the labyrinth in the database
            const labyrinth = await room.collection('labyrinth').create({
                name: labyrinthDesc.name,
                theme: theme || 'fantasy',
                complexity: complexity,
                description: labyrinthDesc.description,
                biome: labyrinthDesc.biome,
                wallTexture: labyrinthDesc.wallTexture,
                floorTexture: labyrinthDesc.floorTexture,
                lighting: labyrinthDesc.lighting,
                specialFeatures: labyrinthDesc.specialFeatures,
                imageUrl: imageResult.url,
                seed: Math.floor(Math.random() * 1000000)
            });
            
            // Generate wall texture image
            const wallTexturePrompt = `Realistic seamless texture of ${labyrinthDesc.wallTexture} for a 3D game. Highly detailed, top-down view, PBR material.`;
            const wallTexture = await websim.imageGen({
                prompt: wallTexturePrompt,
                aspect_ratio: "1:1"
            });
            
            // Generate floor texture image
            const floorTexturePrompt = `Realistic seamless texture of ${labyrinthDesc.floorTexture} for a 3D game. Highly detailed, top-down view, PBR material.`;
            const floorTexture = await websim.imageGen({
                prompt: floorTexturePrompt,
                aspect_ratio: "1:1"
            });
            
            // Update the labyrinth with texture URLs
            await room.collection('labyrinth').update(labyrinth.id, {
                wallTextureUrl: wallTexture.url,
                floorTextureUrl: floorTexture.url
            });
            
            // Update the current labyrinth
            setCurrentLabyrinth({
                ...labyrinth,
                wallTextureUrl: wallTexture.url,
                floorTextureUrl: floorTexture.url
            });
            
            setLoadingMessage('');
            setIsGenerating(false);
            onClose();
            
        } catch (error) {
            console.error('Error generating labyrinth:', error);
            setLoadingMessage('Error generating labyrinth');
            setIsGenerating(false);
        }
    };
    
    return (
        <div className="generator-panel">
            <div className="panel-header">
                <h2 className="panel-title">Generate New Labyrinth</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            
            <div className="form-group">
                <label htmlFor="theme">Theme or Concept (optional):</label>
                <input 
                    type="text" 
                    id="theme" 
                    placeholder="e.g., Ancient Egyptian, Cyberpunk, Underwater..." 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    disabled={isGenerating}
                />
            </div>
            
            <div className="form-group">
                <label htmlFor="complexity">Complexity:</label>
                <select 
                    id="complexity" 
                    value={complexity}
                    onChange={(e) => setComplexity(e.target.value)}
                    disabled={isGenerating}
                >
                    <option value="simple">Simple</option>
                    <option value="medium">Medium</option>
                    <option value="complex">Complex</option>
                    <option value="insane">Insane</option>
                </select>
            </div>
            
            <button 
                className="submit-button" 
                onClick={generateLabyrinthDescription}
                disabled={isGenerating}
            >
                {isGenerating ? 'Generating...' : 'Generate Labyrinth'}
            </button>
            
            {isGenerating && (
                <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <p>This may take a moment...</p>
                </div>
            )}
            
            {generatedText && !isGenerating && (
                <div className="generated-content">
                    <h3>{generatedText.name}</h3>
                    <p><strong>Biome:</strong> {generatedText.biome}</p>
                    <p>{generatedText.description}</p>
                </div>
            )}
        </div>
    );
}

