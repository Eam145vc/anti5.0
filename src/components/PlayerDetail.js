import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './PlayerDetail.css';

function PlayerDetail({ apiUrl }) {
  const { activisionId } = useParams();
  const [player, setPlayer] = useState(null);
  const [monitorData, setMonitorData] = useState(null);
  const [screenshots, setScreenshots] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Cargar datos del jugador
  useEffect(() => {
    const loadPlayerData = async () => {
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
        setHistory(historyResponse.data);
        
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
    };

    loadPlayerData();
  }, [apiUrl, activisionId]);

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
        
        {/* El resto de las secciones de pestañas aquí */}
        {/* ... (system, processes, network, drivers, screenshots, history) */}
      </div>
    </div>
  );
}

export default PlayerDetail;