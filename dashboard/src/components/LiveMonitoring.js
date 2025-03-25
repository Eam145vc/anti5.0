import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './LiveMonitoring.css';

function LiveMonitoring({ selectedChannel, apiUrl, socket }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para cargar jugadores del canal seleccionado
  const loadPlayers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${apiUrl}/players/channel/${selectedChannel}`);
      setPlayers(response.data);
      setError(null);
    } catch (err) {
      setError('Error cargando jugadores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedChannel, apiUrl]);

  // Cargar jugadores al iniciar o cambiar de canal
  useEffect(() => {
    loadPlayers();
    
    // Configurar un intervalo para actualizar periódicamente
    const interval = setInterval(loadPlayers, 30000); // cada 30 segundos
    
    return () => clearInterval(interval);
  }, [loadPlayers]);

  // Escuchar eventos del socket para actualizar en tiempo real
  useEffect(() => {
    if (socket) {
      // Cuando un jugador envía datos de monitoreo
      socket.on('monitor-update', (data) => {
        if (data.channelId === selectedChannel) {
          setPlayers(prev => {
            const updated = [...prev];
            const index = updated.findIndex(p => p.activisionId === data.activisionId);
            
            if (index >= 0) {
              updated[index] = { ...updated[index], isGameRunning: data.isGameRunning, lastSeen: new Date() };
            } else {
              // Cargar todos los jugadores de nuevo
              loadPlayers();
            }
            
            return updated;
          });
        }
      });
      
      // Cuando cambia el estado del juego
      socket.on('game-status-update', (data) => {
        setPlayers(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.activisionId === data.activisionId);
          
          if (index >= 0) {
            updated[index] = { ...updated[index], isGameRunning: data.isGameRunning };
          }
          
          return updated;
        });
      });
      
      // Cuando un jugador se desconecta
      socket.on('player-offline', (data) => {
        setPlayers(prev => {
          const updated = [...prev];
          const index = updated.findIndex(p => p.activisionId === data.activisionId);
          
          if (index >= 0) {
            updated[index] = { ...updated[index], isOnline: false };
          }
          
          return updated;
        });
      });
    }
    
    return () => {
      if (socket) {
        socket.off('monitor-update');
        socket.off('game-status-update');
        socket.off('player-offline');
      }
    };
  }, [socket, selectedChannel, loadPlayers]);

  if (loading && players.length === 0) {
    return <div className="loading">Cargando jugadores...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  const onlinePlayers = players.filter(player => player.isOnline);
  const offlinePlayers = players.filter(player => !player.isOnline);

  return (
    <div className="live-monitoring">
      <h2>Monitoreo en Vivo - Canal {selectedChannel}</h2>
      
      <div className="player-section">
        <h3>Jugadores Conectados ({onlinePlayers.length})</h3>
        {onlinePlayers.length === 0 ? (
          <p>No hay jugadores conectados en este canal</p>
        ) : (
          <div className="player-grid">
            {onlinePlayers.map(player => (
              <div 
                key={player.activisionId} 
                className={`player-card ${player.isGameRunning ? 'game-running' : ''}`}
              >
                <div className="player-header">
                  <h4>{player.activisionId}</h4>
                  <span className={`status-indicator ${player.isOnline ? 'online' : 'offline'}`}></span>
                </div>
                
                <div className="player-details">
                  <p>Estado del juego: {player.isGameRunning ? 'Activo' : 'Inactivo'}</p>
                  <p>Última actividad: {new Date(player.lastSeen).toLocaleTimeString()}</p>
                </div>
                
                <div className="player-actions">
                  <Link to={`/player/${player.activisionId}`} className="view-details">
                    Ver detalles
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {offlinePlayers.length > 0 && (
        <div className="player-section offline-section">
          <h3>Jugadores Desconectados ({offlinePlayers.length})</h3>
          <div className="player-grid">
            {offlinePlayers.map(player => (
              <div key={player.activisionId} className="player-card offline">
                <div className="player-header">
                  <h4>{player.activisionId}</h4>
                  <span className="status-indicator offline"></span>
                </div>
                
                <div className="player-details">
                  <p>Última actividad: {new Date(player.lastSeen).toLocaleString()}</p>
                </div>
                
                <div className="player-actions">
                  <Link to={`/player/${player.activisionId}`} className="view-details">
                    Ver historial
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <button className="refresh-button" onClick={loadPlayers}>
        Actualizar
      </button>
    </div>
  );
}

export default LiveMonitoring;
