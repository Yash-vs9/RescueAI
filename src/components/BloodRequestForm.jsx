import React, { useState, useEffect } from "react";
import { 
  Droplets, MapPin, AlertCircle, PlusCircle, Loader2, Send, Info, 
  Activity, Heart, Clock, ChevronLeft, Zap, Shield, Users
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

const BloodRequestForm = ({ onSuccess }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  const [rateLimitWarning, setRateLimitWarning] = useState(null);
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

  // Safe state update helper
  const handleInputChange = (field, value) => {
    setRequestData(prev => ({
      ...prev,
      [field]: value
    }));
  };

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
  }, []);

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
      description: requestData.address, // Add description field
      location: {
        address: requestData.address,
        coordinates: [Number(requestData.lng), Number(requestData.lat)],
      },
    };

    try {
      // FIXED: Changed endpoint from /api/blood-requests to /api/blood-requests/create
      const response = await fetch(`${API_URL}/api/blood-requests/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log("📦 Response:", data);

      // ADD THESE 3 LINES HERE:
      if (data.rateLimitWarning) {
        setRateLimitWarning(data.rateLimitWarning);
      }

      if (response.ok && data.success) {
        setSuccess(true);
        if (onSuccess) onSuccess(data.request);
        
        // Reset form
        setRequestData(prev => ({ 
          ...prev, 
          bloodGroup: "", 
          units: "", 
          address: "",
          urgency: "medium"
        }));
        
        //setRateLimitWarning(null); // ADD THIS LINE TO CLEAR WARNING ON SUCCESS
        
        // Redirect after 2 seconds
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setError(data.message || "Failed to broadcast request.");
      }
    } catch (err) {
      console.error("❌ Submit error:", err);
      setError("Server error. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="blood-request-page">
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
          margin: 0;
          padding: 0;
        }

        .blood-request-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
          position: relative;
          overflow-x: hidden;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        .blood-request-page::before {
          content: '';
          position: fixed;
          top: -30%;
          left: -20%;
          width: 800px;
          height: 800px;
          background: radial-gradient(circle, rgba(193, 64, 61, 0.12) 0%, transparent 70%);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: morph-float 20s ease-in-out infinite;
          filter: blur(80px);
          z-index: 0;
          pointer-events: none;
        }

        .blood-request-page::after {
          content: '';
          position: fixed;
          bottom: -30%;
          right: -20%;
          width: 900px;
          height: 900px;
          background: radial-gradient(circle, rgba(90, 122, 107, 0.1) 0%, transparent 70%);
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: morph-float 25s ease-in-out infinite reverse;
          filter: blur(90px);
          z-index: 0;
          pointer-events: none;
        }

        @keyframes morph-float {
          0%, 100% {
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
            transform: translate(0, 0) rotate(0deg);
          }
          25% {
            border-radius: 60% 40% 50% 50% / 30% 60% 40% 70%;
            transform: translate(50px, -50px) rotate(90deg);
          }
          50% {
            border-radius: 50% 50% 30% 70% / 50% 50% 70% 30%;
            transform: translate(0, -80px) rotate(180deg);
          }
          75% {
            border-radius: 30% 70% 60% 40% / 60% 30% 50% 50%;
            transform: translate(-50px, -40px) rotate(270deg);
          }
        }

        .particle {
          position: fixed;
          border-radius: 50%;
          opacity: 0.15;
          pointer-events: none;
          z-index: 0;
        }

        .particle-1 {
          top: 15%;
          left: 10%;
          width: 120px;
          height: 120px;
          background: var(--crimson);
          animation: float-1 15s ease-in-out infinite;
        }

        .particle-2 {
          top: 60%;
          right: 15%;
          width: 180px;
          height: 180px;
          background: var(--sage);
          animation: float-2 18s ease-in-out infinite;
        }

        .particle-3 {
          bottom: 20%;
          left: 20%;
          width: 100px;
          height: 100px;
          background: var(--terracotta);
          animation: float-3 12s ease-in-out infinite;
        }

        @keyframes float-1 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-60px) scale(1.2); }
        }

        @keyframes float-2 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(70px) scale(0.9); }
        }

        @keyframes float-3 {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-40px) scale(1.1); }
        }

        .texture-overlay {
          position: fixed;
          inset: 0;
          background-image: 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F4538' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
          z-index: 0;
        }

        .page-content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .page-header {
          padding: 2rem 2.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          backdrop-filter: blur(20px);
          background: rgba(253, 248, 243, 0.7);
          border-bottom: 2px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 5px 30px rgba(47, 69, 56, 0.05);
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 0.625rem;
          padding: 0.875rem 1.5rem;
          background: rgba(255, 255, 255, 0.8);
          color: var(--sage);
          border-radius: 20px;
          border: 2px solid rgba(90, 122, 107, 0.15);
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .back-button:hover {
          background: white;
          color: var(--crimson);
          transform: translateX(-5px);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15);
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }

        .logo-icon {
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          padding: 0.75rem;
          border-radius: 20px;
          transform: rotate(3deg);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.3);
          transition: all 0.4s ease;
        }

        .logo-icon:hover {
          transform: rotate(-3deg) scale(1.1);
        }

        .logo-text {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 800;
          color: var(--crimson);
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .main-content {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 3rem;
          padding: 3rem 2.5rem;
          max-width: 1600px;
          margin: 0 auto;
          width: 100%;
        }

        .info-panel {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .hero-section {
          animation: fadeInUp 0.8s ease;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .hero-title {
          font-family: 'Crimson Pro', serif;
          font-size: 4rem;
          font-weight: 800;
          color: var(--forest);
          line-height: 0.95;
          margin-bottom: 1.5rem;
          letter-spacing: -0.02em;
        }

        .hero-title .highlight {
          color: var(--crimson);
          display: block;
        }

        .hero-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          color: var(--sage);
          line-height: 1.7;
          font-weight: 500;
          max-width: 500px;
          margin-bottom: 2.5rem;
        }

        .status-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.75rem;
          background: rgba(193, 64, 61, 0.08);
          border: 2px solid rgba(193, 64, 61, 0.15);
          border-radius: 25px;
          animation: pulse-border 2s ease-in-out infinite;
        }

        @keyframes pulse-border {
          0%, 100% {
            border-color: rgba(193, 64, 61, 0.15);
            box-shadow: 0 0 0 0 rgba(193, 64, 61, 0.2);
          }
          50% {
            border-color: rgba(193, 64, 61, 0.3);
            box-shadow: 0 0 0 8px rgba(193, 64, 61, 0);
          }
        }

        .status-dot {
          position: relative;
          width: 12px;
          height: 12px;
        }

        .status-dot::before {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--crimson);
          border-radius: 50%;
          animation: ping 1.5s ease-in-out infinite;
        }

        .status-dot::after {
          content: '';
          position: absolute;
          inset: 0;
          background: var(--crimson);
          border-radius: 50%;
        }

        @keyframes ping {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }

        .status-text {
          font-family: 'Outfit', sans-serif;
          font-size: 0.8rem;
          font-weight: 800;
          color: var(--crimson);
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 1.5rem;
          margin-top: 1rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 35px;
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 15px 40px rgba(47, 69, 56, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          animation: fadeInUp 0.8s ease;
        }

        .stat-card:nth-child(2) {
          animation-delay: 0.1s;
        }

        .stat-card:nth-child(3) {
          animation-delay: 0.2s;
        }

        .stat-card:nth-child(4) {
          animation-delay: 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 25px 60px rgba(47, 69, 56, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .stat-icon {
          width: 3rem;
          height: 3rem;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 1.25rem;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon {
          transform: scale(1.1) rotate(5deg);
        }

        .stat-value {
          font-family: 'Crimson Pro', serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--forest);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          opacity: 0.7;
        }

        .form-container {
          animation: fadeInUp 0.8s ease 0.2s both;
        }

        .form-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(30px);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 50px;
          padding: 3.5rem;
          box-shadow: 
            0 30px 80px rgba(47, 69, 56, 0.12),
            0 10px 30px rgba(193, 64, 61, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          position: relative;
          z-index: 20;
        }

        .form-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 50px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.2), rgba(90, 122, 107, 0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
          pointer-events: none;
        }

        .form-card:hover::before {
          opacity: 1;
        }

        .form-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .form-icon-container {
          width: 5rem;
          height: 5rem;
          background: linear-gradient(135deg, var(--crimson) 0%, var(--terracotta) 100%);
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 15px 40px rgba(193, 64, 61, 0.3);
          animation: pulse-rotate 3s ease-in-out infinite;
        }

        @keyframes pulse-rotate {
          0%, 100% {
            transform: rotate(3deg) scale(1);
          }
          50% {
            transform: rotate(-3deg) scale(1.05);
          }
        }

        .form-title {
          font-family: 'Crimson Pro', serif;
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--forest);
          margin-bottom: 0.75rem;
        }

        .form-description {
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          color: var(--sage);
          font-weight: 500;
        }

        .input-group {
          margin-bottom: 2rem;
          position: relative;
          z-index: 25;
        }

        .input-label {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.75rem;
          margin-left: 0.5rem;
          opacity: 0.7;
        }

        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(90, 122, 107, 0.15);
          border-radius: 25px;
          padding: 1.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 1rem;
          font-weight: 700;
          color: var(--forest);
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          z-index: 30;
        }

        .input-field:focus {
          background: white;
          border-color: var(--crimson);
          box-shadow: 
            0 0 0 4px rgba(193, 64, 61, 0.1),
            0 5px 20px rgba(193, 64, 61, 0.1);
          transform: translateY(-2px);
        }

        .select-wrapper {
          position: relative;
        }

        .select-icon {
          position: absolute;
          right: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--crimson);
          pointer-events: none;
          opacity: 0.6;
          z-index: 31;
        }

        .urgency-selector {
          display: flex;
          background: rgba(90, 122, 107, 0.08);
          padding: 0.75rem;
          border-radius: 25px;
          gap: 0.75rem;
        }

        .urgency-button {
          flex: 1;
          padding: 1.25rem;
          border-radius: 20px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          cursor: pointer;
          background: transparent;
          color: var(--sage);
          position: relative;
          overflow: hidden;
        }

        .urgency-button.active {
          background: white;
          color: var(--crimson);
          border-color: rgba(193, 64, 61, 0.2);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.2);
          transform: scale(1.02);
        }

        .location-input-wrapper {
          position: relative;
        }

        .location-icon {
          position: absolute;
          left: 1.5rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--crimson);
          z-index: 31;
          pointer-events: none;
        }

        .location-input {
          padding-left: 4rem;
        }

        .message-box {
          padding: 1.25rem 1.75rem;
          border-radius: 25px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 2rem;
        }

        .message-error {
          background: rgba(193, 64, 61, 0.1);
          color: var(--crimson);
          border: 2px solid rgba(193, 64, 61, 0.2);
        }

        .message-success {
          background: rgba(90, 122, 107, 0.1);
          color: var(--sage);
          border: 2px solid rgba(90, 122, 107, 0.2);
        }

        .submit-button {
          width: 100%;
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          color: white;
          padding: 1.75rem;
          border-radius: 28px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 1rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border: none;
          cursor: pointer;
          box-shadow: 0 20px 50px rgba(193, 64, 61, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.4s;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 25px 60px rgba(193, 64, 61, 0.4);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .security-note {
          text-align: center;
          margin-top: 2rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          font-weight: 700;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          opacity: 0.5;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        @media (max-width: 1024px) {
          .main-content { grid-template-columns: 1fr; gap: 2rem; }
          .hero-title { font-size: 3rem; }
          .stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        @media (max-width: 768px) {
          .page-header { padding: 1.5rem; }
          .main-content { padding: 2rem 1.5rem; }
          .form-card { padding: 2.5rem; border-radius: 40px; }
          .hero-title { font-size: 2.5rem; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .logo-text { display: none; }
        }
      `}</style>

      <div className="particle particle-1"></div>
      <div className="particle particle-2"></div>
      <div className="particle particle-3"></div>
      <div className="texture-overlay"></div>

      <div className="page-content">
        <header className="page-header">
          <button onClick={() => navigate('/')} className="back-button">
            <ChevronLeft size={20} />
            <span>Back to Dashboard</span>
          </button>

          <div className="logo-section">
            <div className="logo-icon">
              <Droplets className="text-white" size={28} />
            </div>
            <span className="logo-text">RescueBlood</span>
          </div>
        </header>

        <main className="main-content">
          <div className="info-panel">
            <div className="hero-section">
              <h1 className="hero-title">
                Broadcast
                <span className="highlight">Emergency Request</span>
              </h1>
              
              <p className="hero-subtitle">
                Your urgent blood request will be instantly transmitted to all available donors within a 50km radius of your facility through our real-time notification system.
              </p>

              <div className="status-indicator">
                <div className="status-dot"></div>
                <span className="status-text">System Active</span>
              </div>
            </div>

            <div className="stats-grid">
              <motion.div 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(193, 64, 61, 0.1), rgba(224, 120, 86, 0.1))' }}>
                  <Activity className="text-crimson" size={24} />
                </div>
                <div className="stat-value">Real-time</div>
                <div className="stat-label">Notification</div>
              </motion.div>

              <motion.div 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(90, 122, 107, 0.1), rgba(52, 211, 153, 0.1))' }}>
                  <Users className="text-sage" size={24} />
                </div>
                <div className="stat-value">50km</div>
                <div className="stat-label">Coverage</div>
              </motion.div>

              <motion.div 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(224, 120, 86, 0.1), rgba(251, 146, 60, 0.1))' }}>
                  <Clock className="text-terracotta" size={24} />
                </div>
                <div className="stat-value">&lt;2min</div>
                <div className="stat-label">Response</div>
              </motion.div>

              <motion.div 
                className="stat-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="stat-icon" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(167, 139, 250, 0.1))' }}>
                  <Shield className="text-purple-600" size={24} />
                </div>
                <div className="stat-value">Secure</div>
                <div className="stat-label">Encrypted</div>
              </motion.div>
            </div>
          </div>

          <div className="form-container">
            <div className="form-card">
              <div className="form-header">
                <div className="form-icon-container">
                  <Droplets size={40} className="text-white" />
                </div>
                <h2 className="form-title">Request Details</h2>
                <p className="form-description">Fill in the emergency information below</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                  <div className="input-group">
                    <label className="input-label">Blood Group</label>
                    <div className="select-wrapper">
                      <select 
                        name="bloodGroup" 
                        required 
                        value={requestData.bloodGroup} 
                        onChange={(e) => handleInputChange('bloodGroup', e.target.value)} 
                        className="input-field"
                        style={{ appearance: 'none', cursor: 'pointer' }}
                      >
                        <option value="">Select Type</option>
                        {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map(bg => 
                          <option key={bg} value={bg}>{bg}</option>
                        )}
                      </select>
                      <div className="select-icon">
                        <Droplets size={20} />
                      </div>
                    </div>
                  </div>

                  <div className="input-group">
                    <label className="input-label">Units (ml)</label>
                    <input 
                      type="number" 
                      name="units" 
                      required 
                      min="1" 
                      placeholder="450"
                      value={requestData.units} 
                      onChange={(e) => handleInputChange('units', e.target.value)} 
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Urgency Level</label>
                  <div className="urgency-selector">
                    {["low", "medium", "high"].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => handleInputChange('urgency', level)}
                        className={`urgency-button ${requestData.urgency === level ? 'active' : ''}`}
                      >
                        <span>{level}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Ward / Department Details</label>
                  <div className="location-input-wrapper">
                    <MapPin className="location-icon" size={22} />
                    <input 
                      name="address" 
                      required 
                      placeholder="e.g. ICU, Wing B, Room 402" 
                      value={requestData.address} 
                      onChange={(e) => handleInputChange('address', e.target.value)} 
                      className="input-field location-input"
                    />
                  </div>
                </div>

               <AnimatePresence mode="wait">
                  {error && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="message-box message-error"
                    >
                      <AlertCircle size={20} />
                      <span>{error}</span>
                    </motion.div>
                  )}

                  {/* SHOW WARNING FIRST - BEFORE SUCCESS */}
                  {rateLimitWarning && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="message-box"
                      style={{
                        background: 'rgba(251, 146, 60, 0.1)',
                        color: '#ea580c',
                        border: '2px solid rgba(251, 146, 60, 0.2)',
                        marginBottom: success ? '1rem' : '0'
                      }}
                    >
                      <Info size={20} />
                      <span>
                        ⚠️ Rate Limit: {rateLimitWarning.totalRequests}/5 requests used. {rateLimitWarning.message}
                      </span>
                    </motion.div>
                  )}
                  
                  {success && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10 }} 
                      animate={{ opacity: 1, y: 0 }} 
                      exit={{ opacity: 0, y: -10 }}
                      className="message-box message-success"
                    >
                      <Send size={20} />
                      <span>✅ Broadcast Dispatched! Redirecting...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* REMOVED THE DUPLICATE WARNING CODE HERE */}

                <button 
                  disabled={loading || locationLoading} 
                  type="submit" 
                  className="submit-button"
                >
                  {loading || locationLoading ? (
                    <>
                      <Loader2 className="animate-spin" size={24} />
                      <span>{locationLoading ? "Syncing GPS..." : "Notifying Donors..."}</span>
                    </>
                  ) : (
                    <>
                      <Zap size={24} />
                      <span>Send Emergency Request</span>
                    </>
                  )}
                </button>

                <div className="security-note">
                  <Shield size={14} />
                  <span>End-to-End Encrypted</span>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
export default BloodRequestForm;