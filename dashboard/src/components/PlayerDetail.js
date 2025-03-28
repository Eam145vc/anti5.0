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
  const [deviceFilter, setDeviceFilter] = useState('');
  const [selectedDeviceDetails, setSelectedDeviceDetails] = useState(null);

  // Función mejorada para clasificar y agrupar dispositivos
  const classifyDevices = (devices) => {
    const deviceCategories = {
      USB: [],
      Monitores: [],
      PCI: [],
      Audio: [],
      Red: [],
      GPU: [],
      Periféricos: [],
      Almacenamiento: [],
      Otros: []
    };

    // Patrones ampliados para identificación de dispositivos
    const patterns = {
      monitor: [
        /monitor/i, /display/i, /screen/i, /lcd/i, /led/i, /hdmi/i, /vga/i, /dvi/i,
        /viewsonic/i, /samsung/i, /lg/i, /dell/i, /hp/i, /acer/i, /asus/i, /aoc/i, 
        /benq/i, /nec/i, /philips/i, /msi/i, /lenovo/i, /displayport/i, /edid/i,
        /monitor class/i, /generic pnp/i
      ],
      audio: [
        /audio/i, /sound/i, /speaker/i, /microphone/i, /headphone/i, /headset/i,
        /realtek/i, /creative/i, /logitech/i, /razer/i, /corsair/i, /steelseries/i,
        /hyperx/i, /sennheiser/i, /bose/i, /jabra/i, /plantronics/i, /audio codec/i,
        /alc\d+/i, /high definition audio/i, /sound blaster/i, /audio device/i,
        /mixer/i, /midi/i, /wave/i, /ac97/i
      ],
      network: [
        /network/i, /ethernet/i, /wifi/i, /wireless/i, /lan/i, /wlan/i, /802\.11/i,
        /broadcom/i, /intel/i, /realtek/i, /qualcomm/i, /atheros/i, /killer/i,
        /netgear/i, /tp-link/i, /d-link/i, /asus/i, /cisco/i, /bluetooth/i,
        /network adapter/i, /gigabit/i, /nic/i, /rtl8/i, /\bnic\b/i, /\bwifi\b/i
      ],
      gpu: [
        /nvidia/i, /geforce/i, /gtx/i, /rtx/i, /quadro/i, /amd/i, /radeon/i, /rx/i,
        /vega/i, /graphics/i, /gpu/i, /video/i, /display adapter/i, /3d controller/i,
        /intel hd/i, /intel uhd/i, /intel iris/i, /directx/i, /opengl/i, /vulkan/i
      ],
      usb: [
        /usb/i, /hub/i, /storage/i, /pendrive/i, /flash drive/i, /mass storage/i,
        /composite device/i, /generic/i, /root hub/i, /port/i, /controller/i,
        /xhci/i, /ehci/i, /uhci/i, /usb\d+/i, /universal serial bus/i
      ],
      pci: [
        /pci/i, /pcie/i, /express/i, /bridge/i, /host bridge/i, /controller/i, 
        /chipset/i, /intel/i, /amd/i, /nvidia/i, /bus/i, /pch/i, /northbridge/i, 
        /southbridge/i, /root complex/i, /pci-to-pci/i
      ],
      storage: [
        /disk/i, /drive/i, /hdd/i, /ssd/i, /nvme/i, /storage/i, /raid/i, /ahci/i,
        /sata/i, /ide/i, /scsi/i, /samsung/i, /kingston/i, /western digital/i, /wd/i,
        /seagate/i, /toshiba/i, /crucial/i, /sandisk/i, /intel/i, /m\.2/i,
        /controller/i, /usb storage/i, /flash/i, /memory card/i, /sd card/i
      ],
      peripheral: [
        /keyboard/i, /mouse/i, /trackpad/i, /touchpad/i, /pointing/i, /game/i,
        /controller/i, /joystick/i, /gamepad/i, /webcam/i, /camera/i, /logitech/i, 
        /razer/i, /corsair/i, /steelseries/i, /microsoft/i, /hp/i, /input device/i,
        /hid/i, /human interface/i, /xinput/i, /xbox/i, /playstation/i, /ps4/i,
        /ps5/i, /switch/i, /scanner/i, /printer/i
      ]
    };

    // Marcas comunes de hardware
    const knownBrands = [
      'intel', 'amd', 'nvidia', 'realtek', 'qualcomm', 'broadcom', 'asus', 'dell',
      'hp', 'lenovo', 'acer', 'samsung', 'lg', 'microsoft', 'toshiba', 'kingston',
      'corsair', 'logitech', 'razer', 'gigabyte', 'msi', 'asrock', 'steelseries',
      'creative', 'western digital', 'seagate', 'hyperx', 'crucial', 'sandisk',
      'viewsonic', 'aoc', 'benq', 'nec', 'philips', 'd-link', 'tp-link', 'netgear'
    ];

    devices.forEach(device => {
      // Obtener todos los textos relevantes para clasificación
      const deviceName = (device.name || '').toLowerCase();
      const deviceId = (device.deviceId || '').toLowerCase();
      const description = (device.description || '').toLowerCase();
      const vendor = (device.vendor || device.manufacturer || '').toLowerCase();
      const allText = `${deviceName} ${deviceId} ${description} ${vendor}`;

      let classified = false;
      
      // Función para verificar si algún patrón coincide con el texto
      const matchesPattern = (patterns, text) => {
        return patterns.some(pattern => pattern.test(text));
      };
      
      // Identificar marca para mejorar el nombre del dispositivo
      const detectBrand = (text) => {
        for (const brand of knownBrands) {
          if (text.includes(brand)) {
            return brand.charAt(0).toUpperCase() + brand.slice(1);
          }
        }
        return null;
      };
      
      // Función para generar un nombre más descriptivo
      const getImprovedName = (device, deviceType) => {
        const brand = detectBrand(allText);
        const baseName = device.name || device.description || '';
        
        if (brand && !baseName.toLowerCase().includes(brand.toLowerCase())) {
          return `${brand} ${deviceType}${baseName ? ': ' + baseName : ''}`;
        } else if (baseName) {
          return baseName;
        } else {
          return `${deviceType}${brand ? ' ' + brand : ''}`;
        }
      };

      // 1. Verificar GPU primero (alta prioridad para evitar confusión con otros PCI)
      if (matchesPattern(patterns.gpu, allText)) {
        deviceCategories.GPU.push({
          ...device,
          type: 'Tarjeta Gráfica',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'GPU'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            memoria: device.memory || 'N/A',
            driver: device.driver || 'N/A'
          }
        });
        classified = true;
      }
      
      // 2. Verificar monitores
      else if (matchesPattern(patterns.monitor, allText)) {
        deviceCategories.Monitores.push({
          ...device,
          type: 'Monitor',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'Monitor'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            resolucion: device.resolution || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            interfaz: device.interface || (allText.includes('hdmi') ? 'HDMI' : 
                     allText.includes('displayport') ? 'DisplayPort' : 
                     allText.includes('dvi') ? 'DVI' : 
                     allText.includes('vga') ? 'VGA' : 'N/A')
          }
        });
        classified = true;
      }

      // 3. Verificar dispositivos de audio
      else if (matchesPattern(patterns.audio, allText)) {
        deviceCategories.Audio.push({
          ...device,
          type: 'Dispositivo de Audio',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'Audio'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            tipo: allText.includes('microphone') || allText.includes('mic') ? 'Micrófono' :
                  allText.includes('speaker') ? 'Altavoz' :
                  allText.includes('headset') || allText.includes('headphone') ? 'Auriculares' :
                  'Dispositivo de audio'
          }
        });
        classified = true;
      }

      // 4. Verificar dispositivos de red
      else if (matchesPattern(patterns.network, allText)) {
        deviceCategories.Red.push({
          ...device,
          type: 'Dispositivo de Red',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'Red'),
            mac: device.macAddress || 'N/A',
            descripcion: device.description || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            tipo: allText.includes('wireless') || allText.includes('wifi') || allText.includes('wlan') ? 'Inalámbrico' :
                  allText.includes('ethernet') || allText.includes('lan') ? 'Ethernet' :
                  allText.includes('bluetooth') ? 'Bluetooth' : 'Red'
          }
        });
        classified = true;
      }

      // 5. Verificar dispositivos de almacenamiento
      else if (matchesPattern(patterns.storage, allText)) {
        deviceCategories.Almacenamiento.push({
          ...device,
          type: 'Almacenamiento',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'Almacenamiento'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            tipo: allText.includes('ssd') ? 'SSD' :
                  allText.includes('nvme') ? 'NVMe' :
                  allText.includes('hdd') ? 'HDD' :
                  allText.includes('flash') || allText.includes('usb') ? 'USB' :
                  'Almacenamiento'
          }
        });
        classified = true;
      }

      // 6. Verificar dispositivos USB
      else if (matchesPattern(patterns.usb, allText)) {
        deviceCategories.USB.push({
          ...device,
          type: 'Dispositivo USB',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'USB'),
            identificador: device.deviceId || 'N/A',
            descripcion: device.description || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            puerto: deviceId.includes('hub') ? 'Hub USB' : 
                    device.port || 'Puerto USB'
          }
        });
        classified = true;
      }

      // 7. Verificar periféricos
      else if (matchesPattern(patterns.peripheral, allText)) {
        deviceCategories.Periféricos.push({
          ...device,
          type: 'Periférico',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'Periférico'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            tipo: allText.includes('keyboard') ? 'Teclado' :
                  allText.includes('mouse') ? 'Ratón' :
                  allText.includes('camera') || allText.includes('webcam') ? 'Cámara' :
                  allText.includes('gamepad') || allText.includes('controller') ? 'Controlador de juego' :
                  'Periférico'
          }
        });
        classified = true;
      }

      // 8. Clasificación de dispositivos PCI
      else if (matchesPattern(patterns.pci, allText) || 
               deviceId.startsWith('pci') || 
               deviceName.includes('pci') || 
               description.includes('pci')) {
        deviceCategories.PCI.push({
          ...device,
          type: 'Dispositivo PCI',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: getImprovedName(device, 'PCI'),
            descripcion: device.description || 'N/A',
            identificador: device.deviceId || 'N/A',
            fabricante: device.manufacturer || detectBrand(allText) || 'Desconocido',
            bus: device.bus || deviceId.split(':')[0] || 'N/A'
          }
        });
        classified = true;
      }

      // 9. Si no se clasifica, se envía a Otros
      if (!classified) {
        // Intentar una última vez detectar una marca conocida para mejorar la descripción
        const brand = detectBrand(allText);
        
        deviceCategories.Otros.push({
          ...device,
          type: 'Dispositivo de hardware',
          originalData: JSON.parse(JSON.stringify(device)), // Guardar copia de datos originales
          details: {
            nombre: device.name || (brand ? `Dispositivo ${brand}` : 'Dispositivo desconocido'),
            identificador: device.deviceId || 'N/A',
            descripcion: device.description || 'N/A',
            fabricante: device.manufacturer || brand || 'Desconocido'
          }
        });
      }
    });

    return deviceCategories;
  };

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
                        alt={`Screenshotde ${activisionId}`}
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
                      <strong>Versión:</strong> {driver.version || 'N/A'}
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
          <div className="devices-tab">
            <h3>Dispositivos Conectados</h3>
            {monitorData?.usbDevices && monitorData.usbDevices.length > 0 ? (
              <div className="devices-detailed">
                {/* Resumen detallado de dispositivos */}
                <div className="devices-summary">
                  <h4>Resumen de Dispositivos</h4>
                  
                  {/* Filtro de búsqueda de dispositivos */}
                  <div className="device-search">
                    <input
                      type="text"
                      placeholder="Buscar dispositivos..."
                      value={deviceFilter}
                      onChange={(e) => setDeviceFilter(e.target.value)}
                      className="device-search-input"
                    />
                    {deviceFilter && (
                      <button 
                        className="device-search-clear" 
                        onClick={() => setDeviceFilter('')}
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {/* Resumen de categorías */}
                  {(() => {
                    const categorizedDevices = classifyDevices(monitorData.usbDevices);
                    return (
                      <div className="device-summary-grid">
                        {Object.entries(categorizedDevices)
                          .filter(([_, devices]) => devices.length > 0)
                          .map(([category, devices]) => (
                            <div 
                              key={category} 
                              className="device-summary-item"
                              onClick={() => {
                                setDeviceFilter(category.toLowerCase());
                              }}
                            >
                              <span>{category}:</span>
                              <span>{devices.length}</span>
                            </div>
                          ))
                        }
                      </div>
                    );
                  })()}
                </div>

                {/* Desglose detallado por categoría */}
                {(() => {
                  const categorizedDevices = classifyDevices(monitorData.usbDevices);
                  
                  // Lista de dispositivos potencialmente sospechosos para analizar
                  const suspiciousPatterns = [
                    { pattern: /keylogger/i, reason: 'Posible keylogger' },
                    { pattern: /rubberducky/i, reason: 'Dispositivo USB potencialmente malicioso' },
                    { pattern: /badusb/i, reason: 'Dispositivo BadUSB potencial' },
                    { pattern: /unknown/i, reason: 'Dispositivo sin identificar' },
                    { pattern: /virtual/i, reason: 'Dispositivo virtual' },
                    { pattern: /phantom/i, reason: 'Dispositivo fantasma' },
                    { pattern: /usb redirector/i, reason: 'Redireccionador USB' },
                    { pattern: /remote/i, reason: 'Posible dispositivo remoto' }
                  ];
                  
                  // Función para detectar dispositivos sospechosos
                  const checkIfSuspicious = (device) => {
                    const allText = `${device.details.nombre} ${device.details.descripcion} ${device.details.identificador}`.toLowerCase();
                    for (const { pattern, reason } of suspiciousPatterns) {
                      if (pattern.test(allText)) {
                        return reason;
                      }
                    }
                    return null;
                  };
                  
                  // Función para verificar si un dispositivo coincide con el filtro
                  const matchesFilter = (device, category) => {
                    if (!deviceFilter) return true;
                    
                    const searchLower = deviceFilter.toLowerCase();
                    const categoryMatch = category.toLowerCase().includes(searchLower);
                    const nameMatch = (device.details.nombre || '').toLowerCase().includes(searchLower);
                    const descMatch = (device.details.descripcion || '').toLowerCase().includes(searchLower);
                    const idMatch = (device.details.identificador || '').toLowerCase().includes(searchLower);
                    const typeMatch = (device.type || '').toLowerCase().includes(searchLower);
                    const manufacturerMatch = (device.details.fabricante || '').toLowerCase().includes(searchLower);
                    
                    return categoryMatch || nameMatch || descMatch || idMatch || typeMatch || manufacturerMatch;
                  };
                  
                  // Modal para detalles del dispositivo
                  const renderDeviceDetailsModal = () => {
                    if (!selectedDeviceDetails) return null;
                    
                    return (
                      <div className="device-details-modal" onClick={() => setSelectedDeviceDetails(null)}>
                        <div className="device-details-content" onClick={(e) => e.stopPropagation()}>
                          <div className="device-details-header">
                            <h3>{selectedDeviceDetails.details.nombre || 'Detalles del dispositivo'}</h3>
                            <button 
                              className="device-details-close"
                              onClick={() => setSelectedDeviceDetails(null)}
                            >
                              ×
                            </button>
                          </div>
                          <div className="device-details-body">
                            {Object.entries(selectedDeviceDetails)
                              .filter(([key]) => key !== 'details')
                              .map(([key, value]) => {
                                // No mostrar objetos anidados aquí
                                if (typeof value === 'object' && value !== null) return null;
                                return (
                                  <div key={key} className="device-property">
                                    <div className="device-property-key">{key}</div>
                                    <div className="device-property-value">{String(value)}</div>
                                  </div>
                                );
                              })}
                            {/* Mostrar detalles específicos */}
                            {Object.entries(selectedDeviceDetails.details).map(([key, value]) => (
                              <div key={key} className="device-property">
                                <div className="device-property-key">{key.charAt(0).toUpperCase() + key.slice(1)}</div>
                                <div className="device-property-value">{value}</div>
                              </div>
                            ))}
                            
                            {selectedDeviceDetails.raw && (
                              <div className="device-property device-raw-data">
                                <div className="device-property-key">Datos originales</div>
                                <div className="device-property-value">
                                  <pre>{JSON.stringify(selectedDeviceDetails.raw, null, 2)}</pre>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  };
                  
                  // Filtrar y mostrar categorías que coinciden con el filtro
                  const filteredCategories = Object.entries(categorizedDevices)
                    .map(([category, devices]) => {
                      const filteredDevices = devices.filter(device => matchesFilter(device, category));
                      return { category, devices: filteredDevices };
                    })
                    .filter(({ devices }) => devices.length > 0);
                  
                  // Si no hay coincidencias con el filtro
                  if (deviceFilter && filteredCategories.length === 0) {
                    return (
                      <div className="no-devices-message">
                        No se encontraron dispositivos que coincidan con "{deviceFilter}".
                        <button 
                          className="device-filter-clear-btn"
                          onClick={() => setDeviceFilter('')}
                        >
                          Limpiar filtro
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      {filteredCategories.map(({ category, devices }) => (
                        <div key={category} className="device-category">
                          <h4>{category} ({devices.length})</h4>
                          <div className="device-list">
                            {devices.map((device, index) => {
                              const suspiciousReason = checkIfSuspicious(device);
                              return (
                                <div 
                                  key={index} 
                                  className={`device-item ${suspiciousReason ? 'device-suspicious' : ''}`}
                                  title={suspiciousReason || ''}
                                  onClick={() => setSelectedDeviceDetails({...device, raw: device.originalData || null})}
                                >
                                  <div className="device-main-info">
                                    <strong>{device.details.nombre || 'Dispositivo sin nombre'}</strong>
                                    <span className="device-type">{device.type}</span>
                                  </div>
                                  <div className="device-additional-info">
                                    {suspiciousReason && (
                                      <span className="suspicious-reason">
                                        <strong>Alerta:</strong> {suspiciousReason}
                                      </span>
                                    )}
                                    {Object.entries(device.details)
                                      .filter(([key]) => key !== 'nombre')
                                      .map(([key, value]) => (
                                        <span key={key}>
                                          <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong> {value}
                                        </span>
                                      ))
                                    }
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      
                      {/* Renderizar el modal si hay un dispositivo seleccionado */}
                      {renderDeviceDetailsModal()}
                    </>
                  );
                })()}
              </div>
            ) : (
              <p>No se encontraron dispositivos</p>
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
