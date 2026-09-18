import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Data paths
const DATA_DIR = path.join(__dirname, 'data', 'processed', 'predictions');
const SEA_ICE_CSV = path.join(DATA_DIR, 'prediction_latest.csv');

// Simulated data providers
class SimulatedVesselProvider {
  constructor() {
    this.vessels = [
      {
        vessel_id: 'vessel-001',
        name: 'RV POLAR EXPLORER',
        type: 'Ice-Class Research Vessel',
        latitude: -72.45,
        longitude: 18.24,
        heading: 285,
        speed: 12.3,
        fuel: 42.1,
        draft: 6.8,
        length: 89,
        beam: 18,
        status: 'active',
        timestamp: new Date().toISOString(),
        data_source: 'SIMULATED'
      },
      {
        vessel_id: 'vessel-002',
        name: 'ANTARCTIC ICEBREAKER',
        type: 'Heavy Icebreaker',
        latitude: -72.85,
        longitude: 17.45,
        heading: 320,
        speed: 14.2,
        fuel: 38.5,
        draft: 8.2,
        length: 122,
        beam: 22,
        status: 'active',
        timestamp: new Date().toISOString(),
        data_source: 'SIMULATED'
      },
      {
        vessel_id: 'vessel-003',
        name: 'RESEARCH SUPPORT VESSEL',
        type: 'Research Support',
        latitude: -72.15,
        longitude: 19.12,
        heading: 195,
        speed: 10.8,
        fuel: 25.3,
        draft: 5.5,
        length: 65,
        beam: 14,
        status: 'active',
        timestamp: new Date().toISOString(),
        data_source: 'SIMULATED'
      },
      {
        vessel_id: 'vessel-004',
        name: 'RESUPPLY VESSEL',
        type: 'Polar Resupply',
        latitude: -72.62,
        longitude: 16.85,
        heading: 45,
        speed: 11.5,
        fuel: 52.8,
        draft: 7.2,
        length: 95,
        beam: 16,
        status: 'active',
        timestamp: new Date().toISOString(),
        data_source: 'SIMULATED'
      },
      {
        vessel_id: 'vessel-005',
        name: 'DISTANT RESEARCH VESSEL',
        type: 'Research Vessel',
        latitude: -73.12,
        longitude: 20.45,
        heading: 110,
        speed: 9.7,
        fuel: 31.2,
        draft: 5.8,
        length: 72,
        beam: 15,
        status: 'active',
        timestamp: new Date().toISOString(),
        data_source: 'SIMULATED'
      }
    ];
  }

  getAll() {
    return this.vessels;
  }

  getById(id) {
    return this.vessels.find(v => v.vessel_id === id);
  }
}

class SimulatedIcebergProvider {
  constructor() {
    this.icebergs = [
      {
        iceberg_id: 'iceberg-001',
        position: { x: 20, y: 0, z: -55 },
        size: 2.2,
        trajectory: [
          { time: 'NOW', position: { x: 20, y: 2, z: -55 } },
          { time: '+6H', position: { x: 17, y: 2, z: -48 } },
          { time: '+12H', position: { x: 14, y: 2, z: -42 } },
          { time: '+24H', position: { x: 9, y: 2, z: -34 } }
        ],
        risk_level: 'HIGH',
        confidence: 0.74,
        data_source: 'SIMULATED SCENARIO',
        timestamp: new Date().toISOString()
      },
      {
        iceberg_id: 'iceberg-002',
        position: { x: -85, y: 0, z: -125 },
        size: 1.8,
        trajectory: [
          { time: 'NOW', position: { x: -85, y: 2, z: -125 } },
          { time: '+6H', position: { x: -88, y: 2, z: -120 } },
          { time: '+12H', position: { x: -92, y: 2, z: -115 } },
          { time: '+24H', position: { x: -98, y: 2, z: -108 } }
        ],
        risk_level: 'LOW',
        confidence: 0.82,
        data_source: 'SIMULATED SCENARIO',
        timestamp: new Date().toISOString()
      }
    ];
  }

  getAll() {
    return this.icebergs;
  }
}

class RouteEngine {
  constructor() {
    this.routes = [
      {
        route_id: 'route-b',
        name: 'ROUTE B — RECOMMENDED',
        distance: 187,
        eta: '13h 42m',
        fuel: 42.1,
        risk_level: 'LOW',
        risk_score: 25,
        waypoints: [
          { x: 4.6, y: 2.6, z: 5 },
          { x: 4.6, y: 2.6, z: -8 },
          { x: -3.0, y: 2.6, z: -18 },
          { x: -10.0, y: 2.6, z: -32 },
          { x: -13.0, y: 2.6, z: -45 },
          { x: -6.0, y: 2.6, z: -58 },
          { x: 16.0, y: 2.6, z: -72 },
          { x: 42.0, y: 2.6, z: -85 }
        ],
        recommended: true
      },
      {
        route_id: 'route-a',
        name: 'ROUTE A',
        distance: 162,
        eta: '12h 15m',
        fuel: 38.4,
        risk_level: 'HIGH',
        risk_score: 78,
        waypoints: [
          { x: 4.6, y: 2.6, z: 5 },
          { x: 4.6, y: 2.6, z: -8 },
          { x: 5.0, y: 2.6, z: -18 },
          { x: 8.0, y: 2.6, z: -30 },
          { x: 15.0, y: 2.6, z: -45 },
          { x: 28.0, y: 2.6, z: -60 },
          { x: 42.0, y: 2.6, z: -75 },
          { x: 55.0, y: 2.6, z: -88 }
        ],
        recommended: false
      },
      {
        route_id: 'route-c',
        name: 'ROUTE C',
        distance: 205,
        eta: '15h 20m',
        fuel: 46.8,
        risk_level: 'MODERATE',
        risk_score: 45,
        waypoints: [
          { x: 4.6, y: 2.6, z: 5 },
          { x: 4.6, y: 2.6, z: -8 },
          { x: 8.0, y: 2.6, z: -20 },
          { x: 15.0, y: 2.6, z: -35 },
          { x: 25.0, y: 2.6, z: -50 },
          { x: 38.0, y: 2.6, z: -65 },
          { x: 52.0, y: 2.6, z: -80 },
          { x: 65.0, y: 2.6, z: -95 }
        ],
        recommended: false
      }
    ];
  }

  getAll() {
    return this.routes;
  }

  getRecommended() {
    return this.routes.find(r => r.recommended);
  }
}

class RiskEngine {
  assess() {
    return {
      risk_level: 'LOW',
      risk_score: 28,
      risk_factors: [
        { factor: 'Sea Ice Concentration', value: '42%', impact: 'moderate' },
        { factor: 'Iceberg Proximity', value: '7 detected', impact: 'moderate' },
        { factor: 'Predicted Trajectory Intersection', value: '1 intersection', impact: 'high' },
        { factor: 'Wind Conditions', value: '25 kts NW', impact: 'low' },
        { factor: 'Visibility', value: '3.2 km', impact: 'moderate' }
      ],
      assessment_method: 'POLARIS Prototype Risk Assessment',
      timestamp: new Date().toISOString()
    };
  }
}

class AlertEngine {
  generate() {
    return {
      alerts: [
        {
          alert_id: 'alert-001',
          severity: 'HIGH',
          type: 'ICEBERG INTERCEPTION',
          source: 'SIMULATED trajectory scenario',
          message: 'Scenario drift projection intersects Route A near the +12h waypoint',
          recommended_action: 'Use Route B, the low-risk recommended corridor',
          confidence: 0.74,
          timestamp: new Date().toISOString()
        },
        {
          alert_id: 'alert-002',
          severity: 'WARNING',
          type: 'SEA-ICE WARNING',
          source: 'PREDICTED persistence baseline',
          message: 'Sea-ice concentration forecast should be reviewed before route execution',
          recommended_action: 'Monitor sea-ice conditions',
          confidence: 0.82,
          timestamp: new Date().toISOString()
        },
        {
          alert_id: 'alert-003',
          severity: 'INFO',
          type: 'WEATHER ADVISORY',
          source: 'HISTORICAL ERA5 reanalysis context',
          message: 'Historical weather context indicates a possible higher-wind scenario',
          recommended_action: 'Treat as scenario context, not a live forecast',
          confidence: 0.68,
          timestamp: new Date().toISOString()
        }
      ],
      active_count: 3,
      iceberg_risks: 7,
      timestamp: new Date().toISOString()
    };
  }
}

// Initialize providers
const vesselProvider = new SimulatedVesselProvider();
const icebergProvider = new SimulatedIcebergProvider();
const routeEngine = new RouteEngine();
const riskEngine = new RiskEngine();
const alertEngine = new AlertEngine();

// API Routes

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

app.get('/api/seaice', (req, res) => {
  try {
    if (!fs.existsSync(SEA_ICE_CSV)) {
      return res.status(404).json({
        error: 'Sea ice data file not found',
        message: 'The prediction_latest.csv file is not available'
      });
    }

    const csvData = fs.readFileSync(SEA_ICE_CSV, 'utf-8');
    const lines = csvData.trim().split('\n');

    if (lines.length < 2) {
      return res.status(400).json({
        error: 'Invalid data format',
        message: 'CSV file is empty or invalid'
      });
    }

    const header = lines[0].split(',').map(col => col.trim());
    const colIndices = {
      predictionDate: header.indexOf('prediction_date'),
      basedOnDate: header.indexOf('based_on_date'),
      y: header.indexOf('y'),
      x: header.indexOf('x'),
      latitude: header.indexOf('latitude'),
      longitude: header.indexOf('longitude'),
      concentration: header.indexOf('predicted_seaice_conc'),
      method: header.indexOf('prediction_method'),
    };

    if (Object.values(colIndices).some(idx => idx === -1)) {
      return res.status(400).json({
        error: 'Missing required columns',
        message: 'CSV header missing required columns'
      });
    }

    const dataPoints = [];
    let predictionDate = '';
    let basedOnDate = '';
    let method = '';

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');

      if (cols.length < header.length) continue;

      const concentration = parseFloat(cols[colIndices.concentration]);

      if (isNaN(concentration) || concentration <= 0) continue;

      const x = parseFloat(cols[colIndices.x]);
      const y = parseFloat(cols[colIndices.y]);
      const latitude = parseFloat(cols[colIndices.latitude]);
      const longitude = parseFloat(cols[colIndices.longitude]);

      if (isNaN(x) || isNaN(y) || isNaN(latitude) || isNaN(longitude)) continue;

      if (!predictionDate) {
        predictionDate = cols[colIndices.predictionDate];
        basedOnDate = cols[colIndices.basedOnDate];
        method = cols[colIndices.method];
      }

      dataPoints.push({
        x,
        y,
        latitude,
        longitude,
        concentration
      });
    }

    res.json({
      predictionDate,
      basedOnDate,
      method,
      dataPoints,
      metadata: {
        totalCells: dataPoints.length,
        processedAt: new Date().toISOString(),
      dataSource: 'PREDICTED persistence output derived from the processed NSIDC grid'
      }
    });

  } catch (error) {
    console.error('Error loading sea ice data:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
});

app.get('/api/icebergs', (req, res) => {
  res.json({
    icebergs: icebergProvider.getAll(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/vessels', (req, res) => {
  res.json({
    vessels: vesselProvider.getAll(),
    dataSource: 'SIMULATED',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/vessels/:id', (req, res) => {
  const vessel = vesselProvider.getById(req.params.id);
  if (!vessel) {
    return res.status(404).json({ error: 'Vessel not found' });
  }
  res.json(vessel);
});

app.get('/api/routes', (req, res) => {
  res.json({
    routes: routeEngine.getAll(),
    recommended: routeEngine.getRecommended(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/risk', (req, res) => {
  res.json(riskEngine.assess());
});

app.get('/api/alerts', (req, res) => {
  res.json(alertEngine.generate());
});

app.get('/api/environment', (req, res) => {
  res.json({
    airTemp: -18,
    wind: { speed: 25, direction: 'NW' },
    visibility: 3.2,
    seaState: { level: 'Moderate', height: 2.1 },
    seaIceConcentration: 42,
    current: { speed: 0.8, direction: 'NE' },
    position: { latitude: -72.45, longitude: 18.24 },
    timestamp: new Date().toISOString(),
    dataFreshness: {
      seaIce: { status: 'PREDICTED (persistence)', date: '2026-08-20' },
      ocean: { status: 'HISTORICAL (Copernicus)', date: '2026-08-19' },
      weather: { status: 'HISTORICAL (ERA5 reanalysis)', date: '2026-08-19' },
      vesselTelemetry: { status: 'SIMULATED', date: 'Demo stream' }
    }
  });
});

app.get('/api/mission', (req, res) => {
  res.json({
    missionName: 'Antarctic Expedition 2026',
    vessel: 'RV POLAR EXPLORER',
    commander: 'Captain A. Sharma',
    status: 'OPERATIONAL',
    startDate: '2026-08-01',
    currentLocation: { latitude: -72.45, longitude: 18.24 },
    destination: { latitude: -75.0, longitude: 25.0 },
    objectives: [
      'Sea ice research and data collection',
      'Iceberg trajectory monitoring',
      'Navigation safety assessment'
    ],
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`POLARIS backend server running on http://localhost:${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});
