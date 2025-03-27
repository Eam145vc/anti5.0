import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import './ScreenshotViewer.css';

function ScreenshotViewer({ apiUrl }) {
  const { id } = useParams();
  const [screenshot, setScreenshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadScreenshot = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${apiUrl}/screenshot/${id}`);
        setScreenshot(response.data);
        setError(null);
      } catch (err) {
        setError('Error cargando screenshot');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadScreenshot();
  }, [apiUrl, id]);

  if (loading) {
    return <div className="loading">Cargando screenshot...</div>;
  }

  if (error || !screenshot) {
    return <div className="error">{error || 'No se encontró el screenshot'}</div>;
  }

  return (
    <div className="screenshot-viewer">
      <div className="back-link">
        <Link to={`/player/${screenshot.activisionId}`}>&larr; Volver al jugador</Link>
      </div>
      
      <div className="screenshot-header">
        <h2>Screenshot de {screenshot.activisionId}</h2>
        <div className="screenshot-info">
          <span className="time-badge">
            {new Date(screenshot.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
      
      <div className="screenshot-container">
        <img 
          src={`data:image/jpeg;base64,${screenshot.screenshot}`} 
          alt={`Screenshot de ${screenshot.activisionId}`} 
        />
      </div>
    </div>
  );
}

export default ScreenshotViewer;
