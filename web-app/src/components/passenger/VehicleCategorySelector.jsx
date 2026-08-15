import React from 'react';
import { FaCar, FaBus, FaTaxi } from 'react-icons/fa';
import './VehicleCategorySelector.css';

const BajajIcon = () => <span style={{ fontSize: '1.4em' }}>🛺</span>;

export const VEHICLE_CATEGORIES = [
  {
    id: 'bajaj',
    name: 'Bajaj',
    icon: <BajajIcon />,
    capacity: 3,
    capacityLabel: '3 Seats',
    baseFare: 30,
    perKm: 10,
    desc: 'Fast & affordable for intra-city',
    eta: '2 min',
    rideType: 'intra_city'
  },
  {
    id: 'car',
    name: 'Car',
    icon: <FaTaxi />,
    capacity: 4,
    capacityLabel: '4 Seats',
    baseFare: 50,
    perKm: 15,
    desc: 'Standard everyday rides',
    eta: '3 min',
    rideType: 'both'
  },
  {
    id: 'minivan',
    name: 'Minivan',
    icon: <FaCar />,
    capacity: 7,
    capacityLabel: '7 Seats',
    baseFare: 70,
    perKm: 18,
    desc: 'Spacious vehicle for groups',
    eta: '5 min',
    rideType: 'both'
  },
  {
    id: 'minibus',
    name: 'Minibus',
    icon: <FaBus />,
    capacity: 16,
    capacityLabel: '12-16 Seats',
    baseFare: 150,
    perKm: 20,
    desc: 'Group travel (Harar, Jigjiga)',
    eta: 'Scheduled',
    rideType: 'intercity'
  },
  {
    id: 'bus',
    name: 'Bus',
    icon: <FaBus />,
    capacity: 30,
    capacityLabel: '20-30 Seats',
    baseFare: 200,
    perKm: 25,
    desc: 'Large group intercity travel',
    eta: 'Scheduled',
    rideType: 'intercity'
  }
];

const VehicleCategorySelector = ({ selectedCategory, onSelectCategory, rideType, distanceKm = 5, passengersCount = 1 }) => {
  const availableCategories = VEHICLE_CATEGORIES.filter((cat) => {
    if (rideType === 'intercity' || rideType === 'interCity') return cat.rideType === 'intercity' || cat.rideType === 'both';
    return cat.rideType === 'intra_city' || cat.rideType === 'both';
  });

  return (
    <div className="vehicle-tier-container">
      <h4 className="tier-title">Select Ride Category</h4>
      <div className="tier-grid">
        {availableCategories.map((cat) => {
          const estimatedCost = Math.round((cat.baseFare + distanceKm * cat.perKm) * ((rideType === 'intercity' || rideType === 'interCity') ? passengersCount : 1));
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
                <span className="tier-sub">{cat.capacityLabel || `${cat.capacity} Seats`} • ETA {cat.eta}</span>
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
