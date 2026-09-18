import type { SeaIcePrediction } from '../types/seaice';

interface SeaIceMetadataProps {
  prediction: SeaIcePrediction | null;
  loading: boolean;
  error: string | null;
}

export function SeaIceMetadata({ prediction, loading, error }: SeaIceMetadataProps) {
  if (loading) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          color: '#ffffff',
          padding: '15px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          border: '1px solid rgba(255, 255, 255, 0.2)',
        }}
      >
        Loading sea-ice predictions...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: 'rgba(139, 38, 53, 0.8)',
          color: '#ffffff',
          padding: '15px 20px',
          borderRadius: '8px',
          fontFamily: 'monospace',
          fontSize: '14px',
          zIndex: 1000,
          border: '1px solid rgba(255, 100, 100, 0.5)',
        }}
      >
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          Failed to load predictions
        </div>
        <div style={{ fontSize: '12px', opacity: 0.9 }}>{error}</div>
      </div>
    );
  }

  if (!prediction) return null;

  const totalCells = prediction.dataPoints.length;
  const avgConcentration =
    totalCells > 0
      ? prediction.dataPoints.reduce((sum, p) => sum + p.concentration, 0) / totalCells
      : NaN;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        color: '#ffffff',
        padding: '15px 20px',
        borderRadius: '8px',
        fontFamily: 'monospace',
        fontSize: '13px',
        lineHeight: '1.6',
        zIndex: 1000,
        border: '1px solid rgba(255, 255, 255, 0.2)',
        minWidth: '320px',
      }}
    >
      <div
        style={{
          fontWeight: 'bold',
          fontSize: '14px',
          marginBottom: '10px',
          color: '#9ecbff',
          letterSpacing: '0.5px',
        }}
      >
        PREDICTED SEA-ICE CONCENTRATION
      </div>

      <div style={{ display: 'grid', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.8 }}>Prediction Date:</span>
          <span style={{ fontWeight: 'bold' }}>{prediction.predictionDate}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.8 }}>Based On:</span>
          <span style={{ fontWeight: 'bold' }}>{prediction.basedOnDate}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.8 }}>Method:</span>
          <span style={{ fontWeight: 'bold' }}>{prediction.method}</span>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '8px 0',
          }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.8 }}>Cells with Ice:</span>
          <span style={{ fontWeight: 'bold' }}>{totalCells.toLocaleString()}</span>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ opacity: 0.8 }}>Avg Concentration:</span>
          <span style={{ fontWeight: 'bold' }}>
            {isNaN(avgConcentration) ? 'N/A' : `${(avgConcentration * 100).toFixed(1)}%`}
          </span>
        </div>

        <div
          style={{
            height: '1px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            margin: '8px 0',
          }}
        />

        <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '4px' }}>
          Data Source: NSIDC + Copernicus + ERA5
        </div>
        <div style={{ fontSize: '9px', opacity: 0.5 }}>
          Processed: {new Date().toISOString().split('T')[0]}
        </div>
      </div>
    </div>
  );
}
