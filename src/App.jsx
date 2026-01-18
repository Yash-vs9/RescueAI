import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import Home from './Home'
import Auth from './Auth'
import BloodRequestForm from "./components/BloodRequestForm";
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth/>} />
        <Route path="/bloodForm" element={<BloodRequestForm/>} />



      </Routes>
    </Router>
  );
}

export default App;