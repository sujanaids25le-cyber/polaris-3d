import { useState, useEffect } from 'react';
import { loadEnvironmentData, loadMissionData } from '../utils/dataLoader';

export function TopBar() {
  const [environmentData, setEnvironmentData] = useState<any>(null);
  const [missionData, setMissionData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const loadData = async () => {
      const env = await loadEnvironmentData();
      const mission = await loadMissionData();

      setEnvironmentData(env);
      setMissionData(mission);
    };

    loadData();

    // Update time every second
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toUTCString().split(' ')[4] + ' UTC');
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  const seaIcePercent = environmentData?.seaIceConcentration ?? 42;
  const windSpeed = environmentData?.wind?.speed ?? 25;
  const windDir = environmentData?.wind?.direction ?? 'NW';
  const position = environmentData?.position ?? { latitude: -72.45, longitude: 18.24 };

  return (
    <div className="polaris-topbar">
      <div className="topbar-section">
        <div className="topbar-item">
          <span className="topbar-label">MISSION</span>
          <span className="topbar-value">{missionData?.missionName ?? 'Antarctic Expedition 2026'}</span>
        </div>
        <div className="topbar-item">
          <span className="topbar-label">TIME</span>
          <span className="topbar-value">{currentTime}</span>
        </div>
        <div className="topbar-item">
          <span className="topbar-label">LOCATION</span>
          <span className="topbar-value">{Math.abs(position.latitude).toFixed(2)}° {position.latitude >= 0 ? 'N' : 'S'}, {Math.abs(position.longitude).toFixed(2)}° {position.longitude >= 0 ? 'E' : 'W'}</span>
        </div>
        <div className="topbar-item">
          <span className="topbar-label">ENVIRONMENT</span>
          <span className="topbar-value">Sea Ice: {seaIcePercent}% | Wind: {windSpeed} kts {windDir}</span>
        </div>
      </div>

      <div className="topbar-section">
        <div className="topbar-item">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #4dd4e8, #1a3a52)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: '700',
              color: '#fff'
            }}>
              CA
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#d8e4f0' }}>
                {missionData?.commander ?? 'Captain A. Sharma'}
              </div>
              <div style={{ fontSize: '9px', opacity: 0.6, color: '#4dd4e8' }}>
                Polar Explorer
              </div>
            </div>
          </div>
        </div>
        <div className="topbar-item">
          <span style={{
            fontSize: '12px',
            cursor: 'pointer',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: '1px solid rgba(77, 212, 232, 0.3)',
            borderRadius: '3px',
            color: '#4dd4e8'
          }}>
            ▲
          </span>
        </div>
        <div className="topbar-item">
          <span style={{
            fontSize: '12px',
            cursor: 'pointer',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            border: '1px solid rgba(77, 212, 232, 0.3)',
            borderRadius: '3px',
            color: '#4dd4e8'
          }}>
            ≡
          </span>
        </div>
      </div>
    </div>
  );
}
