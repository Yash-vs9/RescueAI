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
  Hospital as HospitalIcon
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
            // Pre-seed storage so Home page has a fallback immediately
            localStorage.setItem("userLat", latitude);
            localStorage.setItem("userLng", longitude);
          },
          (error) => {
            console.warn("Location access denied. Using fallback.", error);
            // Default Fallback (Aligarh coordinates as per context)
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

    // Validation: Ensure GPS data is ready for Registration
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
            coordinates: [Number(formData.lng), Number(formData.lat)], // [lng, lat] for GeoJSON
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
          // --- LOGIN SUCCESS LOGIC ---
          localStorage.setItem("token", data.token);
          localStorage.setItem("role", data.user.role);
          localStorage.setItem("userName", data.user.name);
          
          // Save actual coordinates from the Database to storage
          // if (data.user.location?.coordinates) {
          //   localStorage.setItem("userLng", data.user.location.coordinates[0]);
          //   localStorage.setItem("userLat", data.user.location.coordinates[1]);
          // }

          setMessage({ type: "success", text: "Login successful! Redirecting..." });
          setTimeout(() => navigate("/"), 800);
        } else {
          // --- REGISTER SUCCESS LOGIC ---
          // Save the registration GPS data to storage immediately
          localStorage.setItem("userLat", formData.lat);
          localStorage.setItem("role", userType); // Pre-save role

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
    <div className="min-h-screen bg-[#fff5f5] text-slate-800 font-sans selection:bg-red-200 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Organic Background Blobs */}
      <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse" />

      <div className="w-full max-w-md relative z-10">
        <div className="flex items-center justify-center gap-2 mb-8 group cursor-default">
          <div className="bg-red-600 p-3 rounded-2xl rotate-3 shadow-lg shadow-red-200 group-hover:rotate-6 transition-transform">
            <Droplets className="text-white" size={32} />
          </div>
          <span className="text-3xl font-black tracking-tighter text-red-900 uppercase">RescueBlood</span>
        </div>

        <div className="bg-white/60 backdrop-blur-2xl p-8 rounded-[40px] shadow-2xl border border-white/40">
          {/* View Toggle */}
          <div className="flex bg-slate-200/50 p-1.5 rounded-2xl mb-8">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${isLogin ? "bg-white shadow-md text-red-600" : "text-slate-500"}`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isLogin ? "bg-white shadow-md text-red-600" : "text-slate-500"}`}
            >
              Register
            </button>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-2xl text-xs font-black uppercase tracking-widest border ${message.type === "success" ? "bg-green-100 text-green-600 border-green-200" : "bg-red-100 text-red-600 border-red-200"}`}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                {/* User Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => setUserType("donor")}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${userType === "donor" ? "bg-red-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
                  >
                    <Heart size={16} /> Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("hospital")}
                    className={`flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${userType === "hospital" ? "bg-red-600 text-white shadow-lg" : "bg-white text-slate-400 border border-slate-200"}`}
                  >
                    <HospitalIcon size={16} /> Hospital
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Identify</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input name="name" required value={formData.name} onChange={handleChange} placeholder={userType === "donor" ? "Full Name" : "Hospital Name"} className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input name="phone" required value={formData.phone} onChange={handleChange} placeholder="+91..." className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                  </div>
                </div>

                {userType === "donor" && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Blood Type</label>
                    <select name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange} className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-red-500 outline-none transition-all font-bold">
                      <option value="">Select</option>
                      {["A+", "O+", "B+", "AB+", "A-", "O-", "B-", "AB-"].map(bg => <option key={bg} value={bg}>{bg}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">City</label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input name="city" required value={formData.city} onChange={handleChange} placeholder="Mumbai, Delhi..." className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="email" required value={formData.email} onChange={handleChange} type="email" placeholder="email@address.com" className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input name="password" required value={formData.password} onChange={handleChange} type={showPassword ? "text" : "password"} placeholder="••••••••" className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 pr-12 focus:ring-2 focus:ring-red-500 outline-none transition-all" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full bg-red-600 text-white py-5 rounded-[24px] font-black shadow-xl shadow-red-200 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-70 flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Droplets size={20} />}
              {isLogin ? "Sign In" : "Register Now"}
            </button>
          </form>
        </div>

        <p className="text-center mt-8 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
          {isLogin ? "New here?" : "Member already?"}
          <button onClick={() => setIsLogin(!isLogin)} className="text-red-600 ml-2 hover:underline decoration-2 underline-offset-4">
            {isLogin ? "Create Account" : "Sign In"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RescueBloodAuth;