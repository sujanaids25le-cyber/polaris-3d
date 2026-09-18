import type { SeaIcePrediction, SeaIceDataPoint } from '../types/seaice';

const API_BASE_URL = 'http://localhost:3001/api';

export async function loadSeaIcePrediction(): Promise<SeaIcePrediction> {
  try {
    const response = await fetch(`${API_BASE_URL}/seaice`);

    if (!response.ok) {
      throw new Error(`Failed to load sea-ice data: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      predictionDate: data.predictionDate,
      basedOnDate: data.basedOnDate,
      method: data.method,
      dataPoints: data.dataPoints.map((point: any) => ({
        x: point.x,
        y: point.y,
        latitude: point.latitude,
        longitude: point.longitude,
        concentration: point.concentration,
      })),
    };
  } catch (error) {
    console.error('Error loading sea-ice prediction from API:', error);
    // Fallback to direct CSV loading if API fails
    return loadSeaIcePredictionFromCSV();
  }
}

async function loadSeaIcePredictionFromCSV(): Promise<SeaIcePrediction> {
  const response = await fetch('/data/processed/predictions/prediction_latest.csv');

  if (!response.ok) {
    throw new Error(`Failed to load sea-ice data: ${response.statusText}`);
  }

  const csvText = await response.text();
  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    throw new Error('CSV file is empty or invalid');
  }

  // Parse header
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

  // Validate header
  if (Object.values(colIndices).some(idx => idx === -1)) {
    throw new Error('CSV header missing required columns');
  }

  const dataPoints: SeaIceDataPoint[] = [];
  let predictionDate = '';
  let basedOnDate = '';
  let method = '';

  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');

    if (cols.length < header.length) continue;

    const concentration = parseFloat(cols[colIndices.concentration]);

    // Filter: only include valid, non-zero concentration cells
    if (isNaN(concentration) || concentration <= 0) continue;

    const x = parseFloat(cols[colIndices.x]);
    const y = parseFloat(cols[colIndices.y]);
    const latitude = parseFloat(cols[colIndices.latitude]);
    const longitude = parseFloat(cols[colIndices.longitude]);

    // Skip if any coordinate is invalid
    if (isNaN(x) || isNaN(y) || isNaN(latitude) || isNaN(longitude)) continue;

    // Extract metadata from first valid row
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
      concentration,
    });
  }

  console.log(`Loaded ${dataPoints.length} non-zero sea-ice cells from CSV`);

  return {
    predictionDate,
    basedOnDate,
    method,
    dataPoints,
  };
}

export async function loadEnvironmentData() {
  try {
    const response = await fetch(`${API_BASE_URL}/environment`);
    if (!response.ok) {
      throw new Error(`Failed to load environment data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading environment data:', error);
    return null;
  }
}

export async function loadAlerts() {
  try {
    const response = await fetch(`${API_BASE_URL}/alerts`);
    if (!response.ok) {
      throw new Error(`Failed to load alerts: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading alerts:', error);
    return null;
  }
}

export async function loadRoutes() {
  try {
    const response = await fetch(`${API_BASE_URL}/routes`);
    if (!response.ok) {
      throw new Error(`Failed to load routes: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading routes:', error);
    return null;
  }
}

export async function loadVessels() {
  try {
    const response = await fetch(`${API_BASE_URL}/vessels`);
    if (!response.ok) {
      throw new Error(`Failed to load vessels: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading vessels:', error);
    return null;
  }
}

export async function loadRiskAssessment() {
  try {
    const response = await fetch(`${API_BASE_URL}/risk`);
    if (!response.ok) {
      throw new Error(`Failed to load risk assessment: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading risk assessment:', error);
    return null;
  }
}

export async function loadMissionData() {
  try {
    const response = await fetch(`${API_BASE_URL}/mission`);
    if (!response.ok) {
      throw new Error(`Failed to load mission data: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error loading mission data:', error);
    return null;
  }
}
