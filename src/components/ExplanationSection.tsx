export function ExplanationSection() {
  return (
    <div className="polaris-explanation">
      <div className="explanation-left">
        <div className="explanation-title">HOW THE DASHBOARD WORKS</div>
        <div className="explanation-subtitle">Contextual. Focused. Responsive.</div>

        <div className="explanation-cards">
          <div className="explanation-card">
            <div className="explanation-card-number">1</div>
            <div className="explanation-card-title">OVERVIEW (DEFAULT)</div>
            <div className="explanation-card-text">Clean, immersive view of the mission with key information always visible.</div>
          </div>

          <div className="explanation-card">
            <div className="explanation-card-number">2</div>
            <div className="explanation-card-title">CLICK ON ICEBERG TRACKER</div>
            <div className="explanation-card-text">Keep tracking for information about iceberg trajectories and risk.</div>
          </div>

          <div className="explanation-card">
            <div className="explanation-card-number">3</div>
            <div className="explanation-card-title">CLICK ON WHAT-IF SIMULATOR</div>
            <div className="explanation-card-text">Simulate different route scenarios and compare ETA, fuel, and risk.</div>
          </div>

          <div className="explanation-card">
            <div className="explanation-card-number">4</div>
            <div className="explanation-card-title">CLICK ON VESSEL MANAGEMENT</div>
            <div className="explanation-card-text">Select vessels and inspect detailed vessel information.</div>
          </div>
        </div>
      </div>

      <div className="explanation-right">
        <div className="explanation-title">WHAT THIS IMPROVES</div>
        <div className="improvement-list">
          <div className="improvement-item">
            <div className="improvement-bullet"></div>
            <span>Focus when needed — Details only when they matter.</span>
          </div>
          <div className="improvement-item">
            <div className="improvement-bullet"></div>
            <span>More map space — Maximum real estate for navigation.</span>
          </div>
          <div className="improvement-item">
            <div className="improvement-bullet"></div>
            <span>Less clutter — Cleaner interface, less cognitive load.</span>
          </div>
          <div className="improvement-item">
            <div className="improvement-bullet"></div>
            <span>Contextual actions — Panel gives tools relevant to the task.</span>
          </div>
          <div className="improvement-item">
            <div className="improvement-bullet"></div>
            <span>Immersive experience — Feels like mission control, not a data table.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
