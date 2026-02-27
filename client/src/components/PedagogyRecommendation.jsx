import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaLightbulb, FaSpinner, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PedagogyRecommendation = ({ subject, topic, grade, educationLevel, onRecommendationSelect }) => {
  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRecommendation, setShowRecommendation] = useState(false);

  const fetchRecommendation = async () => {
    if (!subject || !topic) return;

    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/pedagogy/recommend`, {
        subject,
        topic,
        grade,
        educationLevel
      });
      setRecommendation(response.data.recommendation);
      setShowRecommendation(true);
    } catch (error) {
      console.error('Failed to get pedagogy recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-fetch when subject and topic are available
    if (subject && topic && grade) {
      const timer = setTimeout(() => {
        fetchRecommendation();
      }, 1000); // Debounce
      return () => clearTimeout(timer);
    }
  }, [subject, topic, grade]);

  if (!showRecommendation && !loading) {
    return (
      <button
        onClick={fetchRecommendation}
        className="btn-secondary w-full flex items-center justify-center space-x-2"
      >
        <FaLightbulb />
        <span>Get Teaching Strategy Recommendation</span>
      </button>
    );
  }

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-4">
          <FaSpinner className="animate-spin text-primary-600" />
          <span className="ml-2">Analyzing best teaching approach...</span>
        </div>
      </div>
    );
  }

  if (!recommendation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-2 border-primary-300 dark:border-primary-700"
    >
      <div className="flex items-center space-x-2 mb-4">
        <FaLightbulb className="text-yellow-500 text-xl" />
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          Recommended Teaching Approach
        </h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <FaCheckCircle className="text-green-600" />
            <span className="font-semibold text-lg text-primary-700 dark:text-primary-300">
              {recommendation.recommendedApproach}
            </span>
          </div>
          <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Why this approach?</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{recommendation.reasoning}</p>
          </div>
        </div>

        {recommendation.pedagogicalRationale && (
          <div className="bg-white/60 dark:bg-gray-800/60 p-3 rounded-lg">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Pedagogical Rationale:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{recommendation.pedagogicalRationale}</p>
          </div>
        )}

        {recommendation.alternativeApproaches && recommendation.alternativeApproaches.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Alternative Approaches:</p>
            <div className="flex flex-wrap gap-2">
              {recommendation.alternativeApproaches.map((approach, index) => (
                <button
                  key={index}
                  onClick={() => onRecommendationSelect && onRecommendationSelect(approach)}
                  className="px-3 py-1 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  {approach}
                </button>
              ))}
            </div>
          </div>
        )}

        {recommendation.implementationTips && recommendation.implementationTips.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Implementation Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              {recommendation.implementationTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Suitability: {recommendation.suitabilityScore || 85}%
          </span>
          <button
            onClick={() => onRecommendationSelect && onRecommendationSelect(recommendation.recommendedApproach)}
            className="btn-primary text-sm px-4 py-2"
          >
            Use This Approach
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PedagogyRecommendation;

