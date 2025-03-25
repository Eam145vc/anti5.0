import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import axios from 'axios';
import './App.css';

// Componentes
import LiveMonitoring from './components/LiveMonitoring';
import ForensicAnalysis from './components/ForensicAnalysis';
import PlayerDetail from './components/PlayerDetail';
import ScreenshotViewer from './components/ScreenshotViewer';

// Config
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:3000';

function App() {
  const [selectedChannel, setSelectedChannel] = useState(1);
  const [socket, setSocket] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);

  // Inicializar socket
  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Unirse al canal seleccionado
  useEffect(() => {
    if (socket) {
      socket.emit('join-channel', selectedChannel);
    }
  }, [socket, selectedChannel]);

  // Manejar notificaciones
  useEffect(() => {
    if (socket) {
      // Actualización de estado de monitor
      socket.on('monitor-update', (data) => {
        addNotification(`El jugador ${data.activisionId} ha enviado datos de monitoreo`);
      });

      // Actualización de estado del juego
      socket.on('game-status-update', (data) => {
        const status = data.isGameRunning ? 'iniciado' : 'cerrado';
        addNotification(`El jugador ${data.activisionId} ha ${status} el juego`);
      });

      // Nuevo screenshot
      socket.on('new-screenshot', (data) => {
        addNotification(`El jugador ${data.activisionId} ha enviado un nuevo screenshot`);
      });

      // Jugador offline
      socket.on('player-offline', (data) => {
        addNotification(`El jugador ${data.activisionId} se ha desconectado`, 'warning');
      });
    }
  }, [socket]);

  const addNotification = useCallback((message, type = 'info') => {
    const newNotification = {
      id: Date.now(),
      message,
      type,
      time: new Date().toLocaleTimeString()
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50));
    setNotificationCount(prev => prev + 1);
  }, []);

  const clearNotifications = () => {
    setNotificationCount(0);
  };

  const handleChannelChange = (e) => {
    setSelectedChannel(parseInt(e.target.value));
  };

  return (
    <Router>
      <div className="app-container">
        <header className="app-header">
          <div className="logo">
            <h1>Anti-Cheat Dashboard</h1>
          </div>
          <div className="channel-selector">
            <label>Canal: </label>
            <select value={selectedChannel} onChange={handleChannelChange}>
              <option value={1}>Canal 1</option>
              <option value={2}>Canal 2</option>
              <option value={3}>Canal 3</option>
              <option value={4}>Canal 4</option>
              <option value={5}>Canal 5</option>
            </select>
          </div>
          <div className="notification-icon" onClick={clearNotifications}>
            <span className="material-icons">notifications</span>
            {notificationCount > 0 && (
              <span className="notification-badge">{notificationCount}</span>
            )}
          </div>
        </header>

        <div className="app-content">
          <nav className="app-nav">
            <ul>
              <li>
                <Link to="/">Monitoreo en Vivo</Link>
              </li>
              <li>
                <Link to="/forensic">Análisis Forense</Link>
              </li>
            </ul>
          </nav>

          <main className="main-content">
            <Routes>
              <Route 
                path="/" 
                element={
                  <LiveMonitoring 
                    selectedChannel={selectedChannel} 
                    apiUrl={API_URL} 
                    socket={socket} 
                  />
                } 
              />
              <Route 
                path="/forensic" 
                element={
                  <ForensicAnalysis 
                    apiUrl={API_URL} 
                  />
                } 
              />
              <Route 
                path="/player/:activisionId" 
                element={
                  <PlayerDetail 
                    apiUrl={API_URL} 
                  />
                } 
              />
              <Route 
                path="/screenshot/:id" 
                element={
                  <ScreenshotViewer 
                    apiUrl={API_URL} 
                  />
                } 
              />
            </Routes>
          </main>

          {notifications.length > 0 && (
            <div className="notification-panel">
              <h3>Notificaciones</h3>
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id} className={`notification-${notification.type}`}>
                    <span className="notification-time">{notification.time}</span>
                    <span className="notification-message">{notification.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </Router>
  );
}

export default App;
