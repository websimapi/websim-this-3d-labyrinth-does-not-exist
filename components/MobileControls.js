import React from 'react';

export function MobileControls({ onControlPress }) {
    return (
        <div className="mobile-controls">
            <div className="control-pad">
                <button 
                    className="control-button up-button"
                    onTouchStart={() => onControlPress('up')}
                    onTouchEnd={() => onControlPress('stop')}
                >
                    ↑
                </button>
                <button 
                    className="control-button left-button"
                    onTouchStart={() => onControlPress('left')}
                    onTouchEnd={() => onControlPress('stop')}
                >
                    ←
                </button>
                <button 
                    className="control-button center-button"
                    onTouchStart={() => onControlPress('jump')}
                >
                    •
                </button>
                <button 
                    className="control-button right-button"
                    onTouchStart={() => onControlPress('right')}
                    onTouchEnd={() => onControlPress('stop')}
                >
                    →
                </button>
                <button 
                    className="control-button down-button"
                    onTouchStart={() => onControlPress('down')}
                    onTouchEnd={() => onControlPress('stop')}
                >
                    ↓
                </button>
            </div>
        </div>
    );
}

