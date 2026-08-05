import React from 'react';

export const CarIcon = ({ size = 48, color = '#1a73e8', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="4" y="28" width="56" height="20" rx="4" fill={color} opacity="0.15"/>
    <path d="M12 36C12 32 14 28 20 26L24 18C24.8 16.4 26.4 15.5 28 15.5H36C37.6 15.5 39.2 16.4 40 18L44 26C50 28 52 32 52 36V42C52 43.1 51.1 44 50 44H46C44.9 44 44 43.1 44 42V40C44 38.9 43.1 38 42 38H22C20.9 38 20 38.9 20 40V42C20 43.1 19.1 44 18 44H14C12.9 44 12 43.1 12 42V36Z" fill={color}/>
    <circle cx="20" cy="44" r="4" fill={color}/>
    <circle cx="44" cy="44" r="4" fill={color}/>
    <circle cx="20" cy="44" r="2" fill="white"/>
    <circle cx="44" cy="44" r="2" fill="white"/>
    <rect x="16" y="28" width="10" height="6" rx="2" fill="white" opacity="0.7"/>
    <rect x="38" y="28" width="10" height="6" rx="2" fill="white" opacity="0.7"/>
    <rect x="28" y="18" width="8" height="8" rx="1" fill="white" opacity="0.5"/>
  </svg>
);

export const MinivanIcon = ({ size = 48, color = '#8b5cf6', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="6" y="24" width="52" height="24" rx="4" fill={color} opacity="0.15"/>
    <path d="M10 36C10 30 14 26 20 24H44C50 26 54 30 54 36V42C54 43.1 53.1 44 52 44H48C46.9 44 46 43.1 46 42V40C46 38.9 45.1 38 44 38H20C18.9 38 18 38.9 18 40V42C18 43.1 17.1 44 16 44H12C10.9 44 10 43.1 10 42V36Z" fill={color}/>
    <rect x="14" y="18" width="36" height="14" rx="3" fill={color}/>
    <circle cx="18" cy="44" r="4" fill={color}/>
    <circle cx="46" cy="44" r="4" fill={color}/>
    <circle cx="18" cy="44" r="2" fill="white"/>
    <circle cx="46" cy="44" r="2" fill="white"/>
    <rect x="18" y="20" width="10" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="30" y="20" width="10" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="42" y="22" width="6" height="6" rx="2" fill="white" opacity="0.4"/>
  </svg>
);

export const MinibusIcon = ({ size = 48, color = '#f59e0b', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="4" y="20" width="56" height="28" rx="4" fill={color} opacity="0.15"/>
    <rect x="8" y="16" width="48" height="28" rx="4" fill={color}/>
    <circle cx="16" cy="48" r="4" fill={color}/>
    <circle cx="48" cy="48" r="4" fill={color}/>
    <circle cx="16" cy="48" r="2" fill="white"/>
    <circle cx="48" cy="48" r="2" fill="white"/>
    <rect x="12" y="20" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="22" y="20" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="32" y="20" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="42" y="20" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="10" y="32" width="44" height="6" rx="2" fill="white" opacity="0.3"/>
  </svg>
);

export const BajajIcon = ({ size = 48, color = '#10b981', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <path d="M32 12L18 30H12L16 44H48L52 30H46L32 12Z" fill={color} opacity="0.15"/>
    <path d="M20 28L32 14L44 28V38C44 40 42 42 40 42H24C22 42 20 40 20 38V28Z" fill={color}/>
    <circle cx="20" cy="46" r="5" fill={color}/>
    <circle cx="44" cy="46" r="5" fill={color}/>
    <circle cx="20" cy="46" r="2.5" fill="white"/>
    <circle cx="44" cy="46" r="2.5" fill="white"/>
    <rect x="26" y="22" width="12" height="10" rx="3" fill="white" opacity="0.7"/>
    <rect x="28" y="36" width="8" height="4" rx="1" fill="white" opacity="0.5"/>
    <circle cx="32" cy="12" r="2" fill={color}/>
  </svg>
);

export const BusIcon = ({ size = 48, color = '#ef4444', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="6" y="14" width="52" height="34" rx="4" fill={color} opacity="0.15"/>
    <rect x="8" y="12" width="48" height="32" rx="4" fill={color}/>
    <circle cx="16" cy="50" r="4" fill={color}/>
    <circle cx="32" cy="50" r="4" fill={color}/>
    <circle cx="48" cy="50" r="4" fill={color}/>
    <circle cx="16" cy="50" r="2" fill="white"/>
    <circle cx="32" cy="50" r="2" fill="white"/>
    <circle cx="48" cy="50" r="2" fill="white"/>
    <rect x="12" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="22" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="32" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="42" y="16" width="8" height="8" rx="2" fill="white" opacity="0.6"/>
    <rect x="12" y="28" width="40" height="4" rx="2" fill="white" opacity="0.3"/>
    <rect x="10" y="36" width="44" height="6" rx="2" fill="white" opacity="0.4"/>
  </svg>
);

export const BikeIcon = ({ size = 48, color = '#f59e0b', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <circle cx="18" cy="42" r="10" fill={color} opacity="0.15"/>
    <circle cx="46" cy="42" r="10" fill={color} opacity="0.15"/>
    <circle cx="18" cy="42" r="8" stroke={color} strokeWidth="3" fill="none"/>
    <circle cx="46" cy="42" r="8" stroke={color} strokeWidth="3" fill="none"/>
    <path d="M18 42L28 24H38L46 42" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 24L36 42" stroke={color} strokeWidth="2.5" strokeLinecap="round"/>
    <rect x="24" y="20" width="18" height="4" rx="2" fill={color}/>
    <circle cx="32" cy="20" r="3" fill={color}/>
  </svg>
);

export const ElectricIcon = ({ size = 48, color = '#22c55e', className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
    <rect x="8" y="24" width="48" height="20" rx="6" fill={color} opacity="0.15"/>
    <path d="M14 34C14 30 16 26 22 24L26 16C26.8 14.4 28.4 13.5 30 13.5H34C35.6 13.5 37.2 14.4 38 16L42 24C48 26 50 30 50 34V38C50 39.1 49.1 40 48 40H44C42.9 40 42 39.1 42 38V36C42 34.9 41.1 34 40 34H24C22.9 34 22 34.9 22 36V38C22 39.1 21.1 40 20 40H16C14.9 40 14 39.1 14 38V34Z" fill={color}/>
    <circle cx="22" cy="40" r="4" fill={color}/>
    <circle cx="42" cy="40" r="4" fill={color}/>
    <circle cx="22" cy="40" r="2" fill="white"/>
    <circle cx="42" cy="40" r="2" fill="white"/>
    <path d="M30 18L34 26H28L32 34" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DriverAvatarIcon = ({ size = 80, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 80 80" fill="none" className={className}>
    <circle cx="40" cy="40" r="40" fill="#e3f2fd"/>
    <circle cx="40" cy="30" r="12" fill="#1976d2"/>
    <path d="M16 68C16 54 26 44 40 44C54 44 64 54 64 68" fill="#1976d2"/>
    <circle cx="40" cy="30" r="8" fill="white" opacity="0.3"/>
    <rect x="34" y="24" width="12" height="4" rx="2" fill="white" opacity="0.5"/>
  </svg>
);

const vehicleIcons = { car: CarIcon, minivan: MinivanIcon, minibus: MinibusIcon, bajaj: BajajIcon, bus: BusIcon, bike: BikeIcon, electric: ElectricIcon };
export const getVehicleIcon = (type) => vehicleIcons[type] || CarIcon;
