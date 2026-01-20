import React, { useState, useEffect, useCallback } from 'react';
import { 
  Heart, Plus, Droplets, Hospital, Search, Share2, Activity, Users, 
  ShieldCheck, PlusCircle, History, Bell, LogOut, MapPin, Loader2, RefreshCcw, X, BellRing
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";

const RescueBlood = () => {
  // 1. URL CONFIGURATION
  // Since your Render server (socketServer.js) handles everything, we use its URL
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

  // 3. SOCKET INTEGRATION (Render URL)
  useEffect(() => {
    if (!token || userRole !== "donor") return;
    
    // Connect to the Render URL
    const socket = io(RENDER_URL, { 
      auth: { token },
      transports: ['websocket', 'polling'] // Allow fallback for better connectivity
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

  // 4. API LOGIC (Now pointing to Render)
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
  }, [userRole, coords, token, RENDER_URL]);

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
  }, [userRole, coords, token, RENDER_URL]);

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

  useEffect(() => {
    if (userRole === "donor") fetchNearbyRequests();
    if (userRole === "hospital") fetchNearbyDonors();
  }, [userRole, coords, fetchNearbyRequests, fetchNearbyDonors]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  // --- VIEWS ---

  const DonorView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-16">
      <section className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tight leading-tight">
          Find Someone to <br/><span className="text-red-600">Save Today.</span>
        </h1>
        <div className="flex justify-center gap-6 items-center flex-wrap">
          <ImpactCard icon={<Activity className="text-red-500" />} count="2" label="Lives Saved" />
          <div className="bg-white/70 backdrop-blur-md p-6 rounded-[32px] border border-white/50 shadow-xl flex flex-col items-center">
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Availability</div>
             <button onClick={toggleAvailability} className={`w-14 h-8 rounded-full transition-all relative ${isAvailable ? 'bg-green-500' : 'bg-slate-300'}`}>
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all ${isAvailable ? 'left-7' : 'left-1'}`} />
             </button>
             <span className={`text-[10px] font-bold mt-2 ${isAvailable ? 'text-green-600' : 'text-slate-400'}`}>
                {isAvailable ? 'READY TO HELP' : 'OFFLINE'}
             </span>
          </div>
        </div>
      </section>

      <section id="feed">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900">Emergency Feed</h2>
            <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1 mt-1">
              <MapPin size={12}/> {coords.lat ? 'Location Sync Active' : 'Waiting for GPS...'}
            </p>
          </div>
          <button onClick={fetchNearbyRequests} className="p-3 bg-white text-red-600 rounded-2xl shadow-sm hover:rotate-180 transition-all duration-500">
            <RefreshCcw size={20}/>
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-red-600" size={40}/></div>
        ) : emergencies.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {emergencies.map((req) => (
              <HospitalCard 
                key={req._id || req.requestId}
                hospital={req.hospitalName || req.hospital?.name} 
                type={req.bloodGroup} 
                units={req.units} 
                time="Required Now" 
                status={req.urgency} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-[48px] border-2 border-dashed border-slate-100">
            <Droplets className="mx-auto text-slate-100 mb-4" size={64}/>
            <p className="font-bold text-slate-400 italic">No emergencies found in your 50km radius.</p>
          </div>
        )}
      </section>
    </motion.div>
  );

  const HospitalView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
      <section className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-red-600 rounded-[40px] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-4xl font-black mb-3">Broadcast Need</h2>
            <p className="text-red-100 mb-8 text-lg font-medium max-w-sm">Instantly notify all available donors within 50km of your facility.</p>
            <button onClick={()=>navigate('/bloodForm')} className="bg-white text-red-600 px-8 py-4 rounded-2xl font-black flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
              <PlusCircle size={22}/> Create Emergency Alert
            </button>
          </div>
          <Droplets className="absolute -right-12 -bottom-12 text-red-500 opacity-40 rotate-12" size={300} />
        </div>
        <ImpactCard 
          icon={<Users className="text-blue-500" />} 
          count={nearbyDonors.length} 
          label="Donors Nearby" 
        />
      </section>

      <section className="bg-white rounded-[40px] p-10 border border-slate-50 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-2xl font-black text-slate-900">Available Donors</h3>
          <button onClick={fetchNearbyDonors} className="p-2 bg-slate-50 rounded-xl text-slate-400">
            <RefreshCcw size={18}/>
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {nearbyDonors.map(donor => (
            <div key={donor._id} className="p-5 bg-slate-50 rounded-[32px] border border-slate-100 flex items-center gap-4 group hover:bg-white hover:shadow-xl transition-all">
              <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center font-black text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
                {donor.bloodGroup}
              </div>
              <p className="font-black text-slate-900 text-sm">{donor.name}</p>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-[#fffafa] text-slate-800 font-sans selection:bg-red-200">
      
      {/* 🔔 REAL-TIME POPUP */}
      <AnimatePresence>
        {newAlert && (
          <motion.div 
            initial={{ opacity: 0, x: 100 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 100 }}
            className="fixed top-24 right-6 z-[100] w-85 bg-white rounded-[32px] shadow-2xl border-2 border-red-50 p-6"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="bg-red-500 p-2.5 rounded-2xl text-white shadow-lg animate-bounce"><BellRing size={20} /></div>
              <button onClick={() => setNewAlert(null)}><X size={20} className="text-slate-300 hover:text-slate-900"/></button>
            </div>
            <h4 className="font-black text-slate-900 text-lg mb-1">Incoming Request!</h4>
            <p className="text-sm text-slate-500 font-medium mb-5">
              <span className="text-red-600 font-bold">{newAlert.hospital?.name}</span> is requesting 
              <span className="font-bold text-slate-900"> {newAlert.bloodGroup}</span> blood immediately.
            </p>
            <div className="flex gap-2">
              <button className="flex-1 bg-red-600 text-white py-3 rounded-xl font-black text-xs">Accept</button>
              <button onClick={() => setNewAlert(null)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-black text-xs">Ignore</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex justify-between items-center px-10 py-6 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/40 bg-white/40">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-red-600 p-2 rounded-2xl rotate-3 shadow-lg"><Droplets className="text-white" size={24} /></div>
          <span className="text-2xl font-black tracking-tighter text-red-900 uppercase">RescueBlood</span>
        </div>
        
        <div className="flex items-center gap-6">
          {userRole !== "guest" ? (
            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
              <p className="text-sm font-black text-slate-900 hidden md:block">{localStorage.getItem("userName")}</p>
              <button onClick={handleLogout} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 rounded-2xl transition-all"><LogOut size={22}/></button>
            </div>
          ) : (
            <button onClick={() => navigate('/auth')} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-sm hover:bg-red-600 transition-all">Sign In</button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 pt-12 pb-32">
        {userRole === "donor" && <DonorView />}
        {userRole === "hospital" && <HospitalView />}
        {userRole === "guest" && (
          <div className="text-center space-y-12 py-32">
            <h1 className="text-7xl md:text-9xl font-black text-slate-900 leading-[0.8] tracking-tighter">Kindness in <br/><span className="text-red-600">Every Drop.</span></h1>
            <button onClick={() => navigate('/auth')} className="bg-red-600 text-white px-12 py-5 rounded-[32px] font-black shadow-2xl text-lg">Start Saving Lives</button>
          </div>
        )}
      </main>
    </div>
  );
};

// Sub-components
const ImpactCard = ({ icon, count, label }) => (
  <div className="bg-white/70 backdrop-blur-md p-8 rounded-[40px] border border-white/50 shadow-xl flex flex-col items-center text-center min-w-[180px]">
    <div className="mb-4 p-4 bg-white rounded-2xl shadow-sm">{icon}</div>
    <div className="text-4xl font-black text-slate-900 tracking-tighter">{count}</div>
    <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">{label}</div>
  </div>
);

const HospitalCard = ({ hospital, type, units, time, status }) => {
  const colors = { high: 'bg-red-600', medium: 'bg-orange-500', low: 'bg-blue-600' };
  return (
    <motion.div whileHover={{ y: -10 }} className="bg-white p-8 rounded-[48px] border border-slate-50 shadow-2xl relative overflow-hidden group">
      <div className={`absolute top-0 right-0 px-8 py-2 text-[10px] font-black uppercase text-white tracking-widest ${colors[status] || 'bg-slate-400'}`}>{status}</div>
      <div className="flex items-center gap-4 mb-8">
        <div className="bg-slate-50 p-5 rounded-3xl group-hover:bg-red-50 transition-colors"><Hospital className="text-slate-400 group-hover:text-red-600" size={32} /></div>
        <div><h3 className="font-black text-2xl text-slate-900 leading-none mb-1">{hospital}</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{time}</p></div>
      </div>
      <div className="bg-slate-50 rounded-[32px] p-8 flex justify-between items-center mb-8">
        <div><p className="text-[10px] font-black text-slate-400 mb-1">BLOOD GROUP</p><p className="text-5xl font-black text-red-600 tracking-tighter">{type}</p></div>
        <div className="text-right"><p className="text-[10px] font-black text-slate-400 mb-1">REQUIRED</p><p className="text-4xl font-black text-slate-900 tracking-tighter">{units}</p></div>
      </div>
      <button className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black hover:bg-red-600 transition-all shadow-xl hover:shadow-red-200 uppercase tracking-widest text-sm">I'm Available</button>
    </motion.div>
  );
};

export default RescueBlood;