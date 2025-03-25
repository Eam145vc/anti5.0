import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import './ForensicAnalysis.css';

function ForensicAnalysis({ apiUrl }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');

  // Cargar todos los jugadores
  useEffect(() => {
    const loadAllPlayers = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/players`);
        setPlayers(response.data);
        setError(null);
      } catch (err) {
        setError('Error cargando datos de jugadores');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadAllPlayers();
  }, [apiUrl]);

  // Filtrar jugadores según búsqueda y canal
  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.activisionId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesChannel = filterChannel === 'all' || player.channelId === parseInt(filterChannel);
    return matchesSearch && matchesChannel;
  });

  if (loading && players.length === 0) {
    return <div className="loading">Cargando datos...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="forensic-analysis">
      <h2>Análisis Forense</h2>
      
      <div className="filters">
        <div className="search-box">
          <input 
            type="text" 
            placeholder="Buscar por Activision ID..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="channel-filter">
          <label>Canal: </label>
          <select 
            value={filterChannel} 
            onChange={e => setFilterChannel(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="1">Canal 1</option>
            <option value="2">Canal 2</option>
            <option value="3">Canal 3</option>
            <option value="4">Canal 4</option>
            <option value="5">Canal 5</option>
          </select>
        </div>
      </div>
      
      <div className="player-table-container">
        <table className="player-table">
          <thead>
            <tr>
              <th>Activision ID</th>
              <th>Canal</th>
              <th>Última conexión</th>
              <th>Estado</th>
              <th>Inicio de PC</th>
              <th>Inicio de Monitor</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan="7" className="no-results">No se encontraron jugadores</td>
              </tr>
            ) : (
              filteredPlayers.map(player => (
                <tr key={player.activisionId}>
                  <td>{player.activisionId}</td>
                  <td>Canal {player.channelId}</td>
                  <td>{new Date(player.lastSeen).toLocaleString()}</td>
                  <td>
                    <span className={`status ${player.isOnline ? 'online' : 'offline'}`}>
                      {player.isOnline ? 'En línea' : 'Desconectado'}
                    </span>
                  </td>
                  <td>{player.pcStartTime || 'N/A'}</td>
                  <td>{player.clientStartTime ? new Date(player.clientStartTime).toLocaleString() : 'N/A'}</td>
                  <td>
                    <Link to={`/player/${player.activisionId}`} className="view-button">
                      Ver detalles
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ForensicAnalysis;