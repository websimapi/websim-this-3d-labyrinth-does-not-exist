import React, { useEffect, useState } from 'react';

export function Gallery({ onClose, room, setCurrentLabyrinth }) {
    const [labyrinths, setLabyrinths] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Fetch all labyrinths when component mounts
    useEffect(() => {
        const fetchLabyrinths = () => {
            const labyrinthList = room.collection('labyrinth').getList();
            setLabyrinths(labyrinthList);
            setIsLoading(false);
        };
        
        fetchLabyrinths();
        
        // Subscribe to future updates
        const unsubscribe = room.collection('labyrinth').subscribe(function (updatedLabyrinths) {
            setLabyrinths(updatedLabyrinths);
        });
        
        return () => unsubscribe();
    }, [room]);
    
    // Select a labyrinth and close the gallery
    const selectLabyrinth = (labyrinth) => {
        setCurrentLabyrinth(labyrinth);
        onClose();
    };
    
    return (
        <div className="generator-panel">
            <div className="panel-header">
                <h2 className="panel-title">Labyrinth Gallery</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>
            
            {isLoading ? (
                <div className="loading-indicator">
                    <div className="loading-spinner"></div>
                    <p>Loading labyrinths...</p>
                </div>
            ) : labyrinths.length === 0 ? (
                <div className="empty-state">
                    <p>No labyrinths have been generated yet. Be the first to create one!</p>
                </div>
            ) : (
                <div className="gallery">
                    {labyrinths.map((labyrinth) => (
                        <div 
                            key={labyrinth.id} 
                            className="gallery-item"
                            onClick={() => selectLabyrinth(labyrinth)}
                        >
                            <img 
                                src={labyrinth.imageUrl} 
                                alt={labyrinth.name}
                                className="gallery-image"
                            />
                            <div className="gallery-info">
                                <div className="gallery-title">{labyrinth.name}</div>
                                <div className="gallery-description">{labyrinth.description?.substring(0, 100)}...</div>
                                <div className="gallery-author">Created by: {labyrinth.username}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

