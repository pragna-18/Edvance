import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaLightbulb, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SimilarPlans = ({ planId }) => {
  const [similarPlans, setSimilarPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSimilarPlans();
  }, [planId]);

  const fetchSimilarPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/suggestions/similar-plans/${planId}`);
      setSimilarPlans(response.data.similarPlans || []);
    } catch (error) {
      console.error('Failed to fetch similar plans:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <FaSpinner className="animate-spin text-2xl text-primary-600" />
        </div>
      </div>
    );
  }

  if (similarPlans.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center space-x-2 mb-4">
          <FaLightbulb className="text-primary-600" />
          <h3 className="text-xl font-semibold text-gray-800">Similar Plans</h3>
        </div>
        <p className="text-gray-600">No similar plans found.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center space-x-2 mb-4">
        <FaLightbulb className="text-primary-600" />
        <h3 className="text-xl font-semibold text-gray-800">Similar Plans</h3>
      </div>
      <div className="space-y-3">
        {similarPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link
              to={`/plans/${plan.id}`}
              className="block p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <h4 className="font-semibold text-gray-800 mb-1">{plan.title}</h4>
              <p className="text-sm text-gray-600">
                {plan.subject} • {plan.grade} • By {plan.creator?.name}
              </p>
              {plan.healthScore && (
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs font-medium text-gray-600">Health Score:</span>
                  <span className="text-xs font-bold text-primary-600">
                    {plan.healthScore.toFixed(1)}/10
                  </span>
                </div>
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SimilarPlans;






