import React, { useState, useEffect } from "react";
import { Droplets, MapPin, AlertCircle, PlusCircle, Loader2, Send, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const BloodRequestForm = ({ onSuccess }) => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [locationLoading, setLocationLoading] = useState(true);

  const [requestData, setRequestData] = useState({
    bloodGroup: "",
    units: "",
    urgency: "medium",
    address: "",
    lat: localStorage.getItem("userLat") || null,
    lng: localStorage.getItem("userLng") || null,
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setRequestData((prev) => ({ ...prev, lat: latitude, lng: longitude }));
          setLocationLoading(false);
        },
        () => {
          if (requestData.lat) setLocationLoading(false);
          else {
            setError("Location access required for alerts.");
            setLocationLoading(false);
          }
        }
      );
    }
  }, [requestData.lat]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!requestData.lat || !requestData.lng) {
      setError("Waiting for location sync...");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      bloodGroup: requestData.bloodGroup,
      units: Number(requestData.units),
      urgency: requestData.urgency,
      location: {
        address: requestData.address,
        coordinates: [Number(requestData.lng), Number(requestData.lat)],
      },
    };

    try {
      const response = await fetch(`${API_URL}/api/blood-requests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        if (onSuccess) onSuccess(data.request);
        setRequestData(prev => ({ ...prev, bloodGroup: "", units: "", address: "" }));
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(data.error || "Failed to broadcast request.");
      }
    } catch (err) {
      setError("Server error. Ensure backend is on port 3000.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Organic Blobs */}
      <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, 50, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-20 -left-20 w-96 h-96 bg-red-100/50 rounded-full blur-3xl" 
        />
        <motion.div 
          animate={{ scale: [1.2, 1, 1.2], x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-20 -right-20 w-96 h-96 bg-rose-100/50 rounded-full blur-3xl" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        className="w-full max-w-xl bg-white/60 backdrop-blur-3xl p-8 md:p-12 rounded-[50px] border border-white/40 shadow-[0_32px_64px_-12px_rgba(220,38,38,0.1)] relative"
      >
        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-[30px] rotate-12 flex items-center justify-center shadow-2xl shadow-red-200 mb-6 group hover:rotate-0 transition-transform duration-500">
            <Droplets className="text-white w-10 h-10 group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-2">Emergency Hub</h2>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-red-50 rounded-full border border-red-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-[10px] font-black text-red-600 uppercase tracking-widest">Broadcasting Live</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Blood Group Picker */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Blood Group</label>
              <div className="relative group">
                <select 
                  name="bloodGroup" 
                  required 
                  value={requestData.bloodGroup} 
                  onChange={(e) => setRequestData({...requestData, bloodGroup: e.target.value})} 
                  className="w-full bg-white/50 border-2 border-slate-100 rounded-[25px] p-5 focus:border-red-400 focus:bg-white outline-none font-black text-slate-700 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Type</option>
                  {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-red-400">
                  <Droplets size={18} />
                </div>
              </div>
            </div>

            {/* Units Input */}
            <div className="space-y-3">
              <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Units (ml)</label>
              <input 
                type="number" 
                name="units" 
                required 
                min="1" 
                placeholder="450"
                value={requestData.units} 
                onChange={(e) => setRequestData({...requestData, units: e.target.value})} 
                className="w-full bg-white/50 border-2 border-slate-100 rounded-[25px] p-5 focus:border-red-400 focus:bg-white outline-none font-black transition-all" 
              />
            </div>
          </div>

          {/* Urgency - Custom Organic Buttons */}
          <div className="space-y-4">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Urgency Level</label>
            <div className="flex bg-slate-100/50 p-2 rounded-[30px] gap-2">
              {["low", "medium", "high"].map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setRequestData({ ...requestData, urgency: level })}
                  className={`flex-1 py-4 rounded-[22px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                    requestData.urgency === level 
                    ? "bg-white text-red-600 shadow-xl shadow-red-100 scale-[1.02]" 
                    : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Location details */}
          <div className="space-y-3">
            <label className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ward / Dept Details</label>
            <div className="relative">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-red-400" size={20} />
              <input 
                name="address" 
                required 
                placeholder="e.g. ICU, Wing B, Room 402" 
                value={requestData.address} 
                onChange={(e) => setRequestData({...requestData, address: e.target.value})} 
                className="w-full bg-white/50 border-2 border-slate-100 rounded-[25px] p-5 pl-14 focus:border-red-400 focus:bg-white outline-none font-medium transition-all" 
              />
            </div>
          </div>

          {/* Error/Success Feedbacks */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-red-500 bg-red-50/50 backdrop-blur-sm p-4 rounded-[25px] border border-red-100 flex items-center gap-3 text-xs font-bold px-6">
                <AlertCircle size={18} /> {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="text-emerald-600 bg-emerald-50/50 backdrop-blur-sm p-4 rounded-[25px] border border-emerald-100 flex items-center gap-3 text-xs font-bold px-6">
                <Send size={18} /> Broadcast Dispatched Successfully!
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <button 
            disabled={loading || locationLoading} 
            type="submit" 
            className="group w-full relative overflow-hidden bg-red-600 text-white py-6 rounded-[30px] font-black shadow-2xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
          >
            <div className="relative z-10 flex items-center justify-center gap-3 text-sm uppercase tracking-[0.2em]">
              {loading || locationLoading ? <Loader2 className="animate-spin" size={24} /> : <PlusCircle size={24} />}
              {locationLoading ? "Syncing GPS..." : loading ? "Notifying Donors..." : "Send Request"}
            </div>
            {/* Animated Hover Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-rose-700 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>
        </form>

        <p className="mt-8 text-center text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
          End-to-End Encrypted Verification
        </p>
      </motion.div>
    </div>
  );
};

export default BloodRequestForm;