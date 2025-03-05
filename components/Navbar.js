import React from 'react';

export function Navbar({ onGenerateClick, onGalleryClick, currentLabyrinth }) {
    return (
        <div className="navbar">
            <div className="nav-title">
                {currentLabyrinth ? currentLabyrinth.name : 'This 3D Labyrinth Does Not Exist'}
            </div>
            <div className="nav-buttons">
                <button className="nav-button" onClick={onGalleryClick}>
                    Gallery
                </button>
                <button className="nav-button" onClick={onGenerateClick}>
                    Generate New
                </button>
            </div>
        </div>
    );
}

