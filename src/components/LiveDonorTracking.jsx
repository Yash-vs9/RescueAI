import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MapPin, Navigation, Crosshair, Users, Clock, Phone, 
  Droplets, Activity, AlertCircle, RefreshCcw, ChevronLeft,
  Loader2, CheckCircle, XCircle, Info, Zap, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const LiveDonorTracking = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const userMarkerRef = useRef(null);
  const userCircleRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [donors, setDonors] = useState([]);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [error, setError] = useState(null);
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: Delhi

  const userRole = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  /**
   * BUG FIX: Helper to extract coordinates from nested GeoJSON
   * Your backend sends: location: { coordinates: { coordinates: [lng, lat] } }
   */
  const getRawCoordinates = (donor) => {
    const geoData = donor.location?.coordinates || donor.hospital?.location?.coordinates;
    
    // If geoData is the array [lng, lat]
    if (Array.isArray(geoData)) return geoData;
    
    // If geoData is the object { type: "Point", coordinates: [lng, lat] }
    if (geoData?.coordinates && Array.isArray(geoData.coordinates)) {
      return geoData.coordinates;
    }
    
    return null;
  };

  // Get User Location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter([location.lat, location.lng]);
          localStorage.setItem("userLat", location.lat);
          localStorage.setItem("userLng", location.lng);
          console.log('📍 User location:', location);
        },
        (error) => {
          console.error("⚠️ Location error:", error);
          setError("Location access denied. Using default location.");
          const fallback = { lat: 28.6139, lng: 77.2090 };
          setUserLocation(fallback);
          setMapCenter([fallback.lat, fallback.lng]);
        }
      );
    }
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (mapRef.current && !leafletMapRef.current) {
      initializeMap();
    }

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, []);

  // Update map center when location changes
  useEffect(() => {
    if (leafletMapRef.current && userLocation) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 13);
      addUserMarker(userLocation);
    }
  }, [userLocation]);

  // Fetch Nearby Donors
  useEffect(() => {
    if (userLocation) {
      fetchNearbyDonors();
      const interval = setInterval(fetchNearbyDonors, 30000);
      return () => clearInterval(interval);
    }
  }, [userLocation]);

  // Live Location Tracking
  useEffect(() => {
    let watchId;
    if (trackingEnabled && userLocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(newLocation);
          updateUserMarker(newLocation);
          console.log('🔄 Location updated:', newLocation);
        },
        (error) => console.error("Tracking error:", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [trackingEnabled]);

  const initializeMap = () => {
    const map = L.map(mapRef.current, {
      center: mapCenter,
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    leafletMapRef.current = map;
    setLoading(false);

    if (userLocation) {
      addUserMarker(userLocation);
    }
  };

  const addUserMarker = (location) => {
    if (!leafletMapRef.current) return;

    if (userMarkerRef.current) leafletMapRef.current.removeLayer(userMarkerRef.current);
    if (userCircleRef.current) leafletMapRef.current.removeLayer(userCircleRef.current);

    const userIcon = L.divIcon({
      className: 'user-location-marker',
      html: `
        <div style="position: relative;">
          <div style="
            width: 24px;
            height: 24px;
            background: #C1403D;
            border: 4px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(193, 64, 61, 0.4);
            animation: pulse-marker 2s ease-in-out infinite;
          "></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    const marker = L.marker([location.lat, location.lng], { 
      icon: userIcon,
      zIndexOffset: 1000 
    }).addTo(leafletMapRef.current);

    marker.bindPopup(`
      <div style="font-family: 'Outfit', sans-serif; padding: 8px;">
        <h3 style="margin: 0 0 8px 0; color: #2F4538; font-size: 16px; font-weight: 700;">Your Location</h3>
        <p style="margin: 0; color: #5A7A6B; font-size: 14px;">📍 Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}</p>
      </div>
    `);

    const circle = L.circle([location.lat, location.lng], {
      color: '#C1403D',
      fillColor: '#C1403D',
      fillOpacity: 0.1,
      radius: 5000,
      weight: 2,
      opacity: 0.3,
    }).addTo(leafletMapRef.current);

    userMarkerRef.current = marker;
    userCircleRef.current = circle;
  };

  const updateUserMarker = (location) => {
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([location.lat, location.lng]);
    } else {
      addUserMarker(location);
    }
    if (userCircleRef.current) userCircleRef.current.setLatLng([location.lat, location.lng]);
    if (leafletMapRef.current && trackingEnabled) leafletMapRef.current.panTo([location.lat, location.lng]);
  };

  const fetchNearbyDonors = async () => {
    if (!userLocation) return;
    try {
      const endpoint = userRole === "hospital" 
        ? `/api/user/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}&distance=50`
        : `/api/blood-requests/nearby?lat=${userLocation.lat}&lng=${userLocation.lng}`;

      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      if (data.success) {
        const donorsList = data.donors || data.requests || [];
        setDonors(donorsList);
        updateDonorMarkers(donorsList);
        setError(null);
      } else {
        setError(data.message || 'Failed to load donors');
      }
    } catch (err) {
      setError(`Backend error: ${err.message}`);
      setDonors([]);
    }
  };

  const updateDonorMarkers = (donorsList) => {
    if (!leafletMapRef.current) return;

    Object.values(markersRef.current).forEach(marker => {
      leafletMapRef.current.removeLayer(marker);
    });
    markersRef.current = {};

    donorsList.forEach(donor => {
      const coordsArray = getRawCoordinates(donor);
      
      if (coordsArray && coordsArray.length === 2) {
        const [lng, lat] = coordsArray;
        const isAvailable = donor.isAvailable !== false;
        const color = isAvailable ? '#5A7A6B' : '#94a3b8';
        const bloodGroup = donor.bloodGroup || 'D';
        
        const donorIcon = L.divIcon({
          className: 'donor-marker',
          html: `
            <div style="position: relative;">
              <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 0C11.163 0 4 7.163 4 16c0 12 16 34 16 34s16-22 16-34c0-8.837-7.163-16-16-16z" 
                      fill="${color}" stroke="white" stroke-width="2"/>
                <circle cx="20" cy="16" r="8" fill="white"/>
                <text x="20" y="21" font-family="Arial" font-size="12" font-weight="bold" 
                      fill="${color}" text-anchor="middle">${bloodGroup}</text>
              </svg>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 50],
          popupAnchor: [0, -50],
        });

        const marker = L.marker([lat, lng], { icon: donorIcon }).addTo(leafletMapRef.current);
        const distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);

        marker.bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; padding: 12px; min-width: 220px;">
            <h3 style="margin: 0 0 12px 0; color: #2F4538; font-size: 18px; font-weight: 700;">${donor.name || donor.hospitalName || 'Donor'}</h3>
            <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: #5A7A6B;">
               <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600;">Blood Group:</span>
                <span style="background: rgba(193, 64, 61, 0.1); padding: 4px 12px; border-radius: 8px; color: #C1403D; font-weight: 700;">${bloodGroup}</span>
              </div>
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <span style="font-weight: 600;">Distance:</span>
                <span style="color: #C1403D; font-weight: 700;">${distance.toFixed(1)} km</span>
              </div>
            </div>
          </div>
        `);

        marker.on('click', () => {
          setSelectedDonor(donor);
          leafletMapRef.current.setView([lat, lng], 15);
        });

        markersRef.current[donor._id] = marker;
      }
    });
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; 
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const toRad = (degrees) => degrees * (Math.PI / 180);

  const centerOnUser = () => {
    if (leafletMapRef.current && userLocation) {
      leafletMapRef.current.setView([userLocation.lat, userLocation.lng], 14, { animate: true, duration: 1 });
    }
  };

  const centerOnDonor = (donor) => {
    const coordsArray = getRawCoordinates(donor);
    if (leafletMapRef.current && coordsArray) {
      const [lng, lat] = coordsArray;
      leafletMapRef.current.setView([lat, lng], 15, { animate: true, duration: 1 });
      setSelectedDonor(donor);
      const marker = markersRef.current[donor._id];
      if (marker) marker.openPopup();
    }
  };

  return (
    <div className="tracking-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');
        :root { --cream: #FDF8F3; --crimson: #C1403D; --terracotta: #E07856; --sage: #5A7A6B; --forest: #2F4538; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .tracking-container { height: 100vh; background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 100%); position: relative; overflow: hidden; font-family: 'Outfit', sans-serif; }
        @keyframes pulse-marker { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.2); opacity: 0.8; } }
        .tracking-header { position: absolute; top: 0; left: 0; right: 0; z-index: 1000; display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 2rem; backdrop-filter: blur(30px); background: rgba(253, 248, 243, 0.95); border-bottom: 2px solid rgba(255, 255, 255, 0.5); box-shadow: 0 5px 30px rgba(47, 69, 56, 0.08); }
        .back-button { display: flex; align-items: center; gap: 0.625rem; padding: 0.875rem 1.5rem; background: rgba(255, 255, 255, 0.9); color: var(--sage); border-radius: 18px; border: 2px solid rgba(90, 122, 107, 0.15); font-weight: 700; cursor: pointer; transition: all 0.3s ease; }
        .back-button:hover { background: white; color: var(--crimson); transform: translateX(-5px); box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15); }
        .header-title { font-family: 'Crimson Pro', serif; font-size: 1.75rem; font-weight: 800; color: var(--crimson); }
        .free-badge { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(90, 122, 107, 0.1); border-radius: 12px; font-weight: 700; font-size: 0.75rem; color: var(--sage); }
        .tracking-toggle { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.5rem; background: rgba(255, 255, 255, 0.9); border-radius: 18px; border: 2px solid rgba(90, 122, 107, 0.15); cursor: pointer; transition: all 0.3s ease; }
        .tracking-toggle.active { background: var(--sage); color: white; border-color: var(--sage); }
        .toggle-switch { width: 48px; height: 26px; background: rgba(90, 122, 107, 0.3); border-radius: 13px; position: relative; }
        .toggle-knob { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: white; border-radius: 50%; transition: all 0.3s ease; }
        .tracking-toggle.active .toggle-knob { left: 25px; }
        .map-wrapper { position: absolute; top: 88px; left: 0; right: 0; bottom: 0; display: flex; }
        .map-container { flex: 1; position: relative; }
        #map { width: 100%; height: 100%; z-index: 1; }
        .map-controls { position: absolute; top: 20px; right: 20px; display: flex; flex-direction: column; gap: 12px; z-index: 400; }
        .map-control-btn { width: 48px; height: 48px; background: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; color: var(--sage); cursor: pointer; border: none; box-shadow: 0 5px 20px rgba(0,0,0,0.1); transition: 0.3s; }
        .map-control-btn:hover { color: var(--crimson); transform: scale(1.1); }
        .donors-sidebar { width: 380px; background: rgba(253, 248, 243, 0.95); border-left: 2px solid rgba(255, 255, 255, 0.5); display: flex; flex-direction: column; box-shadow: -5px 0 30px rgba(0,0,0,0.05); z-index: 500; }
        .sidebar-header { padding: 2rem; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .sidebar-title { font-family: 'Crimson Pro', serif; font-size: 1.75rem; color: var(--forest); }
        .donors-count { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; background: rgba(193, 64, 61, 0.1); border-radius: 12px; margin-top: 1rem; color: var(--crimson); font-weight: 700; }
        .donors-list { flex: 1; overflow-y: auto; padding: 1rem; }
        .donor-card { background: white; border: 2px solid transparent; border-radius: 24px; padding: 1.5rem; margin-bottom: 1rem; transition: 0.3s; cursor: pointer; box-shadow: 0 4px 15px rgba(0,0,0,0.02); }
        .donor-card:hover { transform: translateX(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.08); }
        .donor-card.selected { border-color: var(--crimson); }
        .donor-blood-group { padding: 0.375rem 0.875rem; background: rgba(193, 64, 61, 0.1); border-radius: 12px; font-weight: 800; color: var(--crimson); }
        .loading-overlay { position: absolute; inset: 0; background: var(--cream); display: flex; align-items: center; justify-content: center; z-index: 2000; }
        .loading-spinner { width: 50px; height: 50px; border: 4px solid rgba(193, 64, 61, 0.1); border-top-color: var(--crimson); border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 768px) { .donors-sidebar { width: 100%; max-height: 40%; } .map-wrapper { flex-direction: column-reverse; } .header-title, .free-badge { display: none; } }
      `}</style>

      <header className="tracking-header">
        <button onClick={() => navigate('/')} className="back-button">
          <ChevronLeft size={20} /> <span>Back</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1 className="header-title">Live Donor Tracking</h1>
          <div className="free-badge">
            <CheckCircle size={16} /> <span>100% Free</span>
          </div>
        </div>

        <div className={`tracking-toggle ${trackingEnabled ? 'active' : ''}`} onClick={() => setTrackingEnabled(!trackingEnabled)}>
          <div className="toggle-switch">
            <div className="toggle-knob"></div>
          </div>
          <span className="toggle-label">{trackingEnabled ? 'Live ON' : 'Live OFF'}</span>
        </div>
      </header>

      <div className="map-wrapper">
        <div className="map-container">
          <div id="map" ref={mapRef}></div>
          <div className="map-controls">
            <button className="map-control-btn" onClick={centerOnUser} title="Center on me"><Crosshair size={22} /></button>
            <button className="map-control-btn" onClick={fetchNearbyDonors} title="Refresh"><RefreshCcw size={22} /></button>
          </div>
          {loading && (
            <div className="loading-overlay">
              <div><div className="loading-spinner"></div><p style={{marginTop:'1rem'}}>Syncing Map...</p></div>
            </div>
          )}
          {error && <div className="error-banner"><AlertCircle size={20} /><span>{error}</span></div>}
        </div>

        <aside className="donors-sidebar">
          <div className="sidebar-header">
            <h2 className="sidebar-title">Nearby Donors</h2>
            <p style={{color:'var(--sage)'}}>Within 50km radius</p>
            <div className="donors-count"><Users size={18} /><span>{donors.length} Available</span></div>
          </div>

          <div className="donors-list">
            {donors.length > 0 ? (
              donors.map(donor => {
                const coordsArray = getRawCoordinates(donor);
                return (
                  <motion.div
                    key={donor._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`donor-card ${selectedDonor?._id === donor._id ? 'selected' : ''}`}
                    onClick={() => centerOnDonor(donor)}
                  >
                    <div style={{display:'flex', justifyContent:'space-between', marginBottom:'1rem'}}>
                      <div>
                        <h3 className="donor-name">{donor.name || donor.hospitalName}</h3>
                        <span className="donor-blood-group">{donor.bloodGroup || 'N/A'}</span>
                      </div>
                      <span className={`donor-status ${donor.isAvailable !== false ? 'available' : 'unavailable'}`}>
                         {donor.isAvailable !== false ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </span>
                    </div>

                    <div className="donor-info">
                      <div className="donor-info-item">
                        <MapPin size={16} color="var(--crimson)" />
                        <span className="donor-distance">
                          {userLocation && coordsArray
                            ? `${calculateDistance(userLocation.lat, userLocation.lng, coordsArray[1], coordsArray[0]).toFixed(1)} km away`
                            : 'Distance N/A'}
                        </span>
                      </div>
                      {donor.phone && (
                        <div className="donor-info-item">
                          <Phone size={16} />
                          <a href={`tel:${donor.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{donor.phone}</a>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="empty-state"><Users size={60} style={{opacity:0.2, margin:'2rem auto', display:'block'}} /><p style={{textAlign:'center', color:'var(--sage)'}}>No donors in your vicinity</p></div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default LiveDonorTracking;