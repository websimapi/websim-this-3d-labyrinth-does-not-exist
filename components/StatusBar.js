import React, { useEffect, useState } from 'react';

export function StatusBar({ loadingMessage, currentLabyrinth, room }) {
    const [connectedUsers, setConnectedUsers] = useState(0);
    
    // Subscribe to the peers updates to show connected users
    useEffect(() => {
        const updateConnectedUsers = (peers) => {
            setConnectedUsers(Object.keys(peers).length);
        };
        
        updateConnectedUsers(room.party.peers);
        const unsubscribe = room.party.subscribe(updateConnectedUsers);
        
        return () => unsubscribe();
    }, [room]);
    
    return (
        <div className="status-bar">
            {loadingMessage ? (
                <span>{loadingMessage}</span>
            ) : (
                <span>
                    {connectedUsers} {connectedUsers === 1 ? 'explorer' : 'explorers'} connected
                    {currentLabyrinth && ` • ${currentLabyrinth.biome} labyrinth • ${currentLabyrinth.complexity} complexity`}
                </span>
            )}
        </div>
    );
}

