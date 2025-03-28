// server/api/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Crear la aplicación Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/anticheat', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Conectado a MongoDB'))
.catch(err => console.error('Error conectando a MongoDB:', err));

// Definir esquemas y modelos
const PlayerSchema = new mongoose.Schema({
  activisionId: { type: String, required: true, unique: true },
  channelId: { type: Number, required: true },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  isGameRunning: { type: Boolean, default: false },
  clientStartTime: Date,
  pcStartTime: String
});

const MonitorDataSchema = new mongoose.Schema({
  activisionId: { type: String, required: true },
  channelId: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  clientStartTime: Date,
  pcStartTime: String,
  isGameRunning: Boolean,
  processes: Array,
  usbDevices: Array,
  hardwareInfo: Object,
  systemInfo: Object,
  gameConfigHashes: Array,
  networkConnections: Array,
  loadedDrivers: Array,
  backgroundServices: Array,
  memoryInjections: Object
});

const ScreenshotSchema = new mongoose.Schema({
  activisionId: { type: String, required: true },
  channelId: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now },
  screenshot: { type: String, required: true } // Base64
});

const Player = mongoose.model('Player', PlayerSchema);
const MonitorData = mongoose.model('MonitorData', MonitorDataSchema);
const Screenshot = mongoose.model('Screenshot', ScreenshotSchema);

// Rutas API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Obtener todos los jugadores con mejor manejo de errores
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find({});
    
    // Log para depuración
    console.log('Jugadores encontrados:', players.length);
    
    // Si no hay jugadores, devolver un arreglo vacío en lugar de un error
    if (players.length === 0) {
      return res.json([]);
    }
    
    res.json(players);
  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    res.status(500).json({ 
      error: 'Error al recuperar jugadores', 
      details: error.message 
    });
  }
});

// Endpoint para obtener un jugador específico
app.get('/api/players/:activisionId', async (req, res) => {
  try {
    const player = await Player.findOne({ 
      activisionId: req.params.activisionId 
    });
    
    if (!player) {
      return res.status(404).json({ 
        error: 'Jugador no encontrado',
        activisionId: req.params.activisionId
      });
    }
    
    res.json(player);
  } catch (error) {
    console.error('Error al obtener jugador específico:', error);
    res.status(500).json({ 
      error: 'Error al recuperar jugador', 
      details: error.message 
    });
  }
});

// Obtener jugadores por canal
app.get('/api/players/channel/:channelId', async (req, res) => {
  try {
    const players = await Player.find({ channelId: req.params.channelId });
    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener datos de monitoreo por jugador
app.get('/api/monitor/:activisionId', async (req, res) => {
  try {
    const data = await MonitorData.find({ activisionId: req.params.activisionId })
      .sort({ timestamp: -1 })
      .limit(1);
    res.json(data[0] || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de monitoreo por jugador
app.get('/api/monitor/:activisionId/history', async (req, res) => {
  try {
    const data = await MonitorData.find({ activisionId: req.params.activisionId })
      .sort({ timestamp: -1 })
      .limit(10);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener screenshots por jugador
app.get('/api/screenshots/:activisionId', async (req, res) => {
  try {
    const screenshots = await Screenshot.find({ activisionId: req.params.activisionId })
      .sort({ timestamp: -1 });
    res.json(screenshots);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Obtener un screenshot específico por ID
app.get('/api/screenshot/:id', async (req, res) => {
  try {
    const screenshot = await Screenshot.findById(req.params.id);
    if (!screenshot) {
      return res.status(404).json({ error: 'Screenshot no encontrado' });
    }
    res.json(screenshot);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Resto del código anterior (recibir monitor, screenshot, etc.) permanece igual

// Iniciar servidor
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor API corriendo en puerto ${PORT}`);
});
