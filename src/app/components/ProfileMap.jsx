"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import axios from 'axios';

// Default center (e.g., center of India) if location is not found
const defaultCenter = { lat: 20.5937, lng: 78.9629 };
const defaultZoom = 5; // Zoom out to see all of India

// Container style
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const ProfileMap = ({ locationString }) => {
  const [center, setCenter] = useState(defaultCenter);
  const [zoom, setZoom] = useState(defaultZoom);
  const [loadingGeocode, setLoadingGeocode] = useState(true);

  // Memoize the libraries array to prevent re-renders
  const libraries = useMemo(() => ['geocoding'], []);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    // Only try to geocode if the map is loaded AND we have a location
    if (isLoaded && locationString) {
      setLoadingGeocode(true);
      
      // We will create this API route in the next step
      axios.get(`/api/geocode?address=${encodeURIComponent(locationString)}`)
        .then(response => {
          if (response.data.success) {
            setCenter(response.data.coordinates);
            setZoom(10); // Zoom in to the city/district level
          } else {
            // Handle cases where Google can't find the address
            console.warn("Geocoding failed, using default center.");
            setCenter(defaultCenter);
            setZoom(defaultZoom);
          }
        })
        .catch(err => {
          console.error("Geocoding API error:", err);
          setCenter(defaultCenter);
          setZoom(defaultZoom);
        })
        .finally(() => {
          setLoadingGeocode(false);
        });
    } else if (isLoaded && !locationString) {
      // If map is loaded but user has no location, stop loading
      setLoadingGeocode(false);
    }
  }, [isLoaded, locationString]);

  if (loadError) {
    console.error("Google Maps Load Error:", loadError);
    return <div className="p-4 text-red-500">Error loading map. Check API key.</div>;
  }
  
  if (!isLoaded || loadingGeocode) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500 text-sm">Loading map...</p>
      </div>
    );
  }
  
  // If no location, show a centered map of India with no marker
  if (!locationString) {
     return (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <p className="text-gray-500 text-sm">No location provided.</p>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={zoom}
    >
      <Marker position={center} />
    </GoogleMap>
  );
};

export default ProfileMap;