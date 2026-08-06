import React, { createContext, useState, useContext, useCallback } from 'react';

const RideContext = createContext(null);

export const RideProvider = ({ children }) => {
  const [currentRide, setCurrentRide] = useState(null);
  const [rideRequests, setRideRequests] = useState([]);
  const [pickupLocation, setPickupLocation] = useState(null);
  const [dropoffLocation, setDropoffLocation] = useState(null);
  const [estimatedFare, setEstimatedFare] = useState(null);
  const [rideType, setRideType] = useState('intra_city');
  const [routeInfo, setRouteInfo] = useState(null);

  const [currentRideRequestId, setCurrentRideRequestId] = useState(null);
  const [vehicleCategory, setVehicleCategory] = useState({ id: 'economy', name: 'Economy', baseFare: 50, perKm: 15 });
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [walletBalance, setWalletBalance] = useState(500); // 500 ETB starting wallet

  const selectPickup = useCallback((location) => {
    setPickupLocation(location);
  }, []);

  const selectDropoff = useCallback((location) => {
    setDropoffLocation(location);
  }, []);

  const clearLocations = useCallback(() => {
    setPickupLocation(null);
    setDropoffLocation(null);
    setEstimatedFare(null);
    setRouteInfo(null);
    setCurrentRideRequestId(null);
    setSelectedSeats([]);
    setAppliedPromo(null);
  }, []);

  return (
    <RideContext.Provider value={{
      currentRide,
      setCurrentRide,
      currentRideRequestId,
      setCurrentRideRequestId,
      vehicleCategory,
      setVehicleCategory,
      selectedSeats,
      setSelectedSeats,
      appliedPromo,
      setAppliedPromo,
      walletBalance,
      setWalletBalance,
      rideRequests,
      setRideRequests,
      pickupLocation,
      dropoffLocation,
      estimatedFare,
      setEstimatedFare,
      rideType,
      setRideType,
      routeInfo,
      setRouteInfo,
      selectPickup,
      selectDropoff,
      clearLocations
    }}>
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const context = useContext(RideContext);
  if (!context) {
    throw new Error('useRide must be used within a RideProvider');
  }
  return context;
};
