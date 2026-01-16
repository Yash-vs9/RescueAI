import React, { useState } from "react";
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
} from "lucide-react";

const RescueBloodAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("donor");

  const handleSubmit = () => {
    // Handle login/register logic here
    console.log(isLogin ? "Logging in..." : "Registering...");
  };

  return (
    <div className="min-h-screen bg-[#fff5f5] text-slate-800 font-sans selection:bg-red-200 flex items-center justify-center p-6">
      {/* Organic Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      {/* Auth Container */}
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-red-600 p-3 rounded-2xl rotate-3">
            <Droplets className="text-white" size={32} />
          </div>
          <span className="text-3xl font-bold tracking-tight text-red-900">
            RescueBlood
          </span>
        </div>

        {/* Auth Card */}
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/40">
          {/* Toggle Login/Register */}
          <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                isLogin ? "bg-white shadow-sm text-red-600" : "text-slate-500"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                !isLogin ? "bg-white shadow-sm text-red-600" : "text-slate-500"
              }`}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {isLogin ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 pr-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 accent-red-600" />
                  <span className="text-slate-600 font-medium">
                    Remember me
                  </span>
                </label>
                <a
                  href="#"
                  className="text-red-600 font-bold hover:text-red-700"
                >
                  Forgot Password?
                </a>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                Login to Save Lives
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white/60 text-slate-500 font-medium">
                    Or continue with
                  </span>
                </div>
              </div>
            </div>
          ) : (
            // Register Form
            <div className="space-y-5">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3 ml-1">
                  I am a
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType("donor")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                      userType === "donor"
                        ? "bg-red-600 text-white shadow-lg shadow-red-200"
                        : "border border-slate-200 text-slate-700 hover:border-red-200"
                    }`}
                  >
                    <Heart size={18} />
                    Donor
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType("hospital")}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-all ${
                      userType === "hospital"
                        ? "bg-red-600 text-white shadow-lg shadow-red-200"
                        : "border border-slate-200 text-slate-700 hover:border-red-200"
                    }`}
                  >
                    <Droplets size={18} />
                    Hospital
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  {userType === "donor" ? "Full Name" : "Hospital Name"}
                </label>
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder={
                      userType === "donor"
                        ? "John Doe"
                        : "City General Hospital"
                    }
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="email"
                    placeholder="your@email.com"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Phone
                </label>
                <div className="relative">
                  <Phone
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              {userType === "donor" && (
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                    Blood Type
                  </label>
                  <select className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none">
                    <option>Select Blood Type</option>
                    <option>A+</option>
                    <option>O+</option>
                    <option>B+</option>
                    <option>AB+</option>
                    <option>A-</option>
                    <option>O-</option>
                    <option>B-</option>
                    <option>AB-</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  City
                </label>
                <div className="relative">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Mumbai"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                  Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 pl-12 pr-12 focus:ring-2 focus:ring-red-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                <input
                  type="checkbox"
                  className="w-5 h-5 accent-red-600"
                  id="terms"
                />
                <label
                  htmlFor="terms"
                  className="text-sm font-medium text-red-900"
                >
                  I agree to the Terms & Conditions
                </label>
              </div>

              <button
                onClick={handleSubmit}
                className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
              >
                {userType === "donor"
                  ? "Register as Life Saver"
                  : "Register Hospital"}
              </button>
            </div>
          )}
        </div>

        {/* Footer Text */}
        <p className="text-center mt-6 text-slate-600 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-red-600 font-bold hover:text-red-700"
          >
            {isLogin ? "Register now" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default RescueBloodAuth;
