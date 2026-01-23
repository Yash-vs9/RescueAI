import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Dashboard from "./components/Dashboard";
import Home from './Home'
import Auth from './Auth'
import LiveDonorTracking from "./components/LiveDonorTracking";
import BloodRequestForm from "./components/BloodRequestForm";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth/>} />
        <Route path="/bloodForm" element={<BloodRequestForm/>} />
        <Route path="/map" element={<LiveDonorTracking/>} />

        <Route path="/dashboard" element={<Dashboard/>} />




      </Routes>
    </Router>
  );
}

export default App;