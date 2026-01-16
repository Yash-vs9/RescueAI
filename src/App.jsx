import React, { useState } from 'react';
import { Heart, Droplets, Hospital, Plus, Search, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';

const RescueBlood = () => {
  const [isDonor, setIsDonor] = useState(true);

  return (
    <div className="min-h-screen bg-[#fff5f5] text-slate-800 font-sans selection:bg-red-200">
      {/* Organic Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-rose-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="flex justify-between items-center px-8 py-6 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="bg-red-600 p-2 rounded-2xl rotate-3">
            <Droplets className="text-white" size={24} />
          </div>
          <span className="text-2xl font-bold tracking-tight text-red-900">RescueBlood</span>
        </div>
        <div className="hidden md:flex gap-8 font-medium text-red-800/70">
          <a href="#" className="hover:text-red-600 transition-colors">Find Donors</a>
          <a href="#" className="hover:text-red-600 transition-colors">Hospitals</a>
          <a href="#" className="hover:text-red-600 transition-colors">About</a>
        </div>
        <button className="bg-red-600 text-white px-6 py-2.5 rounded-full font-semibold shadow-lg shadow-red-200 hover:scale-105 transition-transform">
          Login
        </button>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-24">
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <h1 className="text-6xl md:text-7xl font-extrabold leading-tight text-slate-900">
              Flow with <span className="text-red-600">Kindness.</span>
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-md">
              Connecting heroes with those in need. Whether you're a donor or a hospital, 
              every second counts in the journey of saving lives.
            </p>
            <div className="flex gap-4">
              <button className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-red-600 transition-all">
                Become a Donor
              </button>
              <button className="border-2 border-slate-200 px-8 py-4 rounded-2xl font-bold hover:border-red-300 transition-all">
                Request Blood
              </button>
            </div>
          </motion.div>

          {/* Interactive Toggle Form */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/60 backdrop-blur-xl p-8 rounded-[40px] shadow-2xl border border-white/40"
          >
            <div className="flex bg-slate-100 p-1.5 rounded-2xl mb-8">
              <button 
                onClick={() => setIsDonor(true)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${isDonor ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}
              >
                I am a Donor
              </button>
              <button 
                onClick={() => setIsDonor(false)}
                className={`flex-1 py-3 rounded-xl font-bold transition-all ${!isDonor ? 'bg-white shadow-sm text-red-600' : 'text-slate-500'}`}
              >
                I am a Hospital
              </button>
            </div>

            <form className="space-y-5">
              {isDonor ? (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Blood Type</label>
                    <select className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-red-500 outline-none transition-all appearance-none">
                      <option>Select Type</option>
                      <option>A+</option><option>O+</option><option>B+</option><option>AB+</option>
                      <option>A-</option><option>O-</option><option>B-</option><option>AB-</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-red-50 rounded-2xl border border-red-100">
                    <input type="checkbox" className="w-5 h-5 accent-red-600" id="ready" />
                    <label htmlFor="ready" className="text-sm font-medium text-red-900">I am ready to donate immediately</label>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Hospital Name</label>
                    <input type="text" placeholder="City General Hospital" className="w-full bg-white/50 border-0 ring-1 ring-slate-200 rounded-2xl p-4 focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Urgency Level</label>
                    <div className="flex gap-3">
                      {['Normal', 'Urgent', 'Critical'].map(level => (
                        <button key={level} type="button" className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-bold hover:bg-red-50 hover:border-red-200 uppercase tracking-wider">{level}</button>
                      ))}
                    </div>
                  </div>
                </>
              )}
              <button className="w-full bg-red-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transform transition-active active:scale-95">
                {isDonor ? 'Register as Life Saver' : 'Post Urgent Requirement'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Hospital Feed Section */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-slate-900">Urgent Requirements</h2>
            <div className="flex gap-2">
              <button className="p-3 bg-white rounded-full shadow-sm hover:shadow-md transition-shadow"><Search size={20}/></button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <HospitalCard hospital="St. Mary's Care" type="O Negative" units="3" time="12 mins ago" status="Critical" />
            <HospitalCard hospital="LifeLine Clinic" type="AB Positive" units="1" time="45 mins ago" status="Urgent" />
            <HospitalCard hospital="City Central" type="B Positive" units="5" time="1 hour ago" status="Normal" />
          </div>
        </section>
      </main>
    </div>
  );
};

const HospitalCard = ({ hospital, type, units, time, status }) => {
  const statusColors = {
    Critical: 'bg-red-100 text-red-600',
    Urgent: 'bg-orange-100 text-orange-600',
    Normal: 'bg-blue-100 text-blue-600'
  };

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden"
    >
      <div className={`absolute top-0 right-0 px-4 py-1 rounded-bl-2xl text-[10px] font-black uppercase tracking-widest ${statusColors[status]}`}>
        {status}
      </div>
      <div className="flex items-start gap-4 mb-6">
        <div className="bg-slate-50 p-3 rounded-2xl">
          <Hospital className="text-slate-400" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-slate-900">{hospital}</h3>
          <p className="text-xs text-slate-400 font-medium">{time}</p>
        </div>
      </div>
      
      <div className="flex items-end justify-between">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Blood Needed</span>
          <span className="text-3xl font-black text-red-600 tracking-tighter">{type}</span>
        </div>
        <div className="text-right">
          <span className="text-xs font-bold text-slate-400 uppercase block mb-1">Units</span>
          <span className="text-xl font-bold text-slate-900">{units}</span>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <button className="flex-1 bg-slate-900 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-red-600 transition-colors">Help Now</button>
        <button className="p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50"><Share2 size={18} className="text-slate-400"/></button>
      </div>
    </motion.div>
  );
};

export default RescueBlood;