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

  // Función de utilidad para renderizar una lista de objetos
  const renderObjectList = (items, renderItem) => {
    if (!items || items.length === 0) {
      return <p>No hay información disponible</p>;
    }

    return (
      <div className="object-list">
        {items.slice(0, 50).map((item, index) => (
          <div key={index} className="object-item">
            {renderItem(item)}
          </div>
        ))}
        {items.length > 50 && (
          <div className="more-items">
            +{items.length - 50} elementos más
          </div>
        )}
      </div>
    );
  };

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
        {['overview', 'system', 'processes', 'network', 'drivers', 'screenshots', 'history'].map(tab => (
          <div 
            key={tab}
            className={`tab ${activeTab === tab ? 'active' : ''}`} 
            onClick={() => setActiveTab(tab)}
          >
            {{
              overview: 'Resumen',
              system: 'Sistema',
              processes: 'Procesos',
              network: 'Red',
              drivers: 'Drivers',
              screenshots: 'Screenshots',
              history: 'Historial'
            }[tab]}
          </div>
        ))}
      </div>
      
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="info-card">
              <h3>Información General</h3>
              <div className="info-row">
                <div className="info-label">Última actividad:</div>
                <div className="info-value">{player.lastSeen ? new Date(player.lastSeen).toLocaleString() : 'N/A'}</div>
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
            
            {monitorData?.hardwareInfo && (
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
            
            {monitorData?.systemInfo && (
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
            
            {monitorData?.usbDevices && monitorData.usbDevices.length > 0 && (
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
            
            {screenshots.length > 0 && (
              <div className="info-card">
                <h3>Screenshots Recientes</h3>
                <div className="screenshots-preview">
                  {screenshots.slice(0, 3).map((screenshot) => (
                    <Link 
                      key={screenshot._id} 
                      to={`/screenshot/${screenshot._id}`} 
                      className="screenshot-preview-item"
                    >
                      <img 
                        src={`data:image/jpeg;base64,${screenshot.screenshot}`} 
                        alt={`Screenshot de ${activisionId}`}
                      />
                      <div className="screenshot-preview-time">
                        {new Date(screenshot.timestamp).toLocaleString()}
                      </div>
                    </Link>
                  ))}
                  {screenshots.length > 3 && (
                    <div className="more-screenshots">
                      +{screenshots.length - 3} screenshots más
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="system-tab">
            <h3>Información del Sistema</h3>
            {monitorData?.systemInfo ? (
              <div className="system-info">
                {Object.entries(monitorData.systemInfo).map(([key, value]) => (
                  <div key={key} className="system-item">
                    <span className="system-label">{key}:</span>
                    <span className="system-value">{value || 'N/A'}</span>
                  </div>
                ))}
                
                {monitorData.hardwareInfo && (
                  <>
                    <h4>Hardware</h4>
                    {Object.entries(monitorData.hardwareInfo).map(([key, value]) => (
                      <div key={key} className="system-item">
                        <span className="system-label">{key}:</span>
                        <span className="system-value">{value || 'N/A'}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            ) : (
              <p>No hay información del sistema disponible</p>
            )}
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="processes-tab">
            <h3>Procesos</h3>
            {renderObjectList(
              monitorData?.processes, 
              (process) => (
                <div className="process-details">
                  <span>Nombre: {process.name || 'Proceso desconocido'}</span>
                  <span>PID: {process.pid || 'N/A'}</span>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'network' && (
          <div className="network-tab">
            <h3>Conexiones de Red</h3>
            {renderObjectList(
              monitorData?.networkConnections, 
              (connection) => (
                <div className="network-connection-details">
                  <span>Local: {connection.localAddress}:{connection.localPort}</span>
                  <span>Remoto: {connection.remoteAddress}:{connection.remotePort}</span>
                  <span>Estado: {connection.state || 'N/A'}</span>
                </div>
              )
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="drivers-tab">
            <h3>Drivers Cargados</h3>
            {renderObjectList(
              monitorData?.loadedDrivers, 
              (driver) => (
                <div className="driver-details">
                  <span>{driver.name || 'Driver desconocido'}</span>
                  <span>Versión: {driver.version || 'N/A'}</span>
                </div>
              )
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
      </div>
    </div>
  );
}

export default PlayerDetail;
