import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaStar, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const HealthScore = ({ planId }) => {
  const [score, setScore] = useState(null);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchHealthScore();
  }, [planId]);

  const fetchHealthScore = async () => {
    try {
      const response = await axios.get(`${API_URL}/health-score/${planId}`);
      setScore(response.data.healthScore);
      setDetails(response.data.details);
    } catch (error) {
      console.error('Failed to fetch health score:', error);
    }
  };

  const calculateHealthScore = async () => {
    setCalculating(true);
    try {
      const response = await axios.post(`${API_URL}/health-score/calculate/${planId}`);
      setScore(response.data.healthScore);
      setDetails(response.data.details);
    } catch (error) {
      console.error('Failed to calculate health score:', error);
      alert('Failed to calculate health score. Please try again.');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score) => {
    if (score >= 8) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 6) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Plan Health Score</h3>
        {!score && (
          <button
            onClick={calculateHealthScore}
            disabled={calculating}
            className="btn-primary flex items-center space-x-2"
          >
            {calculating ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Calculating...</span>
              </>
            ) : (
              <span>Calculate Score</span>
            )}
          </button>
        )}
      </div>

      {score !== null ? (
        <div className="space-y-4">
          <div className={`text-center p-6 rounded-2xl ${getScoreBgColor(score)}`}>
            <div className={`text-5xl font-bold ${getScoreColor(score)} mb-2`}>
              {score.toFixed(1)}/10
            </div>
            <div className="flex justify-center space-x-1">
              {[...Array(10)].map((_, i) => (
                <FaStar
                  key={i}
                  className={i < Math.round(score) ? 'text-yellow-400' : 'text-gray-300'}
                />
              ))}
            </div>
            {details?.overallFeedback && (
              <p className="text-gray-700 dark:text-gray-300 mt-3">{details.overallFeedback}</p>
            )}
          </div>

          {details?.strengths && details.strengths.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Strengths</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {details.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {details?.improvements && details.improvements.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Areas for Improvement</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {details.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {details?.breakdown && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Detailed Breakdown</h4>
              <div className="space-y-2">
                {Object.entries(details.breakdown).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="font-bold text-gray-800 dark:text-gray-200">{value.score}/10</span>
                    </div>
                    {value.feedback && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">{value.feedback}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={calculateHealthScore}
            disabled={calculating}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {calculating ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Recalculating...</span>
              </>
            ) : (
              <span>Recalculate Score</span>
            )}
          </button>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400 mb-4">No health score calculated yet.</p>
          <button
            onClick={calculateHealthScore}
            disabled={calculating}
            className="btn-primary"
          >
            {calculating ? 'Calculating...' : 'Calculate Health Score'}
          </button>
        </div>
      )}
    </div>
  );
};

export default HealthScore;






