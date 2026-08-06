import React from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, DirectionsRenderer } from '@react-google-maps/api';

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 9.5931, // Dire Dawa default
  lng: 41.8661
};

const MapView = ({ pickupLocation, dropoffLocation, driverLocation, height = '300px' }) => {
  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: apiKey,
    libraries: ['places']
  });

  const [directions, setDirections] = React.useState(null);

  React.useEffect(() => {
    if (isLoaded && pickupLocation?.coordinates && dropoffLocation?.coordinates && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      const origin = { lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] };
      const destination = { lat: dropoffLocation.coordinates[1], lng: dropoffLocation.coordinates[0] };

      directionsService.route(
        {
          origin,
          destination,
          travelMode: window.google.maps.TravelMode.DRIVING
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
          }
        }
      );
    }
  }, [isLoaded, pickupLocation, dropoffLocation]);

  const center = pickupLocation?.coordinates
    ? { lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] }
    : driverLocation?.coordinates
    ? { lat: driverLocation.coordinates[1], lng: driverLocation.coordinates[0] }
    : defaultCenter;

  if (loadError || !apiKey) {
    return (
      <div
        style={{
          height,
          background: '#e9ecef',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          color: '#495057',
          textAlign: 'center'
        }}
      >
        <p style={{ fontWeight: 600, marginBottom: '8px' }}>📍 Map Overview (Dire Dawa)</p>
        {pickupLocation && <p style={{ fontSize: '13px' }}>Pickup: {pickupLocation.address || `${pickupLocation.coordinates[1]}, ${pickupLocation.coordinates[0]}`}</p>}
        {dropoffLocation && <p style={{ fontSize: '13px' }}>Dropoff: {dropoffLocation.address || `${dropoffLocation.coordinates[1]}, ${dropoffLocation.coordinates[0]}`}</p>}
        {driverLocation && <p style={{ fontSize: '13px', color: '#1a73e8' }}>Driver Live: {driverLocation.coordinates ? `${driverLocation.coordinates[1]}, ${driverLocation.coordinates[0]}` : 'Active'}</p>}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ height, background: '#f8f9fa', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Loading Map...</span>
      </div>
    );
  }

  return (
    <div style={{ height, width: '100%', position: 'relative' }}>
      <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={13}>
        {pickupLocation?.coordinates && (
          <MarkerF
            position={{ lat: pickupLocation.coordinates[1], lng: pickupLocation.coordinates[0] }}
            label="A"
            title="Pickup"
          />
        )}
        {dropoffLocation?.coordinates && (
          <MarkerF
            position={{ lat: dropoffLocation.coordinates[1], lng: dropoffLocation.coordinates[0] }}
            label="B"
            title="Dropoff"
          />
        )}
        {driverLocation?.coordinates && (
          <MarkerF
            position={{ lat: driverLocation.coordinates[1], lng: driverLocation.coordinates[0] }}
            icon={{
              url: 'https://maps.google.com/mapfiles/kml/shapes/cabs.png',
              scaledSize: new window.google.maps.Size(32, 32)
            }}
            title="Driver Location"
          />
        )}
        {directions && <DirectionsRenderer directions={directions} options={{ suppressMarkers: true }} />}
      </GoogleMap>
    </div>
  );
};

export default MapView;
