type ScenarioStep = 'NOW' | '+6h' | '+12h' | '+18h' | '+24h';

interface TimelineProps {
  activeStep: ScenarioStep;
  onStepChange: (step: ScenarioStep) => void;
}

export function Timeline({ activeStep, onStepChange }: TimelineProps) {
  const markers: Array<'-12h' | '-6h' | ScenarioStep | '+18h'> = ['-12h', '-6h', 'NOW', '+6h', '+12h', '+18h', '+24h'];

  return (
    <div className="polaris-timeline">
      <div className="timeline-track">
        {markers.map((marker) => (
          <button
            key={marker}
            type="button"
            className={`timeline-marker ${marker === activeStep ? 'now' : ''}`}
            disabled={marker === '-12h' || marker === '-6h'}
            onClick={() => {
              if (marker === 'NOW' || marker === '+6h' || marker === '+12h' || marker === '+18h' || marker === '+24h') {
                onStepChange(marker);
              }
            }}
          >
            {marker}
          </button>
        ))}
      </div>
    </div>
  );
}
