import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Heart, Plus, Droplets, Hospital, Search, Share2, Activity, Users, 
  ShieldCheck, PlusCircle, History, Bell, LogOut, MapPin, Loader2, RefreshCcw, X, BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

const RescueBlood = () => {
  // 1. URL CONFIGURATION
  const RENDER_URL = "https://rescueai-1.onrender.com";
  const apiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emergencies, setEmergencies] = useState([]);
  const [nearbyDonors, setNearbyDonors] = useState([]);
  const [isAvailable, setIsAvailable] = useState(true);
  const [newAlert, setNewAlert] = useState(null);

  const [coords, setCoords] = useState({
    lat: localStorage.getItem("userLat") || null,
    lng: localStorage.getItem("userLng") || null
  });

  const userRole = localStorage.getItem("role") || "guest";
  const token = localStorage.getItem("token");

  // Use refs to track if initial fetch has been done
  const hasInitializedDonorFetch = useRef(false);
  const hasInitializedHospitalFetch = useRef(false);

  // 2. GEOLOCATION
  useEffect(() => {
    if (userRole !== "guest" && (!coords.lat || !coords.lng)) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          localStorage.setItem("userLat", newLat);
          localStorage.setItem("userLng", newLng);
          setCoords({ lat: newLat, lng: newLng });
        },
        (err) => console.error("Location access denied:", err)
      );
    }
  }, [userRole, coords.lat, coords.lng]);

  // 3. SOCKET INTEGRATION
  useEffect(() => {
    if (!token || userRole !== "donor") return;
    
    const socket = io(RENDER_URL, { 
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => console.log("📡 Connected to Render WebSocket"));

    socket.on("blood_request", (data) => {
      console.log("New Emergency Received:", data);
      setEmergencies((prev) => {
        const exists = prev.find(e => e.requestId === data.requestId || e._id === data.requestId);
        if (exists) return prev;
        return [data, ...prev];
      });
      setNewAlert(data);
    });

    socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });

    return () => socket.disconnect();
  }, [token, userRole, RENDER_URL]);

  // 4. API LOGIC - Memoized with useCallback but no dependencies that change
  const fetchNearbyRequests = useCallback(async () => {
    if (userRole !== "donor" || !coords.lat || !coords.lng) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/blood-requests/nearby?lat=${coords.lat}&lng=${coords.lng}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEmergencies(data.requests);
    } catch (err) {
      console.error("Fetch Emergencies Failed", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, coords.lat, coords.lng, token, apiUrl]);

  const fetchNearbyDonors = useCallback(async () => {
    if (userRole !== "hospital" || !coords.lat || !coords.lng) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/user/nearby?lat=${coords.lat}&lng=${coords.lng}&distance=50`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setNearbyDonors(data.donors);
    } catch (err) {
      console.error("Fetch Donors Failed", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, coords.lat, coords.lng, token, apiUrl]);

  const toggleAvailability = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/user/availability`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ isAvailable: !isAvailable })
      });
      const data = await res.json();
      if (data.success) setIsAvailable(data.isAvailable);
    } catch (err) {
      console.error("Toggle failed", err);
    }
  };

  // 5. FIXED: Initial fetch only once when component mounts and conditions are met
  useEffect(() => {
    if (userRole === "donor" && coords.lat && coords.lng && !hasInitializedDonorFetch.current) {
      hasInitializedDonorFetch.current = true;
      fetchNearbyRequests();
    }
  }, [userRole, coords.lat, coords.lng, fetchNearbyRequests]);

  useEffect(() => {
    if (userRole === "hospital" && coords.lat && coords.lng && !hasInitializedHospitalFetch.current) {
      hasInitializedHospitalFetch.current = true;
      fetchNearbyDonors();
    }
  }, [userRole, coords.lat, coords.lng, fetchNearbyDonors]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  // --- VIEWS ---

  const DonorView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="space-y-20"
    >
      <section className="text-center space-y-8 relative">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 1, ease: "easeOut" }}
        >
          <h1 className="text-6xl md:text-8xl font-display font-bold text-forest leading-[0.95] mb-4">
            Find Someone to
          </h1>
          <h1 className="text-6xl md:text-8xl font-display font-bold text-crimson leading-[0.95] mb-2">
            Save Today
          </h1>
          <div className="w-32 h-1.5 bg-gradient-to-r from-crimson via-terracotta to-sage mx-auto rounded-full mt-6 animate-pulse-slow"></div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="flex justify-center gap-6 items-center flex-wrap pt-8"
        >
          <ImpactCard icon={<Activity className="text-crimson" size={28} />} count="2" label="Lives Saved" />
          <div className="organic-card group hover:scale-105 transition-all duration-500">
            <div className="text-[9px] font-bold text-sage/60 uppercase tracking-[0.2em] mb-4 font-body">Availability</div>
            <button 
              onClick={toggleAvailability} 
              className={`w-16 h-9 rounded-full transition-all relative shadow-inner ${isAvailable ? 'bg-gradient-to-r from-sage to-emerald-400' : 'bg-stone-300'}`}
            >
              <div className={`absolute top-1 w-7 h-7 bg-cream rounded-full shadow-lg transition-all ${isAvailable ? 'left-8' : 'left-1'}`}>
                <div className="w-full h-full rounded-full bg-gradient-to-br from-white to-stone-100"></div>
              </div>
            </button>
            <span className={`text-[9px] font-bold mt-3 block font-body tracking-wider ${isAvailable ? 'text-sage' : 'text-stone-400'}`}>
              {isAvailable ? 'READY TO HELP' : 'OFFLINE'}
            </span>
          </div>
        </motion.div>
      </section>

      <section id="feed">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="flex justify-between items-end mb-10"
        >
          <div>
            <h2 className="text-4xl font-display font-bold text-forest mb-2">Emergency Feed</h2>
            <p className="text-xs font-body font-semibold text-sage/70 uppercase flex items-center gap-2 tracking-wider">
              <MapPin size={14} className="text-terracotta"/> 
              {coords.lat ? 'Location Sync Active' : 'Waiting for GPS...'}
            </p>
          </div>
          <button 
            onClick={fetchNearbyRequests} 
            className="organic-button-small group"
          >
            <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700"/>
          </button>
        </motion.div>
        
        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-crimson" size={48}/>
          </div>
        ) : emergencies.length > 0 ? (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, staggerChildren: 0.1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {emergencies.map((req, index) => (
              <motion.div
                key={req._id || req.requestId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + (index * 0.1), duration: 0.6 }}
              >
                <HospitalCard 
                  hospital={req.hospitalName || req.hospital?.name} 
                  type={req.bloodGroup} 
                  units={req.units} 
                  time="Required Now" 
                  status={req.urgency} 
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-center py-28 organic-card-empty"
          >
            <div className="relative inline-block mb-6">
              <Droplets className="text-sage/20" size={72}/>
              <div className="absolute inset-0 blur-xl bg-sage/10 rounded-full"></div>
            </div>
            <p className="font-body font-semibold text-sage/60 italic text-lg">
              No emergencies found in your 50km radius
            </p>
          </motion.div>
        )}
      </section>
    </motion.div>
  );

  const HospitalView = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="space-y-16"
    >
      <section className="grid lg:grid-cols-3 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="lg:col-span-2 broadcast-card group"
        >
          <div className="relative z-10">
            <h2 className="text-5xl font-display font-bold mb-4 text-cream">Broadcast Need</h2>
            <p className="text-cream/80 mb-10 text-lg font-body font-medium max-w-md leading-relaxed">
              Instantly notify all available donors within 50km of your facility
            </p>
            <button 
              onClick={() => navigate('/bloodForm')} 
              className="cta-button group/btn"
            >
              <PlusCircle size={24} className="group-hover/btn:rotate-90 transition-transform duration-500"/> 
              Create Emergency Alert
            </button>
          </div>
          <div className="absolute -right-16 -bottom-16 opacity-20">
            <Droplets size={350} className="text-cream rotate-12"/>
          </div>
          <div className="absolute top-10 right-20 w-32 h-32 bg-cream/10 rounded-full blur-3xl animate-pulse-slow"></div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
        >
          <ImpactCard 
            icon={<Users className="text-sage" size={28} />} 
            count={nearbyDonors.length} 
            label="Donors Nearby" 
          />
        </motion.div>
      </section>

      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="organic-card"
      >
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-display font-bold text-forest">Available Donors</h3>
          <button onClick={fetchNearbyDonors} className="organic-button-small">
            <RefreshCcw size={18}/>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {nearbyDonors.map((donor, index) => (
            <motion.div 
              key={donor._id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7 + (index * 0.05), duration: 0.5 }}
              className="donor-card group"
            >
              <div className="blood-badge group-hover:scale-110 transition-transform duration-300">
                {donor.bloodGroup}
              </div>
              <p className="font-body font-bold text-forest text-sm mt-4">{donor.name}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </motion.div>
  );

  return (
    <div className="app-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700;800&family=Outfit:wght@400;500;600;700;800&display=swap');

        :root {
          --cream: #FDF8F3;
          --crimson: #C1403D;
          --terracotta: #E07856;
          --sage: #5A7A6B;
          --forest: #2F4538;
          --sand: #E8DDD0;
        }

        * {
          box-sizing: border-box;
        }

        .app-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
          position: relative;
          overflow-x: hidden;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .app-container::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(193, 64, 61, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(90, 122, 107, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(224, 120, 86, 0.05) 0%, transparent 60%);
          animation: breathe 20s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        .app-container::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F4538' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.4;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        @keyframes pulse-slow {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .font-display {
          font-family: 'Crimson Pro', serif;
        }

        .font-body {
          font-family: 'Outfit', sans-serif;
        }

        .text-forest {
          color: var(--forest);
        }

        .text-crimson {
          color: var(--crimson);
        }

        .text-sage {
          color: var(--sage);
        }

        .text-terracotta {
          color: var(--terracotta);
        }

        .text-cream {
          color: var(--cream);
        }

        .organic-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 40px;
          padding: 3rem;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 
            0 20px 60px rgba(47, 69, 56, 0.08),
            0 5px 20px rgba(193, 64, 61, 0.05),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          position: relative;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .organic-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 30px 80px rgba(47, 69, 56, 0.12),
            0 10px 30px rgba(193, 64, 61, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .organic-card-empty {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          border-radius: 50px;
          padding: 4rem;
          border: 3px dashed rgba(90, 122, 107, 0.2);
          position: relative;
        }

        .organic-button-small {
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.8);
          color: var(--sage);
          border-radius: 20px;
          border: 2px solid rgba(90, 122, 107, 0.1);
          box-shadow: 0 4px 15px rgba(90, 122, 107, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .organic-button-small:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(90, 122, 107, 0.15);
          color: var(--crimson);
        }

        .broadcast-card {
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          border-radius: 45px;
          padding: 3.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 
            0 25px 70px rgba(193, 64, 61, 0.3),
            0 10px 30px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .broadcast-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 35px 90px rgba(193, 64, 61, 0.4),
            0 15px 40px rgba(0, 0, 0, 0.15),
            inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .cta-button {
          background: var(--cream);
          color: var(--crimson);
          padding: 1.25rem 2.5rem;
          border-radius: 25px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.95rem;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.2),
            0 5px 15px rgba(193, 64, 61, 0.3);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .cta-button:hover {
          transform: translateY(-3px) scale(1.02);
          box-shadow: 
            0 15px 40px rgba(0, 0, 0, 0.25),
            0 8px 20px rgba(193, 64, 61, 0.4);
        }

        .donor-card {
          padding: 1.75rem;
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 30px;
          border: 2px solid rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 5px 20px rgba(47, 69, 56, 0.05);
        }

        .donor-card:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(47, 69, 56, 0.12);
        }

        .blood-badge {
          width: 4rem;
          height: 4rem;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.1) 0%, rgba(224, 120, 86, 0.1) 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--crimson);
          border: 2px solid rgba(193, 64, 61, 0.2);
          transition: all 0.3s ease;
        }

        .donor-card:hover .blood-badge {
          background: linear-gradient(135deg, var(--crimson) 0%, var(--terracotta) 100%);
          color: var(--cream);
          border-color: transparent;
        }

        nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2.5rem;
          backdrop-filter: blur(30px);
          background: rgba(253, 248, 243, 0.8);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 5px 30px rgba(47, 69, 56, 0.05);
        }

        .logo-container {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          cursor: pointer;
          transition: transform 0.3s ease;
        }

        .logo-container:hover {
          transform: translateY(-2px);
        }

        .logo-icon {
          background: var(--crimson);
          padding: 0.625rem;
          border-radius: 18px;
          transform: rotate(3deg);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.3);
          transition: all 0.3s ease;
        }

        .logo-container:hover .logo-icon {
          transform: rotate(-3deg) scale(1.05);
        }

        .logo-text {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--crimson);
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-left: 1.5rem;
          border-left: 2px solid rgba(90, 122, 107, 0.2);
        }

        .nav-user-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--forest);
        }

        .nav-button {
          padding: 0.875rem 1.25rem;
          background: rgba(255, 255, 255, 0.9);
          color: var(--sage);
          border-radius: 18px;
          border: 2px solid rgba(90, 122, 107, 0.1);
          font-weight: 700;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-button:hover {
          background: rgba(255, 255, 255, 1);
          color: var(--crimson);
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15);
        }

        .signin-button {
          background: var(--forest);
          color: var(--cream);
          padding: 1rem 2rem;
          border-radius: 20px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.9rem;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .signin-button:hover {
          background: var(--crimson);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.3);
        }

        main {
          max-width: 1400px;
          margin: 0 auto;
          padding: 3rem 2rem 8rem;
          position: relative;
          z-index: 1;
        }

        .alert-popup {
          position: fixed;
          top: 7rem;
          right: 2rem;
          z-index: 100;
          width: 24rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(30px);
          border-radius: 35px;
          box-shadow: 
            0 25px 70px rgba(193, 64, 61, 0.25),
            0 10px 30px rgba(0, 0, 0, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          padding: 2rem;
          border: 3px solid rgba(193, 64, 61, 0.2);
        }

        .alert-icon {
          background: var(--crimson);
          padding: 0.75rem;
          border-radius: 18px;
          color: white;
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.4);
          animation: bounce 1s ease-in-out infinite;
        }

        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }

        .alert-title {
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          color: var(--forest);
          font-size: 1.35rem;
          margin: 0;
        }

        .alert-text {
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          color: var(--sage);
          font-weight: 500;
          line-height: 1.6;
        }

        .alert-text strong {
          color: var(--crimson);
          font-weight: 700;
        }

        .alert-buttons {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.5rem;
        }

        .alert-accept {
          flex: 1;
          background: var(--crimson);
          color: white;
          padding: 1rem;
          border-radius: 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }

        .alert-accept:hover {
          background: #A63634;
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.3);
        }

        .alert-ignore {
          flex: 1;
          background: rgba(90, 122, 107, 0.1);
          color: var(--sage);
          padding: 1rem;
          border-radius: 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          transition: all 0.3s ease;
        }

        .alert-ignore:hover {
          background: rgba(90, 122, 107, 0.15);
        }

        .close-button {
          background: none;
          border: none;
          color: rgba(90, 122, 107, 0.4);
          cursor: pointer;
          padding: 0.25rem;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          color: var(--forest);
          transform: rotate(90deg);
        }

        @media (max-width: 768px) {
          nav {
            padding: 1.25rem 1.5rem;
          }

          main {
            padding: 2rem 1.5rem 6rem;
          }

          .alert-popup {
            width: calc(100% - 3rem);
            right: 1.5rem;
          }

          .logo-text {
            font-size: 1.5rem;
          }

          .nav-user-name {
            display: none;
          }
        }
      `}</style>

      {/* 🔔 REAL-TIME POPUP */}
      <AnimatePresence>
        {newAlert && (
          <motion.div 
            initial={{ opacity: 0, x: 100, scale: 0.9 }} 
            animate={{ opacity: 1, x: 0, scale: 1 }} 
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="alert-popup"
          >
            <div className="flex justify-between items-start mb-5">
              <div className="alert-icon">
                <BellRing size={22} />
              </div>
              <button onClick={() => setNewAlert(null)} className="close-button">
                <X size={22} />
              </button>
            </div>
            <h4 className="alert-title mb-2">Incoming Request!</h4>
            <p className="alert-text">
              <strong>{newAlert.hospital?.name}</strong> is requesting 
              <strong> {newAlert.bloodGroup}</strong> blood immediately.
            </p>
            <div className="alert-buttons">
              <button className="alert-accept">Accept</button>
              <button onClick={() => setNewAlert(null)} className="alert-ignore">Ignore</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav>
        <div className="logo-container" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <Droplets className="text-cream" size={26} />
          </div>
          <span className="logo-text">RescueBlood</span>
        </div>
        
        <div className="flex items-center gap-6">
          {userRole !== "guest" ? (
            <div className="nav-user">
              <p className="nav-user-name">{localStorage.getItem("userName")}</p>
              <button onClick={handleLogout} className="nav-button">
                <LogOut size={22}/>
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="signin-button">
              Sign In
            </button>
          )}
        </div>
      </nav>

      <main>
        {userRole === "donor" && <DonorView />}
        {userRole === "hospital" && <HospitalView />}
        {userRole === "guest" && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-center space-y-16 py-24"
          >
            <div>
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="text-7xl md:text-9xl font-display font-bold text-forest leading-[0.85] tracking-tight mb-6"
              >
                Kindness in
              </motion.h1>
              <motion.h1 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-7xl md:text-9xl font-display font-bold text-crimson leading-[0.85] tracking-tight mb-8"
              >
                Every Drop
              </motion.h1>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.8, duration: 0.8 }}
                className="w-48 h-2 bg-gradient-to-r from-crimson via-terracotta to-sage mx-auto rounded-full"
              ></motion.div>
            </div>
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1, duration: 0.8 }}
              onClick={() => navigate('/auth')} 
              className="cta-button"
              style={{ fontSize: '1.1rem', padding: '1.5rem 3rem' }}
            >
              Start Saving Lives
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
};

// Sub-components
const ImpactCard = ({ icon, count, label }) => (
  <div className="organic-card text-center min-w-[200px] group hover:scale-105 transition-all duration-500">
    <div className="mb-5 p-4 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-sm inline-block group-hover:shadow-md transition-shadow">
      {icon}
    </div>
    <div className="text-5xl font-display font-bold text-forest tracking-tight mb-2">{count}</div>
    <div className="text-[9px] font-body font-bold text-sage/60 uppercase tracking-[0.25em]">{label}</div>
  </div>
);

const HospitalCard = ({ hospital, type, units, time, status }) => {
  const colors = { 
    high: 'from-crimson to-red-700', 
    medium: 'from-terracotta to-orange-600', 
    low: 'from-sage to-emerald-700' 
  };
  
  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="organic-card relative overflow-hidden group cursor-pointer"
    >
      <div className={`absolute top-0 right-0 px-6 py-2.5 text-[9px] font-body font-black uppercase text-white tracking-[0.2em] bg-gradient-to-r ${colors[status] || 'from-slate-400 to-slate-500'} rounded-bl-3xl`}>
        {status}
      </div>
      
      <div className="flex items-center gap-4 mb-8 mt-3">
        <div className="bg-gradient-to-br from-stone-50 to-stone-100 p-5 rounded-3xl group-hover:from-red-50 group-hover:to-red-100 transition-all duration-500">
          <Hospital className="text-sage group-hover:text-crimson transition-colors duration-500" size={32} />
        </div>
        <div>
          <h3 className="font-display font-bold text-2xl text-forest leading-none mb-2">{hospital}</h3>
          <p className="text-[9px] font-body font-bold text-sage/60 uppercase tracking-[0.2em]">{time}</p>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-stone-50 to-stone-100 rounded-3xl p-8 flex justify-between items-center mb-8 group-hover:from-red-50 group-hover:to-red-100 transition-all duration-500">
        <div>
          <p className="text-[9px] font-body font-black text-sage/50 mb-2 tracking-[0.2em]">BLOOD GROUP</p>
          <p className="text-6xl font-display font-bold text-crimson tracking-tighter">{type}</p>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-body font-black text-sage/50 mb-2 tracking-[0.2em]">REQUIRED</p>
          <p className="text-5xl font-display font-bold text-forest tracking-tighter">{units}</p>
        </div>
      </div>
      
      <button className="w-full bg-gradient-to-r from-forest to-emerald-900 text-cream py-5 rounded-3xl font-body font-black hover:from-crimson hover:to-red-700 transition-all duration-500 shadow-lg hover:shadow-2xl hover:shadow-crimson/20 uppercase tracking-[0.1em] text-sm">
        I'm Available
      </button>
    </motion.div>
  );
};

export default RescueBlood;