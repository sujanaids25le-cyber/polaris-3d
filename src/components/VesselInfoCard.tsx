interface VesselInfoCardProps {
  vessel: {
    name: string;
    type: string;
    fuel: string;
    length: string;
    beam: string;
    draft: string;
    speed: string;
    heading: string;
    cargo: string;
    crew: string;
  };
  position: { x: number; y: number };
  visible: boolean;
}

export function VesselInfoCard({ vessel, position, visible }: VesselInfoCardProps) {
  if (!visible) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: 'rgba(10, 16, 24, 0.95)',
        border: '1px solid rgba(77, 212, 232, 0.4)',
        borderRadius: '4px',
        padding: '12px',
        minWidth: '200px',
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: '700',
          color: '#4dd4e8',
          marginBottom: '4px',
          letterSpacing: '0.5px',
        }}
      >
        {vessel.name}
      </div>
      <div
        style={{
          fontSize: '10px',
          opacity: 0.7,
          marginBottom: '10px',
          fontWeight: '500',
        }}
      >
        {vessel.type}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '10px' }}>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Fuel</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.fuel}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Length</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.length}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Beam</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.beam}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Draft</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.draft}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Speed</div>
          <div style={{ fontWeight: '700', color: '#4dd4e8' }}>{vessel.speed}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Heading</div>
          <div style={{ fontWeight: '700', color: '#4dd4e8' }}>{vessel.heading}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Cargo</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.cargo}</div>
        </div>
        <div>
          <div style={{ opacity: 0.6, marginBottom: '2px' }}>Crew</div>
          <div style={{ fontWeight: '700', color: '#d8e4f0' }}>{vessel.crew}</div>
        </div>
      </div>

      <div
        style={{
          marginTop: '8px',
          fontSize: '8px',
          opacity: 0.5,
          textAlign: 'center',
          borderTop: '1px solid rgba(77, 212, 232, 0.2)',
          paddingTop: '6px',
        }}
      >
        SIMULATED / DEMONSTRATION TELEMETRY
      </div>
    </div>
  );
}
