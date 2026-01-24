import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Heart, Plus, Droplets, Hospital, Search, Share2, Activity, Users,
  ShieldCheck, PlusCircle, History, Bell, LogOut, MapPin, Loader2, RefreshCcw, X, BellRing,
  Clock, AlertCircle, CheckCircle, Navigation, Calendar, Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { io } from "socket.io-client";
import DonationConfirmationModal from './components/DonationConfirmationModal';

const RescueBlood = () => {
  const RENDER_URL = "https://rescueai-1.onrender.com";
  const apiUrl = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [emergencies, setEmergencies] = useState([]);
  const [hospitalRequests, setHospitalRequests] = useState([]); // Hospital's own requests
  const [acceptedDonors, setAcceptedDonors] = useState([]); // Only donors who accepted
  const [isAvailable, setIsAvailable] = useState(true);
  const [newAlert, setNewAlert] = useState(null);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);

  const [coords, setCoords] = useState({
    lat: localStorage.getItem("userLat") || null,
    lng: localStorage.getItem("userLng") || null
  });

  const userRole = localStorage.getItem("role") || "guest";
  const token = localStorage.getItem("token");

  const hasInitializedDonorFetch = useRef(false);
  const hasInitializedHospitalFetch = useRef(false);

  useEffect(() => {
    const fetchAvailability = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/user/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setIsAvailable(data.user.isAvailable);
        }
      } catch (err) {
        console.error("Failed to fetch availability", err);
      }
    };
    if (token) fetchAvailability();
  }, [apiUrl, token]);

  // GEOLOCATION
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

  // SOCKET INTEGRATION - FIXED FOR BOTH DONOR AND HOSPITAL
  useEffect(() => {
    if (!token) return;

    const socket = io(RENDER_URL, {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => console.log("📡 Connected to Render WebSocket"));

    // DONOR: Listen for blood requests
    if (userRole === "donor") {
      socket.on("blood_request", (data) => {
        console.log("🔔 New Emergency Received:", data);
        
        // Add to emergencies feed
        setEmergencies((prev) => {
          const exists = prev.find(e => e._id === data._id || e._id === data.requestId);
          if (exists) return prev;
          return [data, ...prev];
        });
        
        // Show popup notification
        setNewAlert(data);
      });

      socket.on("donation_confirmed", (data) => {
        console.log("✅ Donation Confirmed:", data);
        alert(`Thank you! ${data.hospitalName} confirmed your donation of ${data.units}ml.`);
      });
    }

    // HOSPITAL: Listen for donor acceptances
    if (userRole === "hospital") {
      socket.on("donor_accepted", (data) => {
        console.log("✅ Donor Accepted Request:", data);
        
        // Update the request in hospitalRequests
        setHospitalRequests((prev) =>
          prev.map((req) =>
            req._id === data.requestId
              ? { ...req, acceptedDonor: data.donor, status: "in_progress", acceptedAt: data.acceptedAt }
              : req
          )
        );

        // Add to accepted donors
        setAcceptedDonors((prev) => {
          const exists = prev.find(d => d._id === data.donor._id);
          if (!exists) {
            return [...prev, { ...data.donor, requestId: data.requestId, acceptedAt: data.acceptedAt }];
          }
          return prev;
        });

        alert(`Good news! ${data.donor.name} (${data.donor.bloodGroup}) has accepted your blood request!`);
      });
    }

    socket.on("connect_error", (err) => {
      console.error("Socket Connection Error:", err.message);
    });

    return () => socket.disconnect();
  }, [token, userRole, RENDER_URL]);

  // API CALLS
  const fetchNearbyRequests = useCallback(async () => {
    if (userRole !== "donor" || !coords.lat || !coords.lng) return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/blood-requests/nearby?lat=${coords.lat}&lng=${coords.lng}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("📋 Nearby Requests:", data);
      if (data.success) setEmergencies(data.requests);
    } catch (err) {
      console.error("Fetch Emergencies Failed", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, coords.lat, coords.lng, token, apiUrl]);

  const fetchHospitalRequests = useCallback(async () => {
    if (userRole !== "hospital") return;
    setLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/blood-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("📋 My Requests:", data);
      if (data.success) {
        setHospitalRequests(data.requests || []);
      }
    } catch (err) {
      console.error("Fetch Hospital Requests Failed", err);
    } finally {
      setLoading(false);
    }
  }, [userRole, token, apiUrl]);

  const fetchAcceptedDonors = useCallback(async () => {
    if (userRole !== "hospital") return;
    try {
      const res = await fetch(`${apiUrl}/api/blood-requests/accepted-donors`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      console.log("👥 Accepted Donors:", data);
      if (data.success) {
        setAcceptedDonors(data.donors || []);
      }
    } catch (err) {
      console.error("Fetch Accepted Donors Failed", err);
    }
  }, [userRole, token, apiUrl]);

  const toggleAvailability = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (availabilityLoading) return;

    try {
      setAvailabilityLoading(true);
      const newStatus = !isAvailable;
      setIsAvailable(newStatus);

      const res = await fetch(`${apiUrl}/api/user/availability`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error("Toggle failed");
      }
    } catch (err) {
      console.error("Toggle failed", err);
      setIsAvailable(prev => !prev);
    } finally {
      setAvailabilityLoading(false);
    }
  };

  // Initial fetches
  useEffect(() => {
    if (userRole === "donor" && coords.lat && coords.lng && !hasInitializedDonorFetch.current) {
      hasInitializedDonorFetch.current = true;
      fetchNearbyRequests();
    }
  }, [userRole, coords.lat, coords.lng, fetchNearbyRequests]);

  useEffect(() => {
    if (userRole === "hospital" && coords.lat && coords.lng && !hasInitializedHospitalFetch.current) {
      hasInitializedHospitalFetch.current = true;
      fetchHospitalRequests();
      fetchAcceptedDonors();
    }
  }, [userRole, coords.lat, coords.lng, fetchHospitalRequests, fetchAcceptedDonors]);

  // Accept Blood Request (Donor)
  const handleAcceptRequest = async (requestId) => {
    console.log("🔄 Accepting request:", requestId);
    try {
      const response = await fetch(`${apiUrl}/api/donations/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bloodRequestId: requestId })
      });

      const data = await response.json();
      console.log("📦 Accept Response:", data);

      if (data.success) {
        alert('Blood request accepted successfully! The hospital has been notified.');
        
        setEmergencies(prev =>
          prev.map(req =>
            (req._id === requestId || req.requestId === requestId)
              ? { ...req, status: 'in_progress' }
              : req
          )
        );
      } else {
        alert(data.message || 'Failed to accept request');
      }
    } catch (error) {
      console.error('Accept request error:', error);
      alert('Failed to accept blood request. Please try again.');
    }
  };

  const handleConfirmDonation = async (donation) => {
    console.log('Donation confirmed:', donation);
    alert('Donation confirmed successfully! The donor has been notified.');
    fetchHospitalRequests();
    fetchAcceptedDonors();
  };

  const handleDeleteRequest = async (requestId) => {
    if (!confirm('Are you sure you want to delete this blood request?')) return;

    try {
      const response = await fetch(`${apiUrl}/api/blood-requests/${requestId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await response.json();

      if (data.success) {
        alert('Blood request deleted successfully');
        fetchHospitalRequests();
        fetchAcceptedDonors();
      } else {
        alert(data.message || 'Failed to delete request');
      }
    } catch (error) {
      console.error('Delete request error:', error);
      alert('Failed to delete blood request');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  // --- DONOR VIEW ---
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
              type="button"
              onClick={(e) => toggleAvailability(e)}
              disabled={availabilityLoading}
              className={`w-16 h-9 rounded-full transition-all relative shadow-inner 
                ${isAvailable ? 'bg-gradient-to-r from-sage to-emerald-400' : 'bg-stone-300'}
                ${availabilityLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
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
              <MapPin size={14} className="text-terracotta" />
              {coords.lat ? 'Location Sync Active' : 'Waiting for GPS...'}
            </p>
          </div>
          <button onClick={fetchNearbyRequests} className="organic-button-small group">
            <RefreshCcw size={20} className="group-hover:rotate-180 transition-transform duration-700" />
          </button>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 className="animate-spin text-crimson" size={48} />
          </div>
        ) : emergencies.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, staggerChildren: 0.1 }}
            className="grid md:grid-cols-2 gap-8"
          >
            {emergencies.map((req, index) => (
              <motion.div
                key={req._id || req.requestId}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 + (index * 0.1), duration: 0.6 }}
              >
                <BloodRequestCard request={req} onAccept={handleAcceptRequest} />
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
              <Droplets className="text-sage/20" size={72} />
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

  // --- HOSPITAL VIEW - FIXED TO SHOW ONLY THEIR REQUESTS AND ACCEPTED DONORS ---
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
            <button onClick={() => navigate('/bloodForm')} className="cta-button group/btn">
              <PlusCircle size={24} className="group-hover/btn:rotate-90 transition-transform duration-500" />
              Create Emergency Alert
            </button>
          </div>
          <div className="absolute -right-16 -bottom-16 opacity-20">
            <Droplets size={350} className="text-cream rotate-12" />
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
            count={acceptedDonors.length}
            label="Accepted Donors"
          />
        </motion.div>
      </section>

      {/* MY BLOOD REQUESTS SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="organic-card"
      >
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-display font-bold text-forest">My Blood Requests</h3>
          <button onClick={fetchHospitalRequests} className="organic-button-small">
            <RefreshCcw size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-crimson" size={40} />
          </div>
        ) : hospitalRequests.length > 0 ? (
          <div className="grid gap-6">
            {hospitalRequests.map((request) => (
              <HospitalRequestCard 
                key={request._id} 
                request={request} 
                onDelete={handleDeleteRequest}
                onSelectDonor={(donor) => {
                  setSelectedDonor(donor);
                  setSelectedRequest(request);
                  setShowConfirmModal(true);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sage/60">
            <p>No blood requests yet. Create one to get started!</p>
          </div>
        )}
      </motion.section>

      {/* ACCEPTED DONORS SECTION */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
        className="organic-card"
      >
        <div className="flex justify-between items-center mb-10">
          <h3 className="text-3xl font-display font-bold text-forest">Donors Who Accepted</h3>
          <button onClick={fetchAcceptedDonors} className="organic-button-small">
            <RefreshCcw size={18} />
          </button>
        </div>

        {acceptedDonors.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {acceptedDonors.map((donor) => (
              <motion.div
                key={donor._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="donor-card group cursor-pointer"
                onClick={() => {
                  const request = hospitalRequests.find(r => r._id === donor.requestId);
                  if (request) {
                    setSelectedDonor(donor);
                    setSelectedRequest(request);
                    setShowConfirmModal(true);
                  } else {
                    alert('Unable to find the associated blood request');
                  }
                }}
              >
                <div className="blood-badge group-hover:scale-110 transition-transform duration-300">
                  {donor.bloodGroup}
                </div>
                <p className="font-body font-bold text-forest text-sm mt-4">{donor.name}</p>
                <p className="text-xs text-sage mt-1">{donor.phone}</p>
                <p className="text-xs text-sage/60 mt-2">Click to confirm</p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-sage/60">
            <p>No donors have accepted your requests yet</p>
          </div>
        )}
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

        * { box-sizing: border-box; }

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
            radial-gradient(circle at 80% 70%, rgba(90, 122, 107, 0.08) 0%, transparent 50%);
          animation: breathe 20s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(5deg); }
        }

        .font-display { font-family: 'Crimson Pro', serif; }
        .font-body { font-family: 'Outfit', sans-serif; }
        .text-forest { color: var(--forest); }
        .text-crimson { color: var(--crimson); }
        .text-sage { color: var(--sage); }
        .text-terracotta { color: var(--terracotta); }
        .text-cream { color: var(--cream); }

        .organic-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border-radius: 40px;
          padding: 3rem;
          border: 2px solid rgba(255, 255, 255, 0.8);
          box-shadow: 0 20px 60px rgba(47, 69, 56, 0.08);
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .organic-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 80px rgba(47, 69, 56, 0.12);
        }

        .organic-card-empty {
          background: rgba(255, 255, 255, 0.5);
          backdrop-filter: blur(20px);
          border-radius: 50px;
          padding: 4rem;
          border: 3px dashed rgba(90, 122, 107, 0.2);
        }

        .organic-button-small {
          padding: 0.875rem;
          background: rgba(255, 255, 255, 0.8);
          color: var(--sage);
          border-radius: 20px;
          border: 2px solid rgba(90, 122, 107, 0.1);
          box-shadow: 0 4px 15px rgba(90, 122, 107, 0.1);
          transition: all 0.4s;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .organic-button-small:hover {
          background: white;
          color: var(--crimson);
          transform: translateY(-2px);
        }

        .broadcast-card {
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          border-radius: 45px;
          padding: 3.5rem;
          position: relative;
          overflow: hidden;
          box-shadow: 0 25px 70px rgba(193, 64, 61, 0.3);
          transition: all 0.5s;
        }

        .broadcast-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 35px 90px rgba(193, 64, 61, 0.4);
        }

        .cta-button {
          background: var(--cream);
          color: var(--crimson);
          padding: 1.25rem 2.5rem;
          border-radius: 25px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          transition: all 0.4s;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
        }

        .cta-button:hover {
          transform: translateY(-3px) scale(1.02);
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
          transition: all 0.4s;
          box-shadow: 0 5px 20px rgba(47, 69, 56, 0.05);
        }

        .donor-card:hover {
          background: white;
          transform: translateY(-5px);
          box-shadow: 0 15px 40px rgba(47, 69, 56, 0.12);
        }

        .blood-badge {
          width: 4rem;
          height: 4rem;
          border-radius: 22px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.1), rgba(224, 120, 86, 0.1));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          font-size: 1.25rem;
          color: var(--crimson);
          border: 2px solid rgba(193, 64, 61, 0.2);
          transition: all 0.3s;
        }

        .donor-card:hover .blood-badge {
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: var(--cream);
          border-color: transparent;
        }

        .hospital-request-card {
          padding: 2rem;
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          border-radius: 30px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 10px 30px rgba(47, 69, 56, 0.08);
          transition: all 0.3s;
        }

        .hospital-request-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(47, 69, 56, 0.12);
        }

        .blood-badge-large {
          width: 5rem;
          height: 5rem;
          border-radius: 25px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.15), rgba(224, 120, 86, 0.15));
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          font-size: 1.75rem;
          color: var(--crimson);
          border: 3px solid rgba(193, 64, 61, 0.3);
        }

        .urgency-badge {
          padding: 0.5rem 1rem;
          border-radius: 15px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .urgency-high {
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.15), rgba(193, 64, 61, 0.1));
          color: var(--crimson);
          border: 2px solid rgba(193, 64, 61, 0.2);
        }

        .urgency-medium {
          background: linear-gradient(135deg, rgba(224, 120, 86, 0.15), rgba(224, 120, 86, 0.1));
          color: var(--terracotta);
          border: 2px solid rgba(224, 120, 86, 0.2);
        }

        .urgency-low {
          background: linear-gradient(135deg, rgba(90, 122, 107, 0.15), rgba(90, 122, 107, 0.1));
          color: var(--sage);
          border: 2px solid rgba(90, 122, 107, 0.2);
        }

        .status-badge {
          padding: 0.5rem 1.25rem;
          border-radius: 15px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .status-open {
          background: linear-gradient(135deg, rgba(90, 122, 107, 0.15), rgba(90, 122, 107, 0.1));
          color: var(--sage);
          border: 2px solid rgba(90, 122, 107, 0.2);
        }

        .status-in_progress {
          background: linear-gradient(135deg, rgba(224, 120, 86, 0.15), rgba(224, 120, 86, 0.1));
          color: var(--terracotta);
          border: 2px solid rgba(224, 120, 86, 0.2);
        }

        .status-completed {
          background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.1));
          color: #10b981;
          border: 2px solid rgba(52, 211, 153, 0.2);
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
          transition: transform 0.3s;
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
          transition: all 0.3s;
        }

        .logo-icon:hover {
          transform: rotate(-3deg) scale(1.05);
        }

        .logo-text {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--crimson);
          text-transform: uppercase;
        }

        .nav-user {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-left: 1.5rem;
          border-left: 2px solid rgba(90, 122, 107, 0.2);
        }

        .nav-user-name {
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
          transition: all 0.3s;
          display: flex;
          align-items: center;
          cursor: pointer;
        }

        .nav-button:hover {
          background: white;
          color: var(--crimson);
          transform: translateY(-2px);
        }

        .signin-button {
          background: var(--forest);
          color: var(--cream);
          padding: 1rem 2rem;
          border-radius: 20px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
        }

        .signin-button:hover {
          background: var(--crimson);
          transform: translateY(-2px);
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
          box-shadow: 0 25px 70px rgba(193, 64, 61, 0.25);
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
        }

        .alert-text {
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
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.3s;
        }

        .alert-accept:hover {
          background: #A63634;
          transform: translateY(-2px);
        }

        .alert-ignore {
          flex: 1;
          background: rgba(90, 122, 107, 0.1);
          color: var(--sage);
          padding: 1rem;
          border-radius: 18px;
          font-weight: 800;
          border: none;
          cursor: pointer;
          text-transform: uppercase;
          transition: all 0.3s;
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
          transition: all 0.3s;
        }

        .close-button:hover {
          color: var(--forest);
          transform: rotate(90deg);
        }

        .blood-request-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(25px);
          border-radius: 35px;
          border: 2px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 20px 60px rgba(47, 69, 56, 0.1);
          overflow: hidden;
          transition: all 0.5s;
        }

        .blood-request-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 35px 80px rgba(47, 69, 56, 0.15);
        }

        .request-header {
          padding: 2rem 2rem 1.5rem;
          border-bottom: 2px solid rgba(90, 122, 107, 0.08);
        }

        .request-body {
          padding: 2rem;
        }

        .request-footer {
          padding: 1.5rem 2rem 2rem;
          background: rgba(90, 122, 107, 0.02);
        }

        .hospital-info {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .hospital-avatar {
          background: linear-gradient(135deg, var(--sage), var(--forest));
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 25px rgba(90, 122, 107, 0.25);
        }

        .hospital-details h3 {
          font-family: 'Crimson Pro', serif;
          font-size: 1.4rem;
          font-weight: 800;
          color: var(--forest);
          margin: 0 0 0.25rem;
        }

        .request-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--sage);
          text-transform: uppercase;
        }

        .blood-requirement {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.05), rgba(224, 120, 86, 0.05));
          border-radius: 25px;
          border: 2px solid rgba(193, 64, 61, 0.1);
          margin-bottom: 1.5rem;
        }

        .blood-type-display {
          display: flex;
          align-items: center;
          gap: 1.5rem;
        }

        .blood-icon-large {
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          padding: 1.25rem;
          border-radius: 22px;
          box-shadow: 0 10px 30px rgba(193, 64, 61, 0.3);
        }

        .blood-type-text {
          font-family: 'Crimson Pro', serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--crimson);
          line-height: 1;
        }

        .units-display {
          text-align: right;
        }

        .units-label {
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--sage);
          text-transform: uppercase;
          margin-bottom: 0.5rem;
        }

        .units-value {
          font-family: 'Crimson Pro', serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--forest);
          line-height: 1;
        }

        .description-section {
          margin-bottom: 1.5rem;
        }

        .description-text {
          font-size: 0.95rem;
          line-height: 1.7;
          color: var(--forest);
          font-weight: 500;
        }

        .location-section {
          display: flex;
          align-items: flex-start;
          gap: 1rem;
          padding: 1.5rem;
          background: rgba(90, 122, 107, 0.05);
          border-radius: 20px;
          margin-bottom: 1.5rem;
        }

        .location-icon {
          background: rgba(224, 120, 86, 0.15);
          padding: 0.75rem;
          border-radius: 15px;
          color: var(--terracotta);
        }

        .location-text {
          font-size: 0.9rem;
          color: var(--forest);
          font-weight: 600;
          line-height: 1.5;
        }

        .action-button {
          width: 100%;
          background: linear-gradient(135deg, var(--crimson), #A63634);
          color: white;
          padding: 1.25rem;
          border-radius: 20px;
          border: none;
          font-weight: 800;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 10px 30px rgba(193, 64, 61, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .action-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 15px 40px rgba(193, 64, 61, 0.4);
        }

        .action-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        @media (max-width: 768px) {
          nav { padding: 1.25rem 1.5rem; }
          main { padding: 2rem 1.5rem 6rem; }
          .alert-popup { width: calc(100% - 3rem); right: 1.5rem; }
          .logo-text { font-size: 1.5rem; }
          .nav-user-name { display: none; }
        }
      `}</style>

      {/* REAL-TIME POPUP */}
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
              <strong>{newAlert.hospital?.name || newAlert.hospitalName}</strong> is requesting
              <strong> {newAlert.bloodGroup}</strong> blood immediately.
            </p>
            <div className="alert-buttons">
              <button
                className="alert-accept"
                onClick={() => {
                  handleAcceptRequest(newAlert._id || newAlert.requestId);
                  setNewAlert(null);
                }}
              >
                Accept
              </button>
              <button onClick={() => setNewAlert(null)} className="alert-ignore">
                Ignore
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav className="flex items-center justify-between">
        <div className="logo-container flex items-center gap-2" onClick={() => navigate('/')}>
          <div className="logo-icon">
            <Droplets className="text-cream" size={26} />
          </div>
          <span className="logo-text">RescueBlood</span>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          <button onClick={() => navigate("/map")}>Map</button>
          <button onClick={() => navigate("/chat")}>Chat</button>
        </div>

        <div className="flex items-center gap-6">
          {userRole !== "guest" ? (
            <div className="nav-user flex items-center gap-3">
              <p className="nav-user-name">{localStorage.getItem("userName")}</p>
              <button onClick={handleLogout} className="nav-button">
                <LogOut size={22} />
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
            transition={{ duration: 1 }}
            className="text-center space-y-16 py-24"
          >
            <div>
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 1 }}
                className="text-7xl md:text-9xl font-display font-bold text-forest leading-[0.85] mb-6"
              >
                Kindness in
              </motion.h1>
              <motion.h1
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 1 }}
                className="text-7xl md:text-9xl font-display font-bold text-crimson leading-[0.85] mb-8"
              >
                Every Drop
              </motion.h1>
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

      <DonationConfirmationModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setSelectedDonor(null);
          setSelectedRequest(null);
        }}
        donor={selectedDonor || {}}
        bloodRequest={selectedRequest || {}}
        onConfirm={handleConfirmDonation}
      />
    </div>
  );
};

// Sub-components
const ImpactCard = ({ icon, count, label }) => (
  <div className="organic-card text-center min-w-[200px] group hover:scale-105 transition-all duration-500">
    <div className="mb-5 p-4 bg-gradient-to-br from-white to-stone-50 rounded-2xl shadow-sm inline-block group-hover:shadow-md transition-shadow">
      {icon}
    </div>
    <div className="text-5xl font-display font-bold text-forest mb-2">{count}</div>
    <div className="text-[9px] font-body font-bold text-sage/60 uppercase tracking-[0.25em]">{label}</div>
  </div>
);

const BloodRequestCard = ({ request, onAccept }) => {
  const [isAccepting, setIsAccepting] = useState(false);

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };

  const urgencyColors = {
    high: 'urgency-high',
    medium: 'urgency-medium',
    low: 'urgency-low'
  };

  const urgencyIcons = {
    high: <AlertCircle size={14} />,
    medium: <Clock size={14} />,
    low: <CheckCircle size={14} />
  };

  const handleAcceptClick = async () => {
    setIsAccepting(true);
    await onAccept(request._id || request.requestId);
    setIsAccepting(false);
  };

  return (
    <motion.div whileHover={{ y: -5 }} className="blood-request-card">
      <div className="request-header">
        <div className="hospital-info">
          <div className="hospital-avatar">
            <Hospital className="text-cream" size={24} />
          </div>
          <div className="hospital-details flex-1">
            <h3>{request.hospitalName || 'Hospital'}</h3>
            <div className="request-meta">
              <span className="meta-item">
                <Clock size={12} />
                {getTimeAgo(request.createdAt)}
              </span>
              <span className="meta-item">
                <MapPin size={12} />
                {request.location?.address?.split(',').pop()?.trim() || 'Location'}
              </span>
            </div>
          </div>
          <div className={`urgency-badge ${urgencyColors[request.urgency] || 'urgency-medium'}`}>
            {urgencyIcons[request.urgency] || urgencyIcons.medium}
            {request.urgency}
          </div>
        </div>
      </div>

      <div className="request-body">
        <div className="blood-requirement">
          <div className="blood-type-display">
            <div className="blood-icon-large">
              <Droplets className="text-cream" size={32} />
            </div>
            <div>
              <div className="units-label">Blood Group</div>
              <div className="blood-type-text">{request.bloodGroup}</div>
            </div>
          </div>
          <div className="units-display">
            <div className="units-label">Units Required</div>
            <div className="units-value">{request.units} ml</div>
          </div>
        </div>

        {request.description && (
          <div className="description-section">
            <p className="description-text">{request.description}</p>
          </div>
        )}

        {request.location?.address && (
          <div className="location-section">
            <div className="location-icon">
              <Navigation size={20} />
            </div>
            <div className="location-text">
              {request.location.address}
            </div>
          </div>
        )}
      </div>

      <div className="request-footer">
        <div className="flex items-center justify-between mb-4">
          <div className={`status-badge status-${request.status}`}>
            {request.status === 'open' && <CheckCircle size={14} />}
            {request.status === 'in_progress' && <Clock size={14} />}
            {request.status === 'completed' && <CheckCircle size={14} />}
            {request.status}
          </div>
          <div className="meta-item">
            <Calendar size={12} />
            {new Date(request.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>
        </div>

        <button
          className="action-button"
          onClick={handleAcceptClick}
          disabled={request.status !== 'open' || isAccepting}
        >
          {isAccepting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Accepting...
            </>
          ) : (
            <>
              <Heart size={20} />
              {request.status === 'open' ? 'I Can Help' : request.status === 'in_progress' ? 'In Progress' : 'Completed'}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const HospitalRequestCard = ({ request, onDelete, onSelectDonor }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="hospital-request-card"
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-4 mb-4">
            <div className="blood-badge-large">
              {request.bloodGroup}
            </div>
            <div>
              <div className="text-2xl font-display font-bold text-forest">
                {request.units} ml needed
              </div>
              <div className={`urgency-badge urgency-${request.urgency}`}>
                {request.urgency} priority
              </div>
            </div>
          </div>

          {request.description && (
            <p className="text-sage mb-4">{request.description}</p>
          )}

          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-terracotta" />
              <span className="text-sage font-semibold">
                {new Date(request.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div className={`status-badge status-${request.status}`}>
              {request.status}
            </div>
          </div>

          {request.acceptedDonor && (
            <div className="mt-4 p-4 bg-sage/10 rounded-2xl">
              <p className="text-sm font-bold text-sage mb-2">✅ Accepted by:</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-forest">{request.acceptedDonor.name}</p>
                  <p className="text-sm text-sage">{request.acceptedDonor.phone}</p>
                </div>
                <button
                  onClick={() => onSelectDonor(request.acceptedDonor)}
                  className="organic-button-small"
                >
                  Confirm Donation
                </button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => onDelete(request._id)}
          className="organic-button-small text-crimson hover:bg-crimson/10"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </motion.div>
  );
};

export default RescueBlood;