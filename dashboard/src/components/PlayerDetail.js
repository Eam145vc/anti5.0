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

  // Cargar datos del jugador
  const loadPlayerData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Intentar obtener el jugador directamente por ID
      try {
        const playerResponse = await axios.get(`${apiUrl}/players/${activisionId}`);
        setPlayer(playerResponse.data);
      } catch (playerError) {
        console.error('Error obteniendo jugador específico:', playerError);
        
        // Fallback: buscar en la lista de jugadores
        const allPlayersResponse = await axios.get(`${apiUrl}/players`);
        const playerData = allPlayersResponse.data.find(p => p.activisionId === activisionId);
        
        if (!playerData) {
          setError('Jugador no encontrado');
          return;
        }
        
        setPlayer(playerData);
      }
      
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
      console.error('Error completo:', err);
      setError('Error cargando datos del jugador: ' + 
        (err.response?.data?.error || err.message || 'Error desconocido')
      );
    } finally {
      setLoading(false);
    }
  }, [apiUrl, activisionId]);

  // Cargar datos al montar o cambiar el ID
  useEffect(() => {
    loadPlayerData();
  }, [loadPlayerData]);

  // Función de utilidad para renderizar una lista de objetos
  const renderObjectList = (items, renderItem, maxItems = 50) => {
    if (!items || items.length === 0) {
      return <p>No hay información disponible</p>;
    }

    return (
      <div className="object-list">
        {items.slice(0, maxItems).map((item, index) => (
          <div key={index} className="object-item">
            {renderItem(item)}
          </div>
        ))}
        {items.length > maxItems && (
          <div className="more-items">
            +{items.length - maxItems} elementos más
          </div>
        )}
      </div>
    );
  };

  // Función para clasificar dispositivos USB
  const classifyUsbDevice = (device) => {
    const deviceName = device.name ? device.name.toLowerCase() : '';
    if (deviceName.includes('monitor') || deviceName.includes('display')) {
      return 'Monitor';
    } else if (deviceName.includes('mouse')) {
      return 'Ratón';
    } else if (deviceName.includes('keyboard')) {
      return 'Teclado';
    } else if (deviceName.includes('audio') || deviceName.includes('sound')) {
      return 'Dispositivo de Audio';
    } else if (deviceName.includes('camera') || deviceName.includes('webcam')) {
      return 'Cámara/Webcam';
    } else {
      return 'Otro dispositivo USB';
    }
  };

  // Renderizado condicional de error y carga
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Cargando datos del jugador...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h2>Error al cargar datos</h2>
        <p>{error}</p>
        <div className="error-details">
          <p>Posibles causas:</p>
          <ul>
            <li>El jugador no existe</li>
            <li>Problemas de conexión con el servidor</li>
            <li>ID de jugador incorrecto</li>
          </ul>
        </div>
        <button onClick={loadPlayerData} className="retry-button">
          Reintentar
        </button>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="no-player">
        <h2>Jugador no encontrado</h2>
        <p>Verifique el ID del jugador e intente nuevamente.</p>
      </div>
    );
  }

  // Renderizado principal del componente
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
        {['overview', 'system', 'processes', 'network', 'drivers', 'screenshots', 'usb', 'history'].map(tab => (
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
              usb: 'Dispositivos',
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
                <div className="info-value">
                  {player.lastSeen ? new Date(player.lastSeen).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div className="info-row">
                <div className="info-label">Inicio del PC:</div>
                <div className="info-value">{player.pcStartTime || 'N/A'}</div>
              </div>
              <div className="info-row">
                <div className="info-label">Inicio del Monitor:</div>
                <div className="info-value">
                  {player.clientStartTime 
                    ? new Date(player.clientStartTime).toLocaleString() 
                    : 'N/A'}
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
                  <div className="info-value">
                    {monitorData.systemInfo.windowsVersion || 'N/A'}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">DirectX:</div>
                  <div className="info-value">
                    {monitorData.systemInfo.directXVersion || 'N/A'}
                  </div>
                </div>
                <div className="info-row">
                  <div className="info-label">Driver GPU:</div>
                  <div className="info-value">
                    {monitorData.systemInfo.gpuDriverVersion || 'N/A'}
                  </div>
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
                <div className="system-details">
                  <h4>Información del Sistema Operativo</h4>
                  {Object.entries(monitorData.systemInfo).map(([key, value]) => (
                    <div key={key} className="system-item">
                      <span className="system-label">{key}:</span>
                      <span className="system-value">{value || 'N/A'}</span>
                    </div>
                  ))}
                </div>
                
                {monitorData.hardwareInfo && (
                  <div className="hardware-details">
                    <h4>Información de Hardware</h4>
                    {Object.entries(monitorData.hardwareInfo).map(([key, value]) => (
                      <div key={key} className="system-item">
                        <span className="system-label">{key}:</span>
                        <span className="system-value">{value || 'N/A'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <p>No hay información del sistema disponible</p>
            )}
          </div>
        )}

        {activeTab === 'processes' && (
          <div className="processes-tab">
            <h3>Procesos en Ejecución</h3>
            {renderObjectList(
              monitorData?.processes, 
              (process) => (
                <div className="process-details">
                  <div className="process-main-info">
                    <span className="process-name">
                      <strong>Nombre:</strong> {process.name || 'Proceso desconocido'}
                    </span>
                    <span className="process-pid">
                      <strong>PID:</strong> {process.pid || 'N/A'}
                    </span>
                  </div>
                  <div className="process-additional-info">
                    <span className="process-path">
                      <strong>Ruta:</strong> {process.filePath || 'N/A'}
                    </span>
                    <span className="process-hash">
                      <strong>Hash SHA256:</strong> 
                      {process.fileHash ? 
                        <code>{process.fileHash}</code> : 
                        'No disponible'}
                    </span>
                  </div>
                </div>
              ),
              100 // Mostrar hasta 100 procesos
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
                  <div className="connection-main-info">
                    <span>
                      <strong>Local:</strong> {connection.localAddress}:{connection.localPort}
                    </span>
                    <span>
                      <strong>Remoto:</strong> {connection.remoteAddress}:{connection.remotePort}
                    </span>
                  </div>
                  <div className="connection-additional-info">
                    <span>
                      <strong>Estado:</strong> {connection.state || 'N/A'}
                    </span>
                    <span>
                      <strong>Protocolo:</strong> {connection.protocol || 'N/A'}
                    </span>
                  </div>
                </div>
              ),
              100 // Mostrar hasta 100 conexiones
            )}
          </div>
        )}

        {activeTab === 'drivers' && (
          <div className="drivers-tab">
            <h3>Drivers del Sistema</h3>
            {renderObjectList(
              monitorData?.loadedDrivers, 
              (driver) => (
                <div className="driver-details">
                  <div className="driver-main-info">
                    <span>
                      <strong>Nombre:</strong> {driver.name || 'Driver desconocido'}
                    </span>
                    <span>
                      <strong>Versión:</strong> {driver.version
              || 'N/A'}
                    </span>
                  </div>
                  <div className="driver-additional-info">
                    <span>
                      <strong>Firmado:</strong> {driver.isSigned ? 'Sí' : 'No'}
                    </span>
                    <span>
                      <strong>Ruta:</strong> {driver.pathName || 'N/A'}
                    </span>
                  </div>
                </div>
              ),
              100 // Mostrar hasta 100 drivers
            )}
          </div>
        )}

        {activeTab === 'usb' && (
          <div className="usb-devices-tab">
            <h3>Dispositivos USB Conectados</h3>
            {monitorData?.usbDevices && monitorData.usbDevices.length > 0 ? (
              <div className="usb-devices-detailed">
                <div className="usb-device-types">
                  <h4>Resumen por Tipo</h4>
                  {(() => {
                    const deviceTypes = monitorData.usbDevices.reduce((acc, device) => {
                      const type = classifyUsbDevice(device);
                      acc[type] = (acc[type] || 0) + 1;
                      return acc;
                    }, {});

                    return (
                      <div className="device-type-summary">
                        {Object.entries(deviceTypes).map(([type, count]) => (
                          <div key={type} className="device-type-item">
                            <span>{type}:</span>
                            <span>{count}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>

                <h4>Lista Completa de Dispositivos</h4>
                {renderObjectList(
                  monitorData.usbDevices, 
                  (device) => (
                    <div className="usb-device-details">
                      <div>
                        <strong>Nombre:</strong> {device.name || 'Dispositivo desconocido'}
                      </div>
                      <div>
                        <strong>ID de Dispositivo:</strong> {device.deviceId}
                      </div>
                      <div>
                        <strong>ID de Hardware:</strong> {device.hardwareId || 'N/A'}
                      </div>
                      <div>
                        <strong>Tipo:</strong> {classifyUsbDevice(device)}
                      </div>
                    </div>
                  ),
                  100 // Mostrar hasta 100 dispositivos
                )}
              </div>
            ) : (
              <p>No se encontraron dispositivos USB</p>
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
                      {entry.screenshot && (
                        <Link 
                          to={`/screenshot/${entry.screenshot}`} 
                          className="history-screenshot-link"
                        >
                          Ver Screenshot
                        </Link>
                      )}
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
