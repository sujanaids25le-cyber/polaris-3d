import { useState, useEffect } from 'react';
import { loadAlerts, loadRoutes } from '../utils/dataLoader';

export function StatusBar() {
  const [alertsData, setAlertsData] = useState<any>(null);
  const [routesData, setRoutesData] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      const alerts = await loadAlerts();
      const routes = await loadRoutes();

      setAlertsData(alerts);
      setRoutesData(routes);
    };

    loadData();
  }, []);

  return (
    <div className="polaris-statusbar">
      <div className="status-item">
        <div className="status-item-label">Active Alerts</div>
        <div className="status-item-value">{alertsData?.active_count ?? 3}</div>
      </div>
      <div className="status-item">
        <div className="status-item-label">Iceberg Risks</div>
        <div className="status-item-value">{alertsData?.iceberg_risks ?? 7}</div>
      </div>
      <div className="status-item">
        <div className="status-item-label">Route Safety</div>
        <div className="status-item-value" style={{ color: 'var(--polaris-success)' }}>LOW RISK</div>
      </div>
      <div className="status-item">
        <div className="status-item-label">ETA</div>
        <div className="status-item-value">{routesData?.recommended?.eta ?? '13h 42m'}</div>
      </div>
      <div className="status-item">
        <div className="status-item-label">Fuel</div>
        <div className="status-item-value">{routesData?.recommended?.fuel ?? '42.1 t'}</div>
      </div>
    </div>
  );
}
