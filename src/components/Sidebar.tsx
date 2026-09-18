interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const navItems = [
    { label: 'OVERVIEW', sub: 'Mission Command' },
    { label: 'LIVE NAVIGATION', sub: 'Real-time Tracking' },
    { label: 'ROUTE PLANNER', sub: 'Optimize Your Route' },
    { label: 'ICEBERG TRACKER', sub: 'Predict & Monitor' },
    { label: 'SEA ICE INTELLIGENCE', sub: 'Maps & Forecasts' },
    { label: 'WEATHER & OCEAN', sub: 'Conditions & Forecast' },
    { label: 'RISK ASSESSMENT', sub: 'Hazards & Exposure' },
    { label: 'WHAT-IF SIMULATOR', sub: 'Scenario Analysis' },
    { label: 'ALERTS & WARNINGS', sub: 'Predictive Alerts' },
    { label: 'VESSEL MANAGEMENT', sub: 'Fleet & Vessel Info' },
    { label: 'REPORTS & ANALYTICS', sub: 'Insights & History' },
    { label: 'SETTINGS', sub: 'System Configuration' },
  ];

  return (
    <div className="polaris-sidebar">
      <div className="polaris-logo">POLARIS</div>
      <div className="polaris-tagline">PREDICTIVE POLAR NAVIGATION</div>

      <div style={{ marginTop: '16px' }}>
        {navItems.map((item) => (
          <div
            key={item.label}
            className={`nav-item ${activeItem === item.label ? 'active' : ''}`}
            onClick={() => onItemClick(item.label)}
          >
            <div style={{ fontWeight: '700', fontSize: '11px', letterSpacing: '0.5px' }}>
              {item.label}
            </div>
            <div style={{ fontSize: '9px', opacity: 0.6, marginTop: '1px' }}>
              {item.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
