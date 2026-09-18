import { loadAlerts, loadRoutes, loadVessels, loadRiskAssessment, loadEnvironmentData } from '../utils/dataLoader';
import { useState, useEffect } from 'react';

interface ContextualPanelProps {
  activeView: string;
}

export function ContextualPanel({ activeView }: ContextualPanelProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        switch (activeView) {
          case 'ALERTS & WARNINGS':
            setData(await loadAlerts());
            break;
          case 'ROUTE PLANNER':
          case 'WHAT-IF SIMULATOR':
            setData(await loadRoutes());
            break;
          case 'VESSEL MANAGEMENT':
            setData(await loadVessels());
            break;
          case 'RISK ASSESSMENT':
            setData(await loadRiskAssessment());
            break;
          case 'WEATHER & OCEAN':
            setData(await loadEnvironmentData());
            break;
          default:
            setData(null);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeView]);

  if (loading) {
    return (
      <div style={{ padding: '20px', color: '#4dd4e8', fontSize: '12px' }}>
        Loading...
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '20px', color: 'rgba(216, 228, 240, 0.6)', fontSize: '12px' }}>
        Select a navigation item to view details
      </div>
    );
  }

  switch (activeView) {
    case 'ALERTS & WARNINGS':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ACTIVE ALERTS
          </div>
          {data.alerts?.map((alert: any, index: number) => (
            <div key={alert.alert_id || index} className={`alert-panel ${alert.severity === 'WARNING' ? 'warning' : ''}`} style={{ marginBottom: '8px' }}>
              <div className="alert-title">{alert.type}</div>
              <div className="alert-message">{alert.message}</div>
              <div style={{ marginTop: '8px', fontSize: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ opacity: 0.7 }}>Severity:</span>
                  <span style={{ fontWeight: '700', color: alert.severity === 'HIGH' ? '#ff4757' : alert.severity === 'WARNING' ? '#ffa502' : '#4dd4e8' }}>
                    {alert.severity}
                  </span>
                </div>
                {alert.confidence && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ opacity: 0.7 }}>Confidence:</span>
                    <span style={{ fontWeight: '700' }}>{(alert.confidence * 100).toFixed(0)}%</span>
                  </div>
                )}
                {alert.recommended_action && (
                  <div style={{ marginTop: '6px', fontSize: '9px', opacity: 0.8 }}>
                    Action: {alert.recommended_action}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      );

    case 'ROUTE PLANNER':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            AVAILABLE ROUTES
          </div>
          {data.routes?.map((route: any) => (
            <div key={route.route_id} className={`route-card ${route.recommended ? 'recommended' : ''}`} style={{ marginBottom: '8px' }}>
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
                <div>
                  <div className="metric-label">Risk Score</div>
                  <div className="metric-value">{route.risk_score}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'VESSEL MANAGEMENT':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            FLEET STATUS
          </div>
          <div style={{ fontSize: '9px', opacity: 0.6, marginBottom: '8px' }}>
            Data Source: {data.dataSource}
          </div>
          {data.vessels?.map((vessel: any) => (
            <div key={vessel.vessel_id} className="glass-card" style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#d8e4f0', marginBottom: '4px' }}>
                {vessel.name}
              </div>
              <div style={{ fontSize: '10px', opacity: 0.7, marginBottom: '8px' }}>
                {vessel.type}
              </div>
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">Speed</span>
                  <span className="metric-value">{vessel.speed} kts</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Heading</span>
                  <span className="metric-value">{vessel.heading}°</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Fuel</span>
                  <span className="metric-value">{vessel.fuel} t</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Status</span>
                  <span className="metric-value" style={{ color: '#26de81' }}>{vessel.status}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      );

    case 'RISK ASSESSMENT':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            RISK ANALYSIS
          </div>
          <div className="glass-card" style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>Overall Risk Level</span>
              <span className={`status-badge ${data.risk_level === 'LOW' ? 'status-success' : data.risk_level === 'HIGH' ? 'status-alert' : 'status-warning'}`}>
                {data.risk_level}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '10px', opacity: 0.7 }}>Risk Score</span>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#4dd4e8' }}>{data.risk_score}/100</span>
            </div>
          </div>

          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            RISK FACTORS
          </div>
          {data.risk_factors?.map((factor: any, index: number) => (
            <div key={index} className="glass-card" style={{ marginBottom: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', fontWeight: '700' }}>{factor.factor}</span>
                <span style={{ fontSize: '10px', opacity: 0.8 }}>{factor.value}</span>
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6 }}>
                Impact: {factor.impact}
              </div>
            </div>
          ))}

          <div style={{ marginTop: '12px', fontSize: '9px', opacity: 0.5, textAlign: 'center' }}>
            {data.assessment_method}
          </div>
        </div>
      );

    case 'WEATHER & OCEAN':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            ENVIRONMENTAL CONDITIONS
          </div>
          <div className="metric-grid">
            <div className="metric-item">
              <span className="metric-label">Air Temp</span>
              <span className="metric-value">{data.airTemp}°C</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Wind</span>
              <span className="metric-value">{data.wind?.speed} kts {data.wind?.direction}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Visibility</span>
              <span className="metric-value">{data.visibility} km</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Sea State</span>
              <span className="metric-value">{data.seaState?.level} {data.seaState?.height}m</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Current</span>
              <span className="metric-value">{data.current?.speed} m/s {data.current?.direction}</span>
            </div>
            <div className="metric-item">
              <span className="metric-label">Sea Ice</span>
              <span className="metric-value">{data.seaIceConcentration}%</span>
            </div>
          </div>

          <div style={{ marginTop: '12px' }}>
            <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              DATA FRESHNESS
            </div>
            {data.dataFreshness && Object.entries(data.dataFreshness).map(([key, value]: [string, any]) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '10px' }}>
                <span style={{ opacity: 0.7, textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}:</span>
                <span style={{ fontWeight: '700' }}>{value.status} ({value.date})</span>
              </div>
            ))}
          </div>
        </div>
      );

    case 'WHAT-IF SIMULATOR':
      return (
        <div style={{ padding: '12px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: '#4dd4e8', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            SCENARIO COMPARISON
          </div>

          <div className="glass-card" style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#4dd4e8', marginBottom: '8px' }}>
              CURRENT ROUTE
            </div>
            {data.recommended && (
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">ETA</span>
                  <span className="metric-value">{data.recommended.eta}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Fuel</span>
                  <span className="metric-value">{data.recommended.fuel} t</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{data.recommended.distance} nm</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Risk</span>
                  <span className="metric-value" style={{ color: data.recommended.risk_level === 'LOW' ? '#26de81' : '#ffa502' }}>
                    {data.recommended.risk_level}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card" style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#ffa502', marginBottom: '8px' }}>
              SIMULATED ALTERNATIVE
            </div>
            {data.routes?.[1] && (
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">ETA</span>
                  <span className="metric-value">{data.routes[1].eta}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Fuel</span>
                  <span className="metric-value">{data.routes[1].fuel} t</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Distance</span>
                  <span className="metric-value">{data.routes[1].distance} nm</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Risk</span>
                  <span className="metric-value" style={{ color: data.routes[1].risk_level === 'LOW' ? '#26de81' : '#ffa502' }}>
                    {data.routes[1].risk_level}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="glass-card">
            <div style={{ fontSize: '10px', fontWeight: '700', color: '#4dd4e8', marginBottom: '8px' }}>
              DIFFERENCE
            </div>
            {data.recommended && data.routes[1] && (
              <div className="metric-grid">
                <div className="metric-item">
                  <span className="metric-label">ETA Change</span>
                  <span className="metric-value" style={{ color: '#ffa502' }}>+{calculateTimeDifference(data.recommended.eta, data.routes[1].eta)}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Fuel Change</span>
                  <span className="metric-value" style={{ color: '#ffa502' }}>+{(data.routes[1].fuel - data.recommended.fuel).toFixed(1)} t</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Risk Change</span>
                  <span className="metric-value" style={{ color: '#26de81' }}>Reduced</span>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    default:
      return (
        <div style={{ padding: '20px', color: 'rgba(216, 228, 240, 0.6)', fontSize: '12px' }}>
          {activeView} - Content panel
        </div>
      );
  }
}

function calculateTimeDifference(current: string, simulated: string): string {
  // Simple time difference calculation
  const currentHours = parseInt(current);
  const simulatedHours = parseInt(simulated);
  const diff = Math.abs(simulatedHours - currentHours);
  return `${diff}h`;
}
