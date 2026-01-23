import React, { useState, useEffect } from "react";
import { 
  Droplets, Activity, Heart, Calendar, Award, TrendingUp, 
  Clock, Users, BarChart3, PieChart, ArrowUpRight, ChevronRight,
  Download, Share2, Bell, Settings, LogOut, Shield, Zap,
  MapPin, AlertCircle, CheckCircle, Info
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';

const Dashboard = () => {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [error, setError] = useState(null);
  
  const userRole = localStorage.getItem("role") || "guest";
  const token = localStorage.getItem("token");
  const userName = localStorage.getItem("userName");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const endpoint = userRole === "donor" 
        ? "/api/donations/dashboard/donor" 
        : "/api/donations/dashboard/hospital";
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setDashboardData(data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Failed to load dashboard data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/auth');
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (error) {
    return <ErrorScreen message={error} />;
  }

  return (
    <div className="dashboard-container">
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

        .dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
          position: relative;
          overflow-x: hidden;
          font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        /* Organic Background */
        .dashboard-container::before {
          content: '';
          position: fixed;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: 
            radial-gradient(circle at 20% 30%, rgba(193, 64, 61, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(90, 122, 107, 0.06) 0%, transparent 50%),
            radial-gradient(circle at 50% 50%, rgba(224, 120, 86, 0.04) 0%, transparent 60%);
          animation: breathe 25s ease-in-out infinite;
          z-index: 0;
          pointer-events: none;
        }

        @keyframes breathe {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.15) rotate(8deg); }
        }

        .dashboard-container::after {
          content: '';
          position: fixed;
          inset: 0;
          background-image: 
            url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%232F4538' fill-opacity='0.02'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
          opacity: 0.4;
          z-index: 0;
          pointer-events: none;
        }

        .dashboard-content {
          position: relative;
          z-index: 10;
        }

        /* Navigation */
        .dashboard-nav {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem 2.5rem;
          backdrop-filter: blur(30px);
          background: rgba(253, 248, 243, 0.85);
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
          padding: 0.75rem;
          border-radius: 20px;
          transform: rotate(3deg);
          box-shadow: 0 8px 25px rgba(193, 64, 61, 0.3);
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

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
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
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
        }

        .nav-button:hover {
          background: rgba(255, 255, 255, 1);
          color: var(--crimson);
          transform: translateY(-2px);
          box-shadow: 0 5px 20px rgba(193, 64, 61, 0.15);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding-left: 1.5rem;
          border-left: 2px solid rgba(90, 122, 107, 0.2);
        }

        .user-name {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--forest);
        }

        /* Main Layout */
        .dashboard-main {
          padding: 2.5rem;
          max-width: 1800px;
          margin: 0 auto;
        }

        /* Header Section */
        .dashboard-header {
          margin-bottom: 3rem;
        }

        .welcome-section {
          margin-bottom: 2rem;
        }

        .welcome-title {
          font-family: 'Crimson Pro', serif;
          font-size: 3.5rem;
          font-weight: 800;
          color: var(--forest);
          line-height: 1.1;
          margin-bottom: 0.5rem;
        }

        .welcome-subtitle {
          font-family: 'Outfit', sans-serif;
          font-size: 1.15rem;
          color: var(--sage);
          font-weight: 500;
        }

        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 35px;
          padding: 2rem;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 
            0 15px 40px rgba(47, 69, 56, 0.06),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          position: relative;
          overflow: hidden;
        }

        .stat-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, var(--crimson), var(--terracotta));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.5s ease;
        }

        .stat-card:hover::before {
          transform: scaleX(1);
        }

        .stat-card:hover {
          transform: translateY(-8px);
          box-shadow: 
            0 25px 60px rgba(47, 69, 56, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }

        .stat-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.5rem;
        }

        .stat-icon-wrapper {
          width: 3.5rem;
          height: 3.5rem;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .stat-card:hover .stat-icon-wrapper {
          transform: scale(1.1) rotate(-5deg);
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          background: rgba(90, 122, 107, 0.1);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--sage);
        }

        .stat-value {
          font-family: 'Crimson Pro', serif;
          font-size: 3rem;
          font-weight: 800;
          color: var(--forest);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          font-family: 'Outfit', sans-serif;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--sage);
          opacity: 0.8;
        }

        /* Chart Cards */
        .charts-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 2rem;
          margin-bottom: 3rem;
        }

        .chart-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 40px;
          padding: 2.5rem;
          box-shadow: 
            0 20px 50px rgba(47, 69, 56, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 1);
          transition: all 0.4s ease;
        }

        .chart-card:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 30px 70px rgba(47, 69, 56, 0.12),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }

        .chart-card.span-8 {
          grid-column: span 8;
        }

        .chart-card.span-4 {
          grid-column: span 4;
        }

        .chart-card.span-12 {
          grid-column: span 12;
        }

        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .chart-title {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--forest);
        }

        .chart-actions {
          display: flex;
          gap: 0.5rem;
        }

        .chart-action-btn {
          padding: 0.625rem;
          background: rgba(255, 255, 255, 0.7);
          border: 2px solid rgba(90, 122, 107, 0.1);
          border-radius: 14px;
          color: var(--sage);
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .chart-action-btn:hover {
          background: white;
          color: var(--crimson);
          transform: scale(1.05);
        }

        /* History Table */
        .history-section {
          margin-bottom: 3rem;
        }

        .history-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(25px);
          border: 2px solid rgba(255, 255, 255, 0.9);
          border-radius: 40px;
          padding: 2.5rem;
          box-shadow: 
            0 20px 50px rgba(47, 69, 56, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 1);
        }

        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .history-title {
          font-family: 'Crimson Pro', serif;
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--forest);
        }

        .history-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 0 0.75rem;
        }

        .history-table thead th {
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 800;
          color: var(--sage);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          text-align: left;
          padding: 0 1.5rem 1rem;
          opacity: 0.7;
        }

        .history-table tbody tr {
          background: rgba(255, 255, 255, 0.6);
          border-radius: 20px;
          transition: all 0.3s ease;
        }

        .history-table tbody tr:hover {
          background: white;
          transform: translateX(5px);
          box-shadow: 0 5px 20px rgba(47, 69, 56, 0.08);
        }

        .history-table tbody td {
          padding: 1.25rem 1.5rem;
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--forest);
        }

        .history-table tbody td:first-child {
          border-radius: 18px 0 0 18px;
        }

        .history-table tbody td:last-child {
          border-radius: 0 18px 18px 0;
        }

        .blood-group-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(193, 64, 61, 0.1), rgba(224, 120, 86, 0.1));
          border: 2px solid rgba(193, 64, 61, 0.2);
          border-radius: 14px;
          font-family: 'Crimson Pro', serif;
          font-weight: 800;
          font-size: 0.95rem;
          color: var(--crimson);
        }

        .units-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          background: rgba(90, 122, 107, 0.1);
          border-radius: 14px;
          font-weight: 700;
          color: var(--sage);
        }

        /* Achievement Section */
        .achievements-section {
          margin-bottom: 3rem;
        }

        .achievements-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1.5rem;
        }

        .achievement-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(20px);
          border: 2px solid rgba(255, 255, 255, 0.8);
          border-radius: 30px;
          padding: 2rem;
          text-align: center;
          transition: all 0.4s ease;
          box-shadow: 0 10px 30px rgba(47, 69, 56, 0.05);
        }

        .achievement-card:hover {
          transform: translateY(-8px) scale(1.02);
          box-shadow: 0 20px 50px rgba(193, 64, 61, 0.15);
        }

        .achievement-icon {
          width: 4rem;
          height: 4rem;
          background: linear-gradient(135deg, var(--crimson), var(--terracotta));
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
          box-shadow: 0 10px 30px rgba(193, 64, 61, 0.3);
        }

        .achievement-title {
          font-family: 'Outfit', sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          color: var(--forest);
          margin-bottom: 0.25rem;
        }

        .achievement-desc {
          font-family: 'Outfit', sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--sage);
          opacity: 0.8;
        }

        /* Loading Screen */
        .loading-screen {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #FDF8F3 0%, #F5EDE3 50%, #EDE3D8 100%);
        }

        .loading-content {
          text-align: center;
        }

        .loading-spinner {
          width: 80px;
          height: 80px;
          border: 4px solid rgba(193, 64, 61, 0.1);
          border-top-color: var(--crimson);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 2rem;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.1rem;
          font-weight: 600;
          color: var(--sage);
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .chart-card.span-8,
          .chart-card.span-4 {
            grid-column: span 12;
          }
        }

        @media (max-width: 768px) {
          .dashboard-nav {
            padding: 1.25rem 1.5rem;
          }

          .dashboard-main {
            padding: 1.5rem;
          }

          .welcome-title {
            font-size: 2.5rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .user-name {
            display: none;
          }

          .logo-text {
            font-size: 1.5rem;
          }
        }
      `}</style>

      <div className="dashboard-content">
        {/* Navigation */}
        <nav className="dashboard-nav">
          <div className="logo-container" onClick={() => navigate('/')}>
            <div className="logo-icon">
              <Droplets className="text-white" size={28} />
            </div>
            <span className="logo-text">RescueBlood</span>
          </div>

          <div className="nav-actions">
            <button className="nav-button" title="Notifications">
              <Bell size={20} />
            </button>
            <button className="nav-button" title="Settings">
              <Settings size={20} />
            </button>
            <div className="user-info">
              <p className="user-name">{userName}</p>
              <button onClick={handleLogout} className="nav-button">
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="dashboard-main">
          {userRole === "donor" ? (
            <DonorDashboard data={dashboardData} />
          ) : (
            <HospitalDashboard data={dashboardData} />
          )}
        </main>
      </div>
    </div>
  );
};

// Donor Dashboard Component
const DonorDashboard = ({ data }) => {
  const { profile, stats, history } = data;

  // Prepare chart data
  const monthlyData = prepareMonthlyDonationData(history);
  const bloodGroupData = prepareBloodGroupData(history);

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="welcome-section"
        >
          <h1 className="welcome-title">
            Welcome back, <span style={{ color: 'var(--crimson)' }}>{profile.name}</span>
          </h1>
          <p className="welcome-subtitle">Here's your donation journey and impact overview</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-grid"
      >
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(193, 64, 61, 0.15), rgba(224, 120, 86, 0.15))' }}>
              <Droplets className="text-crimson" size={28} />
            </div>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>Active</span>
            </div>
          </div>
          <div className="stat-value">{stats.totalUnitsDonated}</div>
          <div className="stat-label">Total Units Donated (ml)</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(90, 122, 107, 0.15), rgba(52, 211, 153, 0.15))' }}>
              <Heart className="text-sage" size={28} />
            </div>
            <div className="stat-trend">
              <CheckCircle size={14} />
              <span>Verified</span>
            </div>
          </div>
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Lives Saved</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(167, 139, 250, 0.15))' }}>
              <Activity className="text-purple-600" size={28} />
            </div>
            <div className="stat-trend">
              <Info size={14} />
              <span>{profile.bloodGroup}</span>
            </div>
          </div>
          <div className="stat-value">{profile.bloodGroup}</div>
          <div className="stat-label">Blood Group</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.15))' }}>
              <Calendar className="text-orange-600" size={28} />
            </div>
            <div className="stat-trend">
              <Clock size={14} />
              <span>Next</span>
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.75rem' }}>
            {stats.nextEligibleDate ? new Date(stats.nextEligibleDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Ready'}
          </div>
          <div className="stat-label">Next Eligible Date</div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="charts-grid"
      >
        <div className="chart-card span-8">
          <div className="chart-header">
            <h3 className="chart-title">Donation Timeline</h3>
            <div className="chart-actions">
              <button className="chart-action-btn">
                <Download size={18} />
              </button>
              <button className="chart-action-btn">
                <Share2 size={18} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C1403D" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#C1403D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 69, 56, 0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#5A7A6B', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(47, 69, 56, 0.2)' }}
              />
              <YAxis 
                tick={{ fill: '#5A7A6B', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(47, 69, 56, 0.2)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: '2px solid rgba(193, 64, 61, 0.2)',
                  borderRadius: '16px',
                  padding: '12px',
                  fontFamily: 'Outfit'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="units" 
                stroke="#C1403D" 
                strokeWidth={3}
                fill="url(#colorUnits)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card span-4">
          <div className="chart-header">
            <h3 className="chart-title">Impact Score</h3>
          </div>
          <div style={{ textAlign: 'center', paddingTop: '2rem' }}>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring' }}
              style={{
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #C1403D, #E07856)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
                boxShadow: '0 20px 60px rgba(193, 64, 61, 0.3)'
              }}
            >
              <div style={{ 
                fontFamily: 'Crimson Pro', 
                fontSize: '4rem', 
                fontWeight: 800, 
                color: 'white',
                lineHeight: 1 
              }}>
                {Math.min(100, Math.round((stats.totalUnitsDonated / 10000) * 100))}
              </div>
              <div style={{ 
                fontFamily: 'Outfit', 
                fontSize: '0.9rem', 
                fontWeight: 700, 
                color: 'rgba(255, 255, 255, 0.9)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                Hero Level
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Achievements */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="achievements-section"
      >
        <h2 className="chart-title" style={{ marginBottom: '1.5rem' }}>Achievements</h2>
        <div className="achievements-grid">
          <div className="achievement-card">
            <div className="achievement-icon">
              <Award className="text-white" size={32} />
            </div>
            <h4 className="achievement-title">First Donation</h4>
            <p className="achievement-desc">Completed first donation</p>
          </div>
          
          {stats.totalUnitsDonated >= 1000 && (
            <div className="achievement-card">
              <div className="achievement-icon">
                <Heart className="text-white" size={32} />
              </div>
              <h4 className="achievement-title">Life Saver</h4>
              <p className="achievement-desc">Donated 1000+ ml</p>
            </div>
          )}

          {history.length >= 5 && (
            <div className="achievement-card">
              <div className="achievement-icon">
                <Zap className="text-white" size={32} />
              </div>
              <h4 className="achievement-title">Super Donor</h4>
              <p className="achievement-desc">5+ donations</p>
            </div>
          )}

          {history.length >= 10 && (
            <div className="achievement-card">
              <div className="achievement-icon">
                <Shield className="text-white" size={32} />
              </div>
              <h4 className="achievement-title">Guardian Angel</h4>
              <p className="achievement-desc">10+ lives saved</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="history-section"
      >
        <div className="history-card">
          <div className="history-header">
            <h3 className="history-title">Donation History</h3>
            <button className="nav-button">
              View All
            </button>
          </div>
          
          {history.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Hospital</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{item.hospitalName}</td>
                    <td>
                      <span className="blood-group-badge">{item.bloodGroup}</span>
                    </td>
                    <td>
                      <span className="units-badge">
                        <Droplets size={16} />
                        {item.units} ml
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sage)', opacity: 0.6 }}>
              No donation history yet. Start your journey today!
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Hospital Dashboard Component  
const HospitalDashboard = ({ data }) => {
  const { profile, stats, history } = data;

  const monthlyData = prepareMonthlyDonationData(history);
  const bloodGroupChartData = Object.entries(stats.bloodGroupSummary || {}).map(([group, units]) => ({
    name: group,
    value: units
  }));

  const COLORS = ['#C1403D', '#E07856', '#5A7A6B', '#2F4538', '#F59E0B', '#8B5CF6', '#EC4899', '#10B981'];

  return (
    <>
      {/* Header */}
      <div className="dashboard-header">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="welcome-section"
        >
          <h1 className="welcome-title">
            {profile.name} <span style={{ color: 'var(--crimson)' }}>Dashboard</span>
          </h1>
          <p className="welcome-subtitle">Monitor blood inventory and donor activity</p>
        </motion.div>
      </div>

      {/* Stats Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="stats-grid"
      >
        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(193, 64, 61, 0.15), rgba(224, 120, 86, 0.15))' }}>
              <Droplets className="text-crimson" size={28} />
            </div>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>Total</span>
            </div>
          </div>
          <div className="stat-value">{stats.totalUnitsReceived}</div>
          <div className="stat-label">Total Units Received (ml)</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(90, 122, 107, 0.15), rgba(52, 211, 153, 0.15))' }}>
              <Users className="text-sage" size={28} />
            </div>
            <div className="stat-trend">
              <CheckCircle size={14} />
              <span>Active</span>
            </div>
          </div>
          <div className="stat-value">{history.length}</div>
          <div className="stat-label">Total Donors</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(167, 139, 250, 0.15))' }}>
              <BarChart3 className="text-purple-600" size={28} />
            </div>
            <div className="stat-trend">
              <Info size={14} />
              <span>Types</span>
            </div>
          </div>
          <div className="stat-value">{Object.keys(stats.bloodGroupSummary || {}).length}</div>
          <div className="stat-label">Blood Groups Available</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon-wrapper" style={{ background: 'linear-gradient(135deg, rgba(251, 146, 60, 0.15), rgba(249, 115, 22, 0.15))' }}>
              <Activity className="text-orange-600" size={28} />
            </div>
            <div className="stat-trend">
              <TrendingUp size={14} />
              <span>This Month</span>
            </div>
          </div>
          <div className="stat-value">{monthlyData[monthlyData.length - 1]?.units || 0}</div>
          <div className="stat-label">Recent Donations (ml)</div>
        </div>
      </motion.div>

      {/* Charts */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="charts-grid"
      >
        <div className="chart-card span-8">
          <div className="chart-header">
            <h3 className="chart-title">Monthly Collection Trends</h3>
            <div className="chart-actions">
              <button className="chart-action-btn">
                <Download size={18} />
              </button>
              <button className="chart-action-btn">
                <Share2 size={18} />
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(47, 69, 56, 0.1)" />
              <XAxis 
                dataKey="month" 
                tick={{ fill: '#5A7A6B', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(47, 69, 56, 0.2)' }}
              />
              <YAxis 
                tick={{ fill: '#5A7A6B', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: 'rgba(47, 69, 56, 0.2)' }}
              />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: '2px solid rgba(193, 64, 61, 0.2)',
                  borderRadius: '16px',
                  padding: '12px',
                  fontFamily: 'Outfit'
                }}
              />
              <Bar dataKey="units" fill="#C1403D" radius={[12, 12, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card span-4">
          <div className="chart-header">
            <h3 className="chart-title">Blood Group Distribution</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={bloodGroupChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {bloodGroupChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.95)', 
                  border: '2px solid rgba(193, 64, 61, 0.2)',
                  borderRadius: '16px',
                  padding: '12px',
                  fontFamily: 'Outfit'
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Blood Inventory */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="achievements-section"
      >
        <h2 className="chart-title" style={{ marginBottom: '1.5rem' }}>Blood Inventory Status</h2>
        <div className="achievements-grid">
          {Object.entries(stats.bloodGroupSummary || {}).map(([group, units]) => (
            <div key={group} className="achievement-card">
              <div className="achievement-icon">
                <Droplets className="text-white" size={32} />
              </div>
              <h4 className="achievement-title">{group}</h4>
              <p className="achievement-desc">{units} ml available</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* History */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="history-section"
      >
        <div className="history-card">
          <div className="history-header">
            <h3 className="history-title">Recent Donations</h3>
            <button className="nav-button">
              View All
            </button>
          </div>
          
          {history.length > 0 ? (
            <table className="history-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Donor</th>
                  <th>Blood Group</th>
                  <th>Units</th>
                </tr>
              </thead>
              <tbody>
                {history.slice(0, 5).map((item, index) => (
                  <tr key={index}>
                    <td>{new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                    <td>{item.donorName}</td>
                    <td>
                      <span className="blood-group-badge">{item.bloodGroup}</span>
                    </td>
                    <td>
                      <span className="units-badge">
                        <Droplets size={16} />
                        {item.units} ml
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--sage)', opacity: 0.6 }}>
              No donation records yet
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
};

// Helper Functions
const prepareMonthlyDonationData = (history) => {
  const monthlyMap = {};
  
  history.forEach(item => {
    const date = new Date(item.date);
    const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + item.units;
  });

  const sortedMonths = Object.keys(monthlyMap).sort((a, b) => 
    new Date(a) - new Date(b)
  );

  return sortedMonths.slice(-6).map(month => ({
    month: month.split(' ')[0],
    units: monthlyMap[month]
  }));
};

const prepareBloodGroupData = (history) => {
  const bloodGroupMap = {};
  
  history.forEach(item => {
    bloodGroupMap[item.bloodGroup] = (bloodGroupMap[item.bloodGroup] || 0) + item.units;
  });

  return Object.entries(bloodGroupMap).map(([group, units]) => ({
    name: group,
    value: units
  }));
};

// Loading Screen Component
const LoadingScreen = () => (
  <div className="loading-screen">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading your dashboard...</p>
    </div>
  </div>
);

// Error Screen Component
const ErrorScreen = ({ message }) => (
  <div className="loading-screen">
    <div className="loading-content">
      <AlertCircle size={60} style={{ color: 'var(--crimson)', marginBottom: '1.5rem' }} />
      <p className="loading-text" style={{ color: 'var(--crimson)' }}>{message}</p>
    </div>
  </div>
);

export default Dashboard;