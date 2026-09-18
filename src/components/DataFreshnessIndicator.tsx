import { useState, useEffect } from 'react';
import { loadEnvironmentData } from '../utils/dataLoader';

export function DataFreshnessIndicator() {
  const [environmentData, setEnvironmentData] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'degraded'>('online');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const loadData = async () => {
      try {
        const env = await loadEnvironmentData();
        setEnvironmentData(env);
        setConnectionStatus('online');
        setLastSync(new Date());
      } catch (error) {
        console.error('Connection error:', error);
        setConnectionStatus('degraded');
      }
    };

    loadData();

    // Simulate connection monitoring
    const interval = setInterval(() => {
      const now = new Date();
      const timeSinceSync = now.getTime() - lastSync.getTime();

      if (timeSinceSync > 30000) { // 30 seconds
        setConnectionStatus('offline');
      } else if (timeSinceSync > 10000) { // 10 seconds
        setConnectionStatus('degraded');
      } else {
        setConnectionStatus('online');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [lastSync]);

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'online': return '#26de81';
      case 'degraded': return '#ffa502';
      case 'offline': return '#ff4757';
      default: return '#4dd4e8';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'online': return 'CONNECTED';
      case 'degraded': return 'CONNECTION DEGRADED';
      case 'offline': return 'OFFLINE CACHE';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '160px',
      left: '145px',
      background: 'rgba(10, 16, 24, 0.9)',
      border: `1px solid ${getStatusColor()}`,
      borderRadius: '4px',
      padding: '8px 12px',
      fontSize: '10px',
      zIndex: 1000,
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: getStatusColor(),
          animation: connectionStatus === 'online' ? 'pulse 2s infinite' : 'none',
        }} />
        <div>
          <div style={{ fontWeight: '700', color: getStatusColor() }}>
            {getStatusText()}
          </div>
          <div style={{ opacity: 0.7, fontSize: '9px' }}>
            Last sync: {lastSync.toLocaleTimeString()}
          </div>
        </div>
      </div>

      {environmentData?.dataFreshness && (
        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(77, 212, 232, 0.2)' }}>
          <div style={{ fontSize: '9px', opacity: 0.7, marginBottom: '4px' }}>DATA SOURCES:</div>
          {Object.entries(environmentData.dataFreshness).slice(0, 2).map(([key, value]: [string, any]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', marginBottom: '2px' }}>
              <span style={{ opacity: 0.6 }}>{key}:</span>
              <span style={{ color: value.status === 'SIMULATED' ? '#ffa502' : '#26de81' }}>
                {value.status}
              </span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
