import React, { useState } from 'react';
import { X, Droplets, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DonationConfirmationModal = ({ isOpen, onClose, donor, bloodRequest, onConfirm }) => {
  const API_URL = import.meta.env.VITE_API_URL;
  const token = localStorage.getItem("token");

  const [units, setUnits] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!units || units <= 0) {
      setError('Please enter a valid number of units');
      return;
    }

    setLoading(true);
    setError('');
    console.log(bloodRequest)
    try {
      const response = await fetch(`${API_URL}/api/donations/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          donorId: donor._id,
          bloodRequestId: bloodRequest._id,
          units: Number(units)
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          onConfirm(data.donation);
          onClose();
          setSuccess(false);
          setUnits('');
        }, 2000);
      } else {
        setError(data.message || 'Failed to confirm donation');
      }
    } catch (err) {
      console.error('Confirm donation error:', err);
      setError('Failed to confirm donation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="modal-overlay">
        <style>{`
          .modal-overlay {
            position: fixed;
            inset: 0;
            background: rgba(47, 69, 56, 0.5);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 2rem;
          }

          .modal-content {
            background: rgba(253, 248, 243, 0.98);
            backdrop-filter: blur(30px);
            border-radius: 40px;
            border: 2px solid rgba(255, 255, 255, 0.9);
            box-shadow: 0 30px 80px rgba(47, 69, 56, 0.2);
            width: 100%;
            max-width: 500px;
            padding: 3rem;
            position: relative;
          }

          .modal-close {
            position: absolute;
            top: 1.5rem;
            right: 1.5rem;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(90, 122, 107, 0.1);
            border-radius: 16px;
            padding: 0.75rem;
            cursor: pointer;
            transition: all 0.3s ease;
            color: var(--sage);
          }

          .modal-close:hover {
            background: white;
            color: var(--crimson);
            transform: rotate(90deg);
          }

          .modal-header {
            text-align: center;
            margin-bottom: 2rem;
          }

          .modal-icon {
            width: 4rem;
            height: 4rem;
            background: linear-gradient(135deg, var(--crimson), var(--terracotta));
            border-radius: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: 0 10px 30px rgba(193, 64, 61, 0.3);
          }

          .modal-title {
            font-family: 'Crimson Pro', serif;
            font-size: 2rem;
            font-weight: 800;
            color: var(--forest);
            margin-bottom: 0.5rem;
          }

          .modal-subtitle {
            font-family: 'Outfit', sans-serif;
            font-size: 0.95rem;
            color: var(--sage);
            font-weight: 500;
          }

          .donor-info-card {
            background: rgba(255, 255, 255, 0.6);
            border-radius: 25px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            border: 2px solid rgba(90, 122, 107, 0.1);
          }

          .donor-name {
            font-family: 'Crimson Pro', serif;
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--forest);
            margin-bottom: 0.75rem;
          }

          .donor-detail {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            color: var(--sage);
            margin-bottom: 0.5rem;
          }

          .blood-group-large {
            display: inline-flex;
            padding: 0.5rem 1.25rem;
            background: linear-gradient(135deg, rgba(193, 64, 61, 0.1), rgba(224, 120, 86, 0.1));
            border: 2px solid rgba(193, 64, 61, 0.2);
            border-radius: 15px;
            font-family: 'Crimson Pro', serif;
            font-weight: 800;
            font-size: 1.1rem;
            color: var(--crimson);
          }

          .form-group {
            margin-bottom: 2rem;
          }

          .form-label {
            display: block;
            font-family: 'Outfit', sans-serif;
            font-size: 0.75rem;
            font-weight: 800;
            color: var(--sage);
            text-transform: uppercase;
            letter-spacing: 0.1em;
            margin-bottom: 0.75rem;
          }

          .form-input {
            width: 100%;
            background: rgba(255, 255, 255, 0.8);
            border: 2px solid rgba(90, 122, 107, 0.15);
            border-radius: 20px;
            padding: 1.25rem;
            font-family: 'Outfit', sans-serif;
            font-size: 1rem;
            font-weight: 700;
            color: var(--forest);
            outline: none;
            transition: all 0.3s ease;
          }

          .form-input:focus {
            background: white;
            border-color: var(--crimson);
            box-shadow: 0 0 0 4px rgba(193, 64, 61, 0.1);
          }

          .error-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 1.25rem;
            background: rgba(193, 64, 61, 0.1);
            border: 2px solid rgba(193, 64, 61, 0.2);
            border-radius: 18px;
            color: var(--crimson);
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
          }

          .success-message {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem 1.25rem;
            background: rgba(90, 122, 107, 0.1);
            border: 2px solid rgba(90, 122, 107, 0.2);
            border-radius: 18px;
            color: var(--sage);
            font-family: 'Outfit', sans-serif;
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 1.5rem;
          }

          .submit-button {
            width: 100%;
            background: linear-gradient(135deg, var(--crimson), #A63634);
            color: white;
            padding: 1.5rem;
            border-radius: 22px;
            border: none;
            font-family: 'Outfit', sans-serif;
            font-weight: 800;
            font-size: 1rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 15px 40px rgba(193, 64, 61, 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
          }

          .submit-button:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 20px 50px rgba(193, 64, 61, 0.4);
          }

          .submit-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>

          <div className="modal-header">
            <div className="modal-icon">
              <CheckCircle className="text-white" size={32} />
            </div>
            <h2 className="modal-title">Confirm Donation</h2>
            <p className="modal-subtitle">Record the successful blood donation</p>
          </div>

          <div className="donor-info-card">
            <div className="donor-name">{donor.name}</div>
            <div className="donor-detail">
              <Droplets size={16} className="text-crimson" />
              <span className="blood-group-large">{donor.bloodGroup}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Units Donated (ml)</label>
              <input
                type="number"
                className="form-input"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                placeholder="450"
                min="1"
                required
              />
            </div>

            {error && (
              <div className="error-message">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="success-message">
                <CheckCircle size={18} />
                <span>Donation confirmed successfully!</span>
              </div>
            )}

            <button
              type="submit"
              className="submit-button"
              disabled={loading || success}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={22} />
                  <span>Confirming...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle size={22} />
                  <span>Confirmed!</span>
                </>
              ) : (
                <>
                  <CheckCircle size={22} />
                  <span>Confirm Donation</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default DonationConfirmationModal;

