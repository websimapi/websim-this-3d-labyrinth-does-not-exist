import React, { useState, useEffect } from 'react';
import { GameView } from './GameView.js';
import { GeneratorPanel } from './GeneratorPanel.js';
import { Gallery } from './Gallery.js';
import { MobileControls } from './MobileControls.js';
import { Navbar } from './Navbar.js';
import { StatusBar } from './StatusBar.js';

export function App() {
    // Initialize WebSocket connection for multiplayer
    const [room] = useState(() => new WebsimSocket());
    
    // State variables
    const [showGenerator, setShowGenerator] = useState(false);
    const [showGallery, setShowGallery] = useState(false);
    const [currentLabyrinth, setCurrentLabyrinth] = useState(null);
    const [isMobile, setIsMobile] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Load a random labyrinth when starting
    useEffect(() => {
        const labyrinths = room.collection('labyrinth').getList();
        if (labyrinths && labyrinths.length > 0) {
            const randomIndex = Math.floor(Math.random() * labyrinths.length);
            setCurrentLabyrinth(labyrinths[randomIndex]);
        }
    }, [room]);

    // Connect to the room and handle event messages
    useEffect(() => {
        // Handle WebSocket messages
        room.onmessage = (event) => {
            const data = event.data;
            if (data.type === 'labyrinthUpdate') {
                // Handle labyrinth updates in real-time
                console.log('Received labyrinth update:', data);
            }
        };
    }, [room]);

    return (
        <div className="game-container">
            {/* 3D Labyrinth Renderer */}
            <GameView 
                labyrinth={currentLabyrinth} 
                room={room} 
                isMobile={isMobile}
            />
            
            {/* UI Overlays */}
            <div className="ui-overlay top-overlay">
                <Navbar 
                    onGenerateClick={() => setShowGenerator(true)}
                    onGalleryClick={() => setShowGallery(true)}
                    currentLabyrinth={currentLabyrinth}
                />
            </div>
            
            <div className="ui-overlay bottom-overlay">
                <StatusBar 
                    loadingMessage={loadingMessage} 
                    currentLabyrinth={currentLabyrinth}
                    room={room}
                />
            </div>
            
            {/* Mobile Controls (only shown on mobile devices) */}
            {isMobile && <MobileControls />}
            
            {/* Generator Panel */}
            {showGenerator && (
                <GeneratorPanel 
                    onClose={() => setShowGenerator(false)}
                    room={room}
                    setCurrentLabyrinth={setCurrentLabyrinth}
                    setLoadingMessage={setLoadingMessage}
                />
            )}
            
            {/* Gallery Panel */}
            {showGallery && (
                <Gallery 
                    onClose={() => setShowGallery(false)}
                    room={room}
                    setCurrentLabyrinth={setCurrentLabyrinth}
                />
            )}
        </div>
    );
}

