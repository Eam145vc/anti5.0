import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PlayerDetail.css';

function PlayerDetail({ apiUrl }) {
  const { activisionId } = useParams();
  const [player, setPlayer] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [monitorHistory, setMonitorHistory] = useState([]);
  const [screenshots, setScreenshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Cargar datos del jugador usando useCallback
  const loadPlayerData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Cargar información básica del jugador
      const playerResponse = await axios.get(`${apiUrl}/players`);
      const playerData = playerResponse.data.find(p => p.activisionId === activisionId);
      
      if (!playerData) {
        setError('Jugador no encontrado');
        return;
      }
      
      setPlayer(playerData);
      
      // Cargar datos de monitoreo más recientes
      const monitorResponse = await axios.get(`${apiUrl}/monitor/${activisionId}`);
      setMonitorData(monitorResponse.data);
      
      // Cargar historial de monitoreo
      const historyResponse = await axios.get(`${apiUrl}/monitor/${activisionId}/history`);
      setMonitorHistory(historyResponse.data);
      
      // Cargar screenshots
      const screenshotsResponse = await axios.get(`${apiUrl}/screenshots/${activisionId}`);
      setScreenshots(screenshotsResponse.data);
      
      setError(null);
    } catch (err) {
      setError('Error cargando datos del jugador');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, activisionId]);

  // Cargar datos al montar o cambiar el ID
  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  if (loading) {
    return <div className="loading">Cargando datos del jugador...</div>;
  }

  if (error || !player) {
    return <div className="error">{error || 'No se encontró información del jugador'}</div>;
  }

  return (
    <div className="player-detail">
      <div className="back-link">
        <Link to="/">&larr; Volver al monitoreo</Link>
      </div>
      
      <div className="player-header">
        <h2>{activisionId}</h2>
        <div className="player-info">
          <span className="channel-badge">Canal {player.channelId}</span>
          <span className={`status-badge ${player.isOnline ? 'online' : 'offline'}`}>
            {player.isOnline ? 'En línea' : 'Desconectado'}
          </span>
          {player.isOnline && player.isGameRunning && (
            <span className="game-badge">Juego activo</span>
          )}
        </div>
      </div>
      
      <div className="player-tabs">
        <div 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`} 
          onClick={() => setActiveTab('overview')}
        >
          Resumen
        </div>
        <div 
          className={`tab ${activeTab === 'system' ? 'active' : ''}`} 
          onClick={() => setActiveTab('system')}
        >
          Sistema
        </div>
        <div 
          className={`tab ${activeTab === 'processes' ? 'active' : ''}`} 
          onClick={() => setActiveTab('processes')}
        >
          Procesos
        </div>
        <div 
          className={`tab ${activeTab === 'network' ? 'active' : ''}`} 
          onClick={() => setActiveTab('network')}
        >
          Red
        </div>
        <div 
          className={`tab ${activeTab === 'drivers' ? 'active' : ''}`} 
          onClick={() => setActiveTab('drivers')}
        >
          Drivers
        </div>
        <div 
          className={`tab ${activeTab === 'screenshots' ? 'active' : ''}`} 
          onClick={() => setActiveTab('screenshots')}
        >
          Screenshots
        </div>
        <div 
          className={`tab ${activeTab === 'history' ? 'active' : ''}`} 
          onClick={() => setActiveTab('history')}
        >
          Historial
        </div>
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-card">
              <h3>Información General</h3>
              <div className="info-row">
                <div className="info-label">Última actividad:</div>
                <div className="info-value">{new Date(player.lastSeen).toLocaleString()}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Inicio del PC:</div>
                <div className="info-value">{player.pcStartTime || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Inicio del Monitor:</div>
                <div className="info-value">
                  {player.clientStartTime ? new Date(player.clientStartTime).toLocaleString() : 'N/A'}
                </div>
              </div>
            </div>
            
            {monitorData && monitorData.hardwareInfo && (
              <div className="info-card">
                <h3>Hardware</h3>
                <div className="info-row">
                  <div className="info-label">CPU:</div>
                  <div className="info-value">{monitorData.hardwareInfo.cpu || 'N/A'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">GPU:</div>
                  <div className="info-value">{monitorData.hardwareInfo.gpu || 'N/A'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">RAM:</div>
                  <div className="info-value">{monitorData.hardwareInfo.ram || 'N/A'}</div>
                </div>
              </div>
            )}
            
            {monitorData && monitorData.systemInfo && (
              <div className="info-card">
                <h3>Sistema Operativo</h3>
                <div className="info-row">
                  <div className="info-label">Windows:</div>
                  <div className="info-value">{monitorData.systemInfo.windowsVersion || 'N/A'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">DirectX:</div>
                  <div className="info-value">{monitorData.systemInfo.directXVersion || 'N/A'}</div>
                </div>
                <div className="info-row">
                  <div className="info-label">Driver GPU:</div>
                  <div className="info-value">{monitorData.systemInfo.gpuDriverVersion || 'N/A'}</div>
                </div>
              </div>
            )}
            
            {monitorData && monitorData.usbDevices && monitorData.usbDevices.length > 0 && (
              <div className="info-card">
                <h3>Dispositivos USB</h3>
                <div className="usb-devices">
                  {monitorData.usbDevices.slice(0, 5).map((device, index) => (
                    <div key={index} className="device-item">
                      <div className="device-name">{device.name || 'Dispositivo desconocido'}</div>
                      <div className="device-id">{device.deviceId}</div>
                    </div>
                  ))}
                  {monitorData.usbDevices.length > 5 && (
                    <div className="more-devices">
                      +{monitorData.usbDevices.length - 5} dispositivos más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'screenshots' && (
          <div className="screenshots-tab">
            <h3>Screenshots</h3>
            {screenshots.length === 0 ? (
              <p>No hay screenshots disponibles</p>
            ) : (
              <div className="screenshots-grid">
                {screenshots.map((screenshot) => (
                  <div key={screenshot._id} className="screenshot-thumbnail">
                    <Link to={`/screenshot/${screenshot._id}`}>
                      <img 
                        src={`data:image/jpeg;base64,${screenshot.screenshot}`} 
                        alt={`Screenshot de ${activisionId}`}
                      />
                      <div className="screenshot-info">
                        {new Date(screenshot.timestamp).toLocaleString()}
                      </div>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="history-tab">
            <h3>Historial de Monitoreo</h3>
            {monitorHistory.length > 0 ? (
              <div className="monitor-history-list">
                {monitorHistory.map((entry, index) => (
                  <div key={index} className="history-entry">
                    <div className="history-date">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="history-details">
                      <span>Estado: {entry.isGameRunning ? 'Jugando' : 'Inactivo'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay historial de monitoreo disponible</p>
            )}
          </div>
        )}

        {/* Placeholder para futuras pestañas */}
        {activeTab === 'system' && (
          <div className="system-tab">
            <h3>Información del Sistema</h3>
            {/* Contenido de la pestaña de sistema */}
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="processes-tab">
            <h3>Procesos</h3>
            {monitorData && monitorData.processes ? (
              <div className="processes-list">
                {monitorData.processes.map((process, index) => (
                  <div key={index} className="process-item">
                    <span>{process.name}</span>
                    <span>{process.pid}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay información de procesos disponible</p>
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="network-tab">
            <h3>Conexiones de Red</h3>
            {monitorData && monitorData.networkConnections ? (
              <div className="network-connections">
                {monitorData.networkConnections.map((connection, index) => (
                  <div key={index} className="connection-item">
                    <span>{connection.localAddress}:{connection.localPort}</span>
                    <span>{connection.remoteAddress}:{connection.remotePort}</span>
                    <span>{connection.state}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay información de conexiones de red disponible</p>
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="drivers-tab">
            <h3>Drivers Cargados</h3>
            {monitorData && monitorData.loadedDrivers ? (
              <div className="drivers-list">
                {monitorData.loadedDrivers.map((driver, index) => (
                  <div key={index} className="driver-item">
                    <span>{driver.name}</span>
                    <span>{driver.version}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p>No hay información de drivers disponible</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerDetail;
