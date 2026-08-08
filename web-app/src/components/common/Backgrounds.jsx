import React from 'react';

export const HeroBackground = ({ role = 'passenger' }) => {
  const themes = {
    passenger: { gradient: ['#2563eb', '#1e40af', '#1e3a5f'], accent: '#3b82f6', accentLight: '#93c5fd' },
    driver: { gradient: ['#059669', '#047857', '#064e3b'], accent: '#10b981', accentLight: '#6ee7b7' },
    admin: { gradient: ['#7c3aed', '#6d28d9', '#4c1d95'], accent: '#8b5cf6', accentLight: '#c4b5fd' },
  };
  const t = themes[role];

  return (
    <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <defs>
        <linearGradient id={`grad-${role}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={t.gradient[0]} />
          <stop offset="50%" stopColor={t.gradient[1]} />
          <stop offset="100%" stopColor={t.gradient[2]} />
        </linearGradient>
        <pattern id={`grid-${role}`} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1"/>
        </pattern>
      </defs>
      <rect width="800" height="600" fill={`url(#grad-${role})`}/>
      <rect width="800" height="600" fill={`url(#grid-${role})`}/>

      {/* Decorative circles */}
      <circle cx="680" cy="80" r="220" fill="rgba(255,255,255,0.03)"/>
      <circle cx="80" cy="520" r="180" fill="rgba(255,255,255,0.03)"/>
      <circle cx="400" cy="300" r="320" fill="rgba(255,255,255,0.02)"/>

      {/* Road network */}
      <g opacity="0.12">
        <path d="M0 380 Q200 360 400 380 Q600 400 800 380" stroke="white" strokeWidth="3" fill="none"/>
        <path d="M0 390 Q200 370 400 390 Q600 410 800 390" stroke="white" strokeWidth="1" fill="none" strokeDasharray="12,8"/>
        <path d="M0 400 Q200 380 400 400 Q600 420 800 400" stroke="white" strokeWidth="3" fill="none"/>
        <line x1="200" y1="200" x2="200" y2="500" stroke="white" strokeWidth="1.5" strokeDasharray="8,6"/>
        <line x1="400" y1="180" x2="400" y2="520" stroke="white" strokeWidth="1.5" strokeDasharray="8,6"/>
        <line x1="600" y1="220" x2="600" y2="500" stroke="white" strokeWidth="1.5" strokeDasharray="8,6"/>
      </g>

      {/* City buildings - left side */}
      <g transform="translate(30, 220)" opacity="0.1">
        <rect x="0" y="100" width="35" height="100" rx="3" fill="white"/>
        <rect x="40" y="60" width="30" height="140" rx="3" fill="white"/>
        <rect x="75" y="80" width="40" height="120" rx="3" fill="white"/>
        <rect x="120" y="40" width="28" height="160" rx="3" fill="white"/>
        <rect x="155" y="90" width="35" height="110" rx="3" fill="white"/>
        {/* Windows */}
        {[85, 100, 115, 130].map((y, i) => (
          <React.Fragment key={`bl-${i}`}>
            <rect x="8" y={y} width="5" height="6" rx="1" fill="white" opacity="0.6"/>
            <rect x="16" y={y} width="5" height="6" rx="1" fill="white" opacity="0.6"/>
            <rect x="24" y={y} width="5" height="6" rx="1" fill="white" opacity="0.6"/>
          </React.Fragment>
        ))}
      </g>

      {/* City buildings - right side */}
      <g transform="translate(540, 200)" opacity="0.1">
        <rect x="0" y="120" width="30" height="80" rx="3" fill="white"/>
        <rect x="35" y="70" width="38" height="130" rx="3" fill="white"/>
        <rect x="78" y="50" width="32" height="150" rx="3" fill="white"/>
        <rect x="115" y="90" width="40" height="110" rx="3" fill="white"/>
        <rect x="160" y="60" width="28" height="140" rx="3" fill="white"/>
        <rect x="193" y="100" width="35" height="100" rx="3" fill="white"/>
        {/* Antenna */}
        <line x1="94" y1="50" x2="94" y2="30" stroke="white" strokeWidth="1.5"/>
        <circle cx="94" cy="28" r="3" fill="white" opacity="0.5"/>
      </g>

      {/* Ride-sharing car */}
      <CarIllustration x={300} y={280} color={t.accent} accentLight={t.accentLight} />

      {/* Map pin - pickup */}
      <g transform="translate(160, 310)">
        <path d="M16 0C8.94 0 3 5.94 3 13c0 10 13 24 13 24s13-14 13-24C29 5.94 23.06 0 16 0z" fill={t.accent} opacity="0.8"/>
        <circle cx="16" cy="11" r="5" fill="white"/>
      </g>

      {/* Map pin - dropoff */}
      <g transform="translate(560, 300)">
        <path d="M16 0C8.94 0 3 5.94 3 13c0 10 13 24 13 24s13-14 13-24C29 5.94 23.06 0 16 0z" fill="#ef4444" opacity="0.8"/>
        <circle cx="16" cy="11" r="5" fill="white"/>
      </g>

      {/* Dotted route line between pins */}
      <path d="M176 324 Q300 280 400 310 Q500 340 576 314" stroke="white" strokeWidth="2.5" strokeDasharray="8,6" fill="none" opacity="0.3"/>

      {/* Signal waves from car */}
      <g transform="translate(400, 270)" opacity="0.15">
        <circle cx="0" cy="0" r="20" stroke={t.accent} strokeWidth="1.5" fill="none"/>
        <circle cx="0" cy="0" r="35" stroke={t.accent} strokeWidth="1" fill="none" strokeDasharray="4,4"/>
        <circle cx="0" cy="0" r="50" stroke={t.accent} strokeWidth="0.8" fill="none" strokeDasharray="4,4"/>
      </g>
    </svg>
  );
};

const CarIllustration = ({ x, y, color, accentLight }) => (
  <g transform={`translate(${x}, ${y})`} opacity="0.2">
    {/* Car body */}
    <rect x="25" y="45" width="150" height="45" rx="12" fill="white"/>
    <rect x="5" y="60" width="190" height="30" rx="8" fill="white"/>
    {/* Windows */}
    <rect x="15" y="35" width="45" height="28" rx="6" fill="rgba(255,255,255,0.7)"/>
    <rect x="65" y="28" width="85" height="32" rx="6" fill="rgba(255,255,255,0.7)"/>
    <rect x="155" y="35" width="30" height="28" rx="6" fill="rgba(255,255,255,0.7)"/>
    {/* Wheels */}
    <circle cx="55" cy="90" r="14" fill="white"/>
    <circle cx="155" cy="90" r="14" fill="white"/>
    <circle cx="55" cy="90" r="7" fill="rgba(255,255,255,0.5)"/>
    <circle cx="155" cy="90" r="7" fill="rgba(255,255,255,0.5)"/>
    {/* Headlight */}
    <rect x="192" y="65" width="8" height="10" rx="3" fill={color || 'white'} opacity="0.8"/>
    {/* Tail light */}
    <rect x="0" y="65" width="6" height="10" rx="3" fill="#ef4444" opacity="0.6"/>
    {/* Roof rack / taxi sign */}
    <rect x="75" y="22" width="55" height="12" rx="6" fill={color || 'white'} opacity="0.6"/>
    <text x="102" y="32" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold" opacity="0.8">DIRS</text>
  </g>
);

export const AuthBackground = () => (
  <svg viewBox="0 0 1000 800" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
    <defs>
      <linearGradient id="auth-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563eb"/>
        <stop offset="40%" stopColor="#1e40af"/>
        <stop offset="100%" stopColor="#1e3a5f"/>
      </linearGradient>
      <pattern id="auth-dots" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.08)"/>
      </pattern>
    </defs>
    <rect width="1000" height="800" fill="url(#auth-grad)"/>
    <rect width="1000" height="800" fill="url(#auth-dots)"/>

    {/* Large decorative circles */}
    <circle cx="750" cy="150" r="250" fill="rgba(255,255,255,0.04)"/>
    <circle cx="200" cy="600" r="200" fill="rgba(255,255,255,0.03)"/>
    <circle cx="500" cy="400" r="350" fill="rgba(255,255,255,0.02)"/>

    <CitySkyline />
    <MapPins />
    <RoadNetwork />
    <RideShareCar />
  </svg>
);

const CitySkyline = () => (
  <g transform="translate(40, 330)" opacity="0.12">
    <rect x="0" y="80" width="45" height="120" rx="4" fill="white"/>
    <rect x="50" y="35" width="38" height="165" rx="4" fill="white"/>
    <rect x="93" y="55" width="50" height="145" rx="4" fill="white"/>
    <rect x="148" y="15" width="32" height="185" rx="4" fill="white"/>
    <rect x="185" y="65" width="55" height="135" rx="4" fill="white"/>
    <rect x="245" y="45" width="38" height="155" rx="4" fill="white"/>
    <rect x="288" y="85" width="42" height="115" rx="4" fill="white"/>
    <rect x="335" y="25" width="30" height="175" rx="4" fill="white"/>
    <rect x="370" y="55" width="48" height="145" rx="4" fill="white"/>
    <rect x="423" y="75" width="38" height="125" rx="4" fill="white"/>
    <rect x="466" y="40" width="35" height="160" rx="4" fill="white"/>
    <rect x="506" y="70" width="45" height="130" rx="4" fill="white"/>
    {/* Windows on buildings */}
    {[70, 100, 130, 160, 190].map((y, i) => (
      <React.Fragment key={`w-${i}`}>
        <rect x="10" y={y} width="6" height="8" rx="1" fill="white" opacity="0.5"/>
        <rect x="20" y={y} width="6" height="8" rx="1" fill="white" opacity="0.5"/>
        <rect x="30" y={y} width="6" height="8" rx="1" fill="white" opacity="0.5"/>
      </React.Fragment>
    ))}
    {[55, 85, 115, 145, 175].map((y, i) => (
      <React.Fragment key={`w2-${i}`}>
        <rect x="60" y={y} width="6" height="8" rx="1" fill="white" opacity="0.5"/>
        <rect x="70" y={y} width="6" height="8" rx="1" fill="white" opacity="0.5"/>
      </React.Fragment>
    ))}
    {/* Antenna on tallest building */}
    <line x1="164" y1="15" x2="164" y2="-5" stroke="white" strokeWidth="1.5"/>
    <circle cx="164" cy="-7" r="2.5" fill="white" opacity="0.6"/>
  </g>
);

const MapPins = () => (
  <g>
    <g transform="translate(580, 250)">
      <path d="M20 0C11.16 0 4 7.16 4 16c0 12 16 28 16 28s16-16 16-28C36 7.16 28.84 0 20 0z" fill="#22c55e" opacity="0.7"/>
      <circle cx="20" cy="14" r="6" fill="white"/>
      <text x="20" y="17" textAnchor="middle" fill="#22c55e" fontSize="7" fontWeight="bold">A</text>
    </g>
    <g transform="translate(720, 180)">
      <path d="M20 0C11.16 0 4 7.16 4 16c0 12 16 28 16 28s16-16 16-28C36 7.16 28.84 0 20 0z" fill="#ef4444" opacity="0.7"/>
      <circle cx="20" cy="14" r="6" fill="white"/>
      <text x="20" y="17" textAnchor="middle" fill="#ef4444" fontSize="7" fontWeight="bold">B</text>
    </g>
    {/* Dashed route */}
    <path d="M600 280 Q660 230 720 208" stroke="rgba(255,255,255,0.25)" strokeWidth="2" strokeDasharray="8,6"/>
  </g>
);

const RoadNetwork = () => (
  <g opacity="0.08">
    <path d="M0 500 Q250 480 500 500 Q750 520 1000 500" stroke="white" strokeWidth="4" fill="none"/>
    <path d="M0 510 Q250 490 500 510 Q750 530 1000 510" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="15,10"/>
    <line x1="250" y1="300" x2="250" y2="600" stroke="white" strokeWidth="2" strokeDasharray="10,8"/>
    <line x1="500" y1="280" x2="500" y2="620" stroke="white" strokeWidth="2" strokeDasharray="10,8"/>
    <line x1="750" y1="320" x2="750" y2="600" stroke="white" strokeWidth="2" strokeDasharray="10,8"/>
  </g>
);

const RideShareCar = () => (
  <g transform="translate(420, 380)" opacity="0.1">
    <rect x="0" y="10" width="80" height="25" rx="8" fill="white"/>
    <rect x="-10" y="18" width="100" height="17" rx="5" fill="white"/>
    <rect x="5" y="2" width="25" height="15" rx="3" fill="rgba(255,255,255,0.7)"/>
    <rect x="35" y="-2" width="40" height="18" rx="3" fill="rgba(255,255,255,0.7)"/>
    <circle cx="15" cy="35" r="7" fill="white"/>
    <circle cx="75" cy="35" r="7" fill="white"/>
  </g>
);

export const EmptyStateIllustration = ({ type = 'rides' }) => {
  const illustrations = {
    rides: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#f1f5f9"/>
        <rect x="50" y="110" width="140" height="8" rx="4" fill="#e2e8f0"/>
        <g transform="translate(75, 60)">
          <rect x="10" y="22" width="70" height="28" rx="10" fill="#3b82f6"/>
          <rect x="0" y="32" width="90" height="20" rx="6" fill="#2563eb"/>
          <rect x="5" y="15" width="22" height="14" rx="4" fill="#1d4ed8"/>
          <rect x="32" y="12" width="38" height="17" rx="4" fill="#1d4ed8"/>
          <rect x="75" y="15" width="15" height="14" rx="4" fill="#1d4ed8"/>
          <circle cx="22" cy="55" r="8" fill="#1e293b"/>
          <circle cx="68" cy="55" r="8" fill="#1e293b"/>
          <circle cx="22" cy="55" r="4" fill="#64748b"/>
          <circle cx="68" cy="55" r="4" fill="#64748b"/>
          <rect x="82" y="38" width="5" height="4" rx="1" fill="#fbbf24"/>
          <rect x="-2" y="38" width="4" height="4" rx="1" fill="#ef4444" opacity="0.7"/>
        </g>
        <path d="M95 130 L110 118 L125 130" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeDasharray="4,3"/>
        <path d="M120 130 L120 150" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round"/>
        <circle cx="120" cy="155" r="3" fill="#94a3b8" opacity="0.4"/>
      </svg>
    ),
    earnings: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#f0fdf4"/>
        <rect x="50" y="65" width="22" height="95" rx="5" fill="#bbf7d0"/>
        <rect x="80" y="48" width="22" height="112" rx="5" fill="#86efac"/>
        <rect x="110" y="30" width="22" height="130" rx="5" fill="#4ade80"/>
        <rect x="140" y="55" width="22" height="105" rx="5" fill="#22c55e"/>
        <rect x="170" y="70" width="22" height="90" rx="5" fill="#16a34a"/>
        <circle cx="120" cy="100" r="28" fill="#16a34a" opacity="0.12"/>
        <text x="120" y="107" textAnchor="middle" fill="#16a34a" fontSize="20" fontWeight="bold" fontFamily="Inter, sans-serif">ETB</text>
        <path d="M60 60 L80 45 L100 52" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="60" cy="60" r="3" fill="#22c55e"/>
        <circle cx="100" cy="52" r="3" fill="#22c55e"/>
      </svg>
    ),
    users: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#f5f3ff"/>
        <circle cx="120" cy="75" r="22" fill="#c4b5fd"/>
        <circle cx="120" cy="75" r="14" fill="#8b5cf6"/>
        <path d="M78 125c0-23 18-40 42-40s42 17 42 40" fill="#c4b5fd"/>
        <circle cx="65" cy="85" r="16" fill="#ddd6fe"/>
        <circle cx="65" cy="85" r="10" fill="#a78bfa"/>
        <path d="M40 118c0-16 11-28 25-28s25 12 25 28" fill="#ddd6fe"/>
        <circle cx="175" cy="85" r="16" fill="#ddd6fe"/>
        <circle cx="175" cy="85" r="10" fill="#a78bfa"/>
        <path d="M150 118c0-16 11-28 25-28s25 12 25 28" fill="#ddd6fe"/>
      </svg>
    ),
    sos: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#fef2f2"/>
        <circle cx="120" cy="85" r="40" fill="#fecaca" opacity="0.4"/>
        <circle cx="120" cy="85" r="28" fill="#fca5a5"/>
        <text x="120" y="95" textAnchor="middle" fill="#dc2626" fontSize="28" fontWeight="bold" fontFamily="Inter, sans-serif">!</text>
        <rect x="85" y="135" width="70" height="8" rx="4" fill="#fecaca"/>
        <rect x="95" y="150" width="50" height="6" rx="3" fill="#fecaca" opacity="0.6"/>
        <path d="M120 55 L120 45" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <path d="M150 60 L155 52" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <path d="M90 60 L85 52" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
      </svg>
    ),
    history: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#f0f9ff"/>
        <circle cx="120" cy="80" r="35" fill="#bae6fd" opacity="0.4"/>
        <circle cx="120" cy="80" r="24" fill="#7dd3fc"/>
        <line x1="120" y1="65" x2="120" y2="80" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        <line x1="120" y1="80" x2="132" y2="87" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="70" y="130" width="100" height="7" rx="3.5" fill="#bae6fd"/>
        <rect x="80" y="145" width="80" height="6" rx="3" fill="#bae6fd" opacity="0.6"/>
        <rect x="90" y="158" width="60" height="6" rx="3" fill="#bae6fd" opacity="0.4"/>
      </svg>
    ),
    noTrips: (
      <svg viewBox="0 0 240 200" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: 180, height: 150 }}>
        <circle cx="120" cy="100" r="90" fill="#f8fafc"/>
        <g transform="translate(70, 55)">
          <rect x="15" y="25" width="65" height="25" rx="10" fill="#cbd5e1"/>
          <rect x="5" y="35" width="85" height="18" rx="6" fill="#94a3b8"/>
          <circle cx="25" cy="58" r="8" fill="#64748b"/>
          <circle cx="75" cy="58" r="8" fill="#64748b"/>
          <circle cx="25" cy="58" r="4" fill="#475569"/>
          <circle cx="75" cy="58" r="4" fill="#475569"/>
        </g>
        <text x="120" y="145" textAnchor="middle" fill="#94a3b8" fontSize="14" fontWeight="600" fontFamily="Inter, sans-serif">No trips yet</text>
        <text x="120" y="162" textAnchor="middle" fill="#cbd5e1" fontSize="12" fontFamily="Inter, sans-serif">Book your first ride</text>
      </svg>
    ),
  };

  return illustrations[type] || illustrations.rides;
};

export const MapPlaceholder = () => (
  <svg viewBox="0 0 600 400" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%', borderRadius: 16 }}>
    <rect width="600" height="400" fill="#f0f9ff"/>
    <defs>
      <pattern id="map-grid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#bae6fd" strokeWidth="0.5"/>
      </pattern>
    </defs>
    <rect width="600" height="400" fill="url(#map-grid)"/>

    {/* Roads */}
    <path d="M0 200 Q150 180 300 200 Q450 220 600 200" stroke="#94a3b8" strokeWidth="3" fill="none"/>
    <path d="M100 0 Q120 100 150 200 Q180 300 200 400" stroke="#cbd5e1" strokeWidth="2" fill="none"/>
    <path d="M300 0 Q280 150 300 200 Q320 250 350 400" stroke="#cbd5e1" strokeWidth="2" fill="none"/>
    <path d="M500 0 Q480 100 500 200 Q520 300 500 400" stroke="#cbd5e1" strokeWidth="2" fill="none"/>

    {/* Buildings */}
    <rect x="120" y="80" width="40" height="30" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
    <rect x="200" y="120" width="50" height="25" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
    <rect x="380" y="90" width="35" height="35" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
    <rect x="450" y="140" width="45" height="28" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
    <rect x="150" y="250" width="55" height="30" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>
    <rect x="350" y="270" width="40" height="25" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="0.5"/>

    {/* Pickup pin */}
    <g transform="translate(148, 155)">
      <path d="M16 0C8.94 0 3 5.94 3 13c0 10 13 22 13 22s13-12 13-22C29 5.94 23.06 0 16 0z" fill="#22c55e"/>
      <circle cx="16" cy="11" r="5" fill="white"/>
    </g>

    {/* Dropoff pin */}
    <g transform="translate(418, 178)">
      <path d="M16 0C8.94 0 3 5.94 3 13c0 10 13 22 13 22s13-12 13-22C29 5.94 23.06 0 16 0z" fill="#ef4444"/>
      <circle cx="16" cy="11" r="5" fill="white"/>
    </g>

    {/* Route line */}
    <path d="M164 177 L280 195 Q300 200 320 195 L434 198" stroke="#3b82f6" strokeWidth="3" strokeDasharray="8,6" fill="none"/>

    {/* Car on route */}
    <g transform="translate(285, 185)">
      <rect x="0" y="0" width="24" height="12" rx="4" fill="#3b82f6"/>
      <circle cx="5" cy="12" r="3" fill="#1e293b"/>
      <circle cx="19" cy="12" r="3" fill="#1e293b"/>
    </g>

    <text x="300" y="360" textAnchor="middle" fill="#94a3b8" fontSize="14" fontFamily="Inter, sans-serif">Dire Dawa, Ethiopia</text>
  </svg>
);

export const DireDawaLogo = () => (
  <img src="/logo.png" alt="DIRS - Dire Dawa Ride Sharing" style={{ width: '100%', maxWidth: 400, height: 'auto', display: 'block', margin: '0 auto' }} />
);

export const WaveDecoration = () => (
  <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block', marginTop: -1 }}>
    <path d="M0 60C240 20 480 100 720 60C960 20 1200 100 1440 60V120H0V60Z" fill="white"/>
  </svg>
);
