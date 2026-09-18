export interface SeaIceDataPoint {
  x: number;              // EPSG:3412 x coordinate (meters)
  y: number;              // EPSG:3412 y coordinate (meters)
  latitude: number;
  longitude: number;
  concentration: number;  // 0.0 to 1.0
}

export interface SeaIcePrediction {
  predictionDate: string;
  basedOnDate: string;
  method: string;
  dataPoints: SeaIceDataPoint[];
}

export interface LoadState {
  status: 'idle' | 'loading' | 'success' | 'error';
  data: SeaIcePrediction | null;
  error: string | null;
}

export interface DataBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  spanX: number;
  spanY: number;
}
