import { useState, useEffect } from 'react';

export function ConnectionStatus() {
  const [status, setStatus] = useState<'online' | 'degraded' | 'offline'>('online');
  const [lastSync, setLastSync] = useState<Date>(new Date());

  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/health', { 
          signal: AbortSignal.timeout(3000)
        });
        if (response.ok) {
          setStatus('online');
          setLastSync(new Date());
        } else {
          setStatus('degraded');
        }
      } catch {
        setStatus('degraded');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 15000);
    return () => clearInterval(interval);
  }, []);

  const statusText = status === 'online' ? 'LOCAL API READY' : 
                     status === 'degraded' ? 'LOCAL API UNAVAILABLE' : 
                     'OFFLINE CACHE';

  const syncTime = lastSync.toLocaleTimeString('en-US', { 
    hour12: true,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <div className="polaris-connection-status">
      <div className="connection-indicator">
        <div className={`connection-status-dot ${status}`}></div>
        <div className={`connection-status-text ${status}`}>
          {statusText}
        </div>
        <div className="connection-sync-time">
          Last sync: {syncTime}
        </div>
      </div>

      <div className="connection-sources">
        <div className="connection-source">
          <span>Sea Ice:</span>
          <span className="connection-source-status processed">PREDICTED</span>
        </div>
        <div className="connection-source">
          <span>Ocean:</span>
          <span className="connection-source-status processed">HISTORICAL</span>
        </div>
        <div className="connection-source">
          <span>Vessels:</span>
          <span className="connection-source-status simulated">Simulated</span>
        </div>
      </div>
    </div>
  );
}
