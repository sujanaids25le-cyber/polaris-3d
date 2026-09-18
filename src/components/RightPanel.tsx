import type { SeaIcePrediction } from '../types/seaice';
import { useState, useEffect } from 'react';
import { loadEnvironmentData, loadAlerts, loadRoutes } from '../utils/dataLoader';

interface RightPanelProps {
  seaIcePrediction: SeaIcePrediction | null;
  selectedRoute: string;
  onSelectRoute: (routeId: string) => void;
}

export function RightPanel({ seaIcePrediction, selectedRoute, onSelectRoute }: RightPanelProps) {
  const [environmentData, setEnvironmentData] = useState<any>(null);
  const [alertsData, setAlertsData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any>(null);

  const concentrations = (seaIcePrediction?.dataPoints ?? [])
    .map((point) => Number(point.concentration))
    .filter((concentration) => Number.isFinite(concentration));
  const avgConcentration = concentrations.length > 0
    ? concentrations.reduce((sum, concentration) => sum + concentration, 0) / concentrations.length
    : null;

  useEffect(() => {
    const loadData = async () => {
      const env = await loadEnvironmentData();
      const alerts = await loadAlerts();
      const routes = await loadRoutes();

      setEnvironmentData(env);
      setAlertsData(alerts);
      setRoutesData(routes);
    };

    loadData();
  }, []);

  return (
    <div className="polaris-rightpanel">
      {/* Environmental Snapshot */}
      <div className="glass-card">
        <div className="card-title">ENVIRONMENTAL SNAPSHOT</div>
        <div className="metric-grid">
          <div className="metric-item">
            <span className="metric-label">Air Temp</span>
            <span className="metric-value">{environmentData?.airTemp ?? -18}°C</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Wind</span>
            <span className="metric-value">{environmentData?.wind?.speed ?? 25} kts {environmentData?.wind?.direction ?? 'NW'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Visibility</span>
            <span className="metric-value">{environmentData?.visibility ?? 3.2} km</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Sea State</span>
            <span className="metric-value">{environmentData?.seaState?.level ?? 'Moderate'} {environmentData?.seaState?.height ?? 2.1}m</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Sea Ice</span>
            <span className="metric-value">{avgConcentration === null ? '—' : `${(avgConcentration * 100).toFixed(0)}%`}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Current</span>
            <span className="metric-value">{environmentData?.current?.speed ?? 0.8} m/s</span>
          </div>
        </div>
        <div style={{
          marginTop: '10px',
          fontSize: '10px',
          color: '#4dd4e8',
          cursor: 'pointer',
          opacity: 0.8,
          textDecoration: 'underline'
        }}>
          View Full Forecast →
        </div>
      </div>

      {/* Predictive Alerts */}
      {alertsData?.alerts?.slice(0, 2).map((alert: any, index: number) => (
        <div key={alert.alert_id || index} className={`alert-panel ${alert.severity === 'WARNING' ? 'warning' : ''}`}>
          <div className="alert-title">PREDICTIVE ALERT</div>
          <div className="alert-message" style={{ fontWeight: '700', marginBottom: '4px' }}>
            {alert.type}
          </div>
          <div className="alert-message" style={{ fontSize: '10px', opacity: 0.9 }}>
            {alert.message}
          </div>
          {alert.confidence && (
            <div style={{ marginTop: '8px', fontSize: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ opacity: 0.7 }}>Confidence:</span>
                <span style={{ color: '#ffa502', fontWeight: '700' }}>{(alert.confidence * 100).toFixed(0)}%</span>
              </div>
              {alert.recommended_action && (
                <div style={{ marginTop: '6px', fontSize: '9px', opacity: 0.8 }}>
                  Recommended action: {alert.recommended_action}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Recommended Routes */}
      <div className="glass-card">
        <div className="card-title">ROUTE OPTIONS</div>

        {routesData?.routes?.map((route: any) => (
          <button
            key={route.route_id}
            type="button"
            onClick={() => onSelectRoute(route.route_id)}
            className={`route-card ${route.recommended ? 'recommended' : ''} ${selectedRoute === route.route_id ? 'selected' : ''}`}
          >
            <div className="route-header">
              <span className="route-name">{route.name}</span>
              <span className={`status-badge ${route.risk_level === 'LOW' ? 'status-success' : route.risk_level === 'HIGH' ? 'status-alert' : 'status-warning'}`} style={{ fontSize: '10px' }}>
                {route.risk_level} RISK
              </span>
            </div>
            <div className="route-metrics">
              <div>
                <div className="metric-label">Distance</div>
                <div className="metric-value">{route.distance} nm</div>
              </div>
              <div>
                <div className="metric-label">ETA</div>
                <div className="metric-value">{route.eta}</div>
              </div>
              <div>
                <div className="metric-label">Est. Fuel</div>
                <div className="metric-value">{route.fuel} t</div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Quick Status */}
      <div className="glass-card">
        <div className="card-title">QUICK STATUS</div>
        <div className="metric-grid">
          <div className="metric-item">
            <span className="metric-label">Active Alerts</span>
            <span className="metric-value">{alertsData?.active_count ?? 3}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Iceberg Risks</span>
            <span className="metric-value">{alertsData?.iceberg_risks ?? 7}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Route Safety</span>
            <span className="metric-value" style={{ color: selectedRoute === 'route-a' ? 'var(--polaris-alert)' : selectedRoute === 'route-c' ? 'var(--polaris-warning)' : 'var(--polaris-success)' }}>
              {selectedRoute === 'route-a' ? 'HIGH RISK' : selectedRoute === 'route-c' ? 'MODERATE' : 'LOW RISK'}
            </span>
          </div>
          <div className="metric-item">
            <span className="metric-label">ETA</span>
            <span className="metric-value">{routesData?.recommended?.eta ?? '13h 42m'}</span>
          </div>
          <div className="metric-item">
            <span className="metric-label">Fuel</span>
            <span className="metric-value">{routesData?.recommended?.fuel ?? '42.1 t'}</span>
          </div>
        </div>
      </div>

      {/* Sea Ice Prediction Metadata */}
      {seaIcePrediction && (
        <div className="glass-card">
          <div className="card-title">SEA-ICE PREDICTION</div>
          <div style={{ fontSize: '10px', display: 'grid', gap: '6px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Prediction Date:</span>
              <span>{seaIcePrediction.predictionDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Based On:</span>
              <span>{seaIcePrediction.basedOnDate}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Method:</span>
              <span>{seaIcePrediction.method}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Cells with Ice:</span>
              <span>{seaIcePrediction.dataPoints.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ opacity: 0.7 }}>Avg Concentration:</span>
              <span>{avgConcentration === null ? '—' : `${(avgConcentration * 100).toFixed(1)}%`}</span>
            </div>
            <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(77, 212, 232, 0.1)', fontSize: '9px' }}>
              <div style={{ opacity: 0.7, marginBottom: '4px' }}>Data Source:</div>
              <div>PREDICTED · persistence baseline · NSIDC grid</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
