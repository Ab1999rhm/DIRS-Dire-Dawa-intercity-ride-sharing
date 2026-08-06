import React from 'react';
import { FaCar, FaBus, FaTaxi } from 'react-icons/fa';
import './VehicleCategorySelector.css';

// Bajaj TukTuk represented with emoji span (no react-icon equivalent)
const BajajIcon = () => <span style={{ fontSize: '1.4em' }}>🛺</span>;

export const VEHICLE_CATEGORIES = [
  {
    id: 'bajaj',
    name: 'Bajaj (TukTuk)',
    icon: <BajajIcon />,
    capacity: '3 Seats',
    baseFare: 30,
    perKm: 10,
    desc: 'Fastest & cheapest for Dire Dawa intra-city',
    eta: '2 min'
  },
  {
    id: 'economy',
    name: 'Economy',
    icon: <FaTaxi />,
    capacity: '4 Seats',
    baseFare: 50,
    perKm: 15,
    desc: 'Standard everyday rides',
    eta: '3 min'
  },
  {
    id: 'comfort',
    name: 'Comfort VIP',
    icon: <FaCar />,
    capacity: '4 Seats',
    baseFare: 90,
    perKm: 22,
    desc: 'Air-conditioned premium sedans',
    eta: '5 min'
  },
  {
    id: 'minibus',
    name: 'Minibus / Coaster',
    icon: <FaBus />,
    capacity: '12-16 Seats',
    baseFare: 150,
    perKm: 20,
    desc: 'Intercity group travel (Harar, Jigjiga)',
    eta: 'Scheduled'
  }
];

const VehicleCategorySelector = ({ selectedCategory, onSelectCategory, rideType, distanceKm = 5, passengersCount = 1 }) => {
  // Filter categories based on ride type
  const availableCategories = VEHICLE_CATEGORIES.filter((cat) => {
    if (rideType === 'intercity') return cat.id === 'minibus' || cat.id === 'comfort';
    return cat.id !== 'minibus';
  });

  return (
    <div className="vehicle-tier-container">
      <h4 className="tier-title">Select Ride Category</h4>
      <div className="tier-grid">
        {availableCategories.map((cat) => {
          const estimatedCost = Math.round((cat.baseFare + distanceKm * cat.perKm) * (rideType === 'intercity' ? passengersCount : 1));
          const isSelected = selectedCategory?.id === cat.id;

          return (
            <div
              key={cat.id}
              className={`tier-card ${isSelected ? 'selected' : ''}`}
              onClick={() => onSelectCategory(cat)}
            >
              <div className="tier-icon">{cat.icon}</div>
              <div className="tier-details">
                <div className="tier-name-row">
                  <strong className="tier-name">{cat.name}</strong>
                  <span className="tier-price">{estimatedCost} ETB</span>
                </div>
                <span className="tier-sub">{cat.capacity} • ETA {cat.eta}</span>
                <p className="tier-desc">{cat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleCategorySelector;
