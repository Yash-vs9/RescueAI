import React, { useState, useEffect } from "react";
import {
  Heart,
  Droplets,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  MapPin,
  Loader2,
  Hospital as HospitalIcon,
  Sparkles
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const RescueBloodAuth = () => {
  const API_URL = import.meta.env.VITE_API_URL;

  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("donor");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    bloodGroup: "",
    city: "",
    lat: null, 
    lng: null,
  });

  // 1. Initialize GPS as soon as the component loads
  useEffect(() => {
    const getInitialCoords = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            setFormData(prev => ({ ...prev, lat: latitude, lng: longitude }));
            localStorage.setItem("userLat", latitude);
            localStorage.setItem("userLng", longitude);
          },
          (error) => {
            console.warn("Location access denied. Using fallback.", error);
            const fallback = { lat: 27.8974, lng: 78.0880 };
            setFormData(prev => ({ ...prev, ...fallback }));
            localStorage.setItem("userLat", fallback.lat);
            localStorage.setItem("userLng", fallback.lng);
          }
        );
      }
    };
    getInitialCoords();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!isLogin && (!formData.lat || !formData.lng)) {
      setMessage({ type: "error", text: "Acquiring location... Please try again in a second." });
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    const payload = isLogin
      ? { email: formData.email, password: formData.password }
      : {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          role: userType,
          bloodGroup: userType === "donor" ? formData.bloodGroup : undefined,
          location: {
            address: formData.city,
            coordinates: [Number(formData.lng), Number(formData.lat)],
          },
        };

    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        if (isLogin) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("userName", data.user.name);

          setMessage({ type: "success", text: "Login successful! Redirecting..." });
          setTimeout(() => navigate("/"), 800);
        } else {
          localStorage.setItem("userLat", formData.lat);
          localStorage.setItem("role", userType);

          setMessage({ type: "success", text: "Account created! Please log in." });
          setIsLogin(true);
        }
      } else {
        setMessage({ type: "error", text: data.message || "Operation failed." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Backend unreachable. Check port 3000." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
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

        .auth-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          position: relative;
          overflow: hidden;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Organic animated background blobs */
        .auth-container::before {
          content: '';
          position: absolute;
          top: -20%;
          left: -10%;
          width: 600px;
          height: 600px;
          background: radial-gradient(circle, rgba(193, 64, 61, 0.15) 0%, transparent 70%);
          border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          animation: morph 15s ease-in-out infinite, float 20s ease-in-out infinite;
          filter: blur(60px);
        }

        .auth-container::after {
          content: '';
          position: absolute;
          bottom: -20%;
          right: -10%;
          width: 700px;
          height: 700px;
          background: radial-gradient(circle, rgba(90, 122, 107, 0.12) 0%, transparent 70%);
          border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          animation: morph 18s ease-in-out infinite reverse, float 25s ease-in-out infinite reverse;
          filter: blur(70px);
        }

        @keyframes morph {
          0%, 100% {
            border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
          }
          25% {
            border-radius: 60% 40% 50% 50% / 30% 60% 40% 70%;
          }
          50% {
            border-radius: 50% 50% 30% 70% / 50% 50% 70% 30%;
          }
          75% {
            border-radius: 30% 70% 60% 40% / 60% 30% 50% 50%;
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0) rotate(0deg);
          }
          33% {
            transform: translate(30px, -30px) rotate(120deg);
          }
          66% {
            transform: translate(-20px, 20px) rotate(240deg);
          }
        }

        /* Additional floating elements */
        .floating-shape {
          position: absolute;
          border-radius: 50%;
          opacity: 0.08;
          animation: float-shape 20s ease-in-out infinite;
        }

        .floating-shape:nth-child(1) {
          top: 10%;
          left: 15%;
          width: 150px;
          height: 150px;
          background: var(--crimson);
          animation-delay: 0s;
        }

        .floating-shape:nth-child(2) {
          top: 60%;
          right: 20%;
          width: 200px;
          height: 200px;
          background: var(--sage);
          animation-delay: -5s;
        }

        .floating-shape:nth-child(3) {
          bottom: 15%;
          left: 25%;
          width: 120px;
          height: 120px;
          background: var(--terracotta);
          animation-delay: -10s;
        }

        @keyframes float-shape {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-40px) scale(1.1);
          }
        }

        /* Texture overlay */
        .texture-overlay {
          position: absolute;
          inset: 0;
          background-image: 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F4538' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.5;
          pointer-events: none;
          z-index: 1;
        }

        .auth-content {
          position: relative;
          z-index: 10;
          width: 100%;
          max-width: 480px;
          animation: slideUp 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .logo-section {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
          cursor: default;
        }

        .logo-icon {
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          padding: 0.875rem;
          border-radius: 22px;
          transform: rotate(3deg);
          box-shadow: 
            0 10px 40px rgba(193, 64, 61, 0.3),
            0 5px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          animation: pulse-logo 3s ease-in-out infinite;
        }

        @keyframes pulse-logo {
          0%, 100% {
            transform: rotate(3deg) scale(1);
          }
          50% {
            transform: rotate(-3deg) scale(1.05);
          }
        }

        .logo-section:hover .logo-icon {
          transform: rotate(-5deg) scale(1.1);
          box-shadow: 
            0 15px 50px rgba(193, 64, 61, 0.4),
            0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .logo-text {
          font-family: 'Crimson Pro', serif;
          font-size: 2rem;
          font-weight: 800;
          color: var(--crimson);
          text-transform: uppercase;
          letter-spacing: -0.02em;
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(30px);
          padding: 3rem;
          border-radius: 45px;
          box-shadow: 
            0 30px 80px rgba(47, 69, 56, 0.12),
            0 10px 30px rgba(193, 64, 61, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(255, 255, 255, 0.8);
          position: relative;
        }

        .auth-card::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: 45px;
          padding: 2px;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.2), rgba(90, 122, 107, 0.2));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .auth-card:hover::before {
          opacity: 1;
        }

        .toggle-container {
          display: flex;
          background: rgba(90, 122, 107, 0.08);
          padding: 0.5rem;
          border-radius: 22px;
          margin-bottom: 2.5rem;
          position: relative;
        }

        .toggle-button {
          flex: 1;
          padding: 1rem;
          border-radius: 18px;
          font-family: 'Outfit', sans-serif;
          font-weight: 700;
          font-size: 0.95rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: none;
          background: transparent;
          color: var(--sage);
          cursor: pointer;
          position: relative;
          z-index: 2;
        }

        .toggle-button.active {
          background: white;
          color: var(--crimson);
          box-shadow: 
            0 5px 20px rgba(193, 64, 61, 0.15),
            0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .message-box {
          margin-bottom: 2rem;
          padding: 1.25rem;
          border-radius: 22px;
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border: 2px solid;
          animation: slideDown 0.4s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .message-success {
          background: rgba(90, 122, 107, 0.1);
          color: var(--sage);
          border-color: rgba(90, 122, 107, 0.3);
        }

        .message-error {
          background: rgba(193, 64, 61, 0.1);
          color: var(--crimson);
          border-color: rgba(193, 64, 61, 0.3);
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .role-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.625rem;
          padding: 1.25rem;
          border-radius: 22px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid;
          cursor: pointer;
          position: relative;
          overflow: hidden;
        }

        .role-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .role-button span,
        .role-button svg {
          position: relative;
          z-index: 1;
        }

        .role-button.inactive {
          background: white;
          color: var(--sage);
          border-color: rgba(90, 122, 107, 0.2);
        }

        .role-button.inactive:hover {
          border-color: rgba(193, 64, 61, 0.3);
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.1);
        }

        .role-button.active {
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          color: white;
          border-color: transparent;
          box-shadow: 
            0 10px 30px rgba(193, 64, 61, 0.3),
            0 5px 15px rgba(0, 0, 0, 0.1);
          transform: scale(1.02);
        }

        .input-group {
          margin-bottom: 1.5rem;
        }

        .input-label {
          display: block;
          font-family: 'Outfit', sans-serif;
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.15em;
          margin-bottom: 0.625rem;
          margin-left: 0.5rem;
          opacity: 0.7;
        }

        .input-wrapper {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          color: var(--sage);
          opacity: 0.4;
          transition: all 0.3s ease;
          z-index: 1;
          pointer-events: none;
        }

        .input-field {
          width: 100%;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(90, 122, 107, 0.15);
          border-radius: 20px;
          padding: 1.25rem 1.25rem 1.25rem 3.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.95rem;
          font-weight: 600;
          color: var(--forest);
          outline: none;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-field::placeholder {
          color: var(--sage);
          opacity: 0.4;
        }

        .input-field:focus {
          background: white;
          border-color: var(--crimson);
          box-shadow: 
            0 0 0 4px rgba(193, 64, 61, 0.1),
            0 5px 20px rgba(193, 64, 61, 0.1);
          transform: translateY(-2px);
        }

        .input-field:focus + .input-icon,
        .input-wrapper:has(.input-field:focus) .input-icon {
          color: var(--crimson);
          opacity: 1;
          transform: translateY(-50%) scale(1.1);
        }

        .password-toggle {
          position: absolute;
          right: 1.25rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--sage);
          opacity: 0.5;
          cursor: pointer;
          padding: 0.25rem;
          transition: all 0.3s ease;
          z-index: 2;
        }

        .password-toggle:hover {
          opacity: 1;
          color: var(--crimson);
          transform: translateY(-50%) scale(1.1);
        }

        .select-field {
  width: 100%;
  background: rgba(255, 255, 255, 0.7);
  border: 2px solid rgba(90, 122, 107, 0.15);
  border-radius: 20px;
  padding: 1.25rem;
  font-family: 'Outfit', sans-serif;
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--forest);
  outline: none;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;

  /* ADD THESE TWO LINES */
  position: relative;
  z-index: 2;

  background-image: url("data:image/svg+xml,...");
  background-repeat: no-repeat;
  background-position: right 1rem center;
  background-size: 20px;
  padding-right: 3rem;
}

        .select-field:focus {
          background-color: white;
          border-color: var(--crimson);
          box-shadow: 
            0 0 0 4px rgba(193, 64, 61, 0.1),
            0 5px 20px rgba(193, 64, 61, 0.1);
          transform: translateY(-2px);
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23C1403D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
        }

        .select-field option {
          background: white;
          color: var(--forest);
          padding: 0.75rem;
        }

        .submit-button {
          width: 100%;
          background: linear-gradient(135deg, var(--crimson) 0%, #A63634 100%);
          color: white;
          padding: 1.5rem;
          border-radius: 24px;
          font-family: 'Outfit', sans-serif;
          font-weight: 800;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          border: none;
          cursor: pointer;
          box-shadow: 
            0 15px 40px rgba(193, 64, 61, 0.3),
            0 5px 15px rgba(0, 0, 0, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
        }

        .submit-button::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.2), transparent);
          transform: translateX(-100%);
          transition: transform 0.6s ease;
        }

        .submit-button:hover::before {
          transform: translateX(100%);
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 
            0 20px 50px rgba(193, 64, 61, 0.4),
            0 8px 20px rgba(0, 0, 0, 0.15);
        }

        .submit-button:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .submit-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .footer-text {
          text-align: center;
          margin-top: 2.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }

        .footer-link {
          color: var(--crimson);
          margin-left: 0.625rem;
          cursor: pointer;
          transition: all 0.3s ease;
          text-decoration: none;
          position: relative;
        }

        .footer-link::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: var(--crimson);
          transition: width 0.3s ease;
        }

        .footer-link:hover::after {
          width: 100%;
        }

        .sparkle-icon {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes sparkle {
          0%, 100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
          50% {
            opacity: 0.5;
            transform: scale(0.8) rotate(180deg);
          }
        }

        @media (max-width: 640px) {
          .auth-card {
            padding: 2rem;
          }

          .logo-text {
            font-size: 1.75rem;
          }

          .auth-content {
            max-width: 100%;
          }

          .submit-button {
            padding: 1.25rem;
          }
        }
      `}</style>

      {/* Floating shapes */}
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>
      <div className="floating-shape"></div>

      {/* Texture overlay */}
      <div className="texture-overlay"></div>

      <div className="auth-content">
        {/* Logo Section */}
        <div className="logo-section">
          <div className="logo-icon">
            <Droplets className="text-white" size={36} />
          </div>
          <span className="logo-text">RescueBlood</span>
        </div>

        {/* Auth Card */}
        <div className="auth-card">
          {/* Login/Register Toggle */}
          <div className="toggle-container">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`toggle-button ${isLogin ? 'active' : ''}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`toggle-button ${!isLogin ? 'active' : ''}`}
            >
              Register
            </button>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`message-box ${message.type === "success" ? "message-success" : "message-error"}`}>
              {message.text}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                {/* User Role Selection */}
                <div className="role-selector">
                  <button
                    type="button"
                    onClick={() => setUserType("donor")}
                    className={`role-button ${userType === "donor" ? 'active' : 'inactive'}`}
                  >
                    <Heart size={18} />
                    <span>Donor</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("hospital")}
                    className={`role-button ${userType === "hospital" ? 'active' : 'inactive'}`}
                  >
                    <HospitalIcon size={18} />
                    <span>Hospital</span>
                  </button>
                </div>

                {/* Name Input */}
                <div className="input-group">
                  <label className="input-label">Identify</label>
                  <div className="input-wrapper">
                    <User className="input-icon" size={20} />
                    <input 
                      name="name" 
                      required 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder={userType === "donor" ? "Full Name" : "Hospital Name"} 
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div className="input-group">
                  <label className="input-label">Phone</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" size={20} />
                    <input 
                      name="phone" 
                      required 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="+91..." 
                      className="input-field"
                    />
                  </div>
                </div>

                {/* Blood Group Select (Donor Only) */}
                {userType === "donor" && (
                  <div className="input-group">
                    <label className="input-label">Blood Type</label>
                    <select 
                      name="bloodGroup" 
                      required 
                      value={formData.bloodGroup} 
                      onChange={handleChange} 
                      className="select-field"
                    >
                      <option value="">Select Blood Group</option>
                      {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map(bg => 
                        <option key={bg} value={bg}>{bg}</option>
                      )}
                    </select>
                  </div>
                )}

                {/* City Input */}
                <div className="input-group">
                  <label className="input-label">City</label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" size={20} />
                    <input 
                      name="city" 
                      required 
                      value={formData.city} 
                      onChange={handleChange} 
                      placeholder="Mumbai, Delhi..." 
                      className="input-field"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Input */}
            <div className="input-group">
              <label className="input-label">Email</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange} 
                  type="email" 
                  placeholder="email@address.com" 
                  className="input-field"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="input-group">
              <label className="input-label">Password</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  name="password" 
                  required 
                  value={formData.password} 
                  onChange={handleChange} 
                  type={showPassword ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="input-field"
                  style={{ paddingRight: '3.5rem' }}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="password-toggle"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              disabled={loading} 
              type="submit" 
              className="submit-button"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Droplets size={22} />
                  <span>{isLogin ? "Sign In" : "Register Now"}</span>
                  <Sparkles size={18} className="sparkle-icon" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Toggle */}
        <p className="footer-text">
          {isLogin ? "New here?" : "Member already?"}
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="footer-link"
          >
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RescueBloodAuth;