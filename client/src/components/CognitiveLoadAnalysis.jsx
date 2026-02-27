import { useState } from 'react';
import axios from 'axios';
import { FaBrain, FaSpinner, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CognitiveLoadAnalysis = ({ planId }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const analyzeLoad = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_URL}/cognitive-load/analyze/${planId}`);
      setAnalysis(response.data.analysis);
    } catch (error) {
      console.error('Failed to analyze cognitive load:', error);
      setError('Failed to analyze cognitive load. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getLoadColor = (load) => {
    if (load === 'low') return 'text-green-600';
    if (load === 'moderate') return 'text-yellow-600';
    if (load === 'high') return 'text-orange-600';
    return 'text-red-600';
  };

  const getLoadBgColor = (load) => {
    if (load === 'low') return 'bg-green-100 dark:bg-green-900/20';
    if (load === 'moderate') return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (load === 'high') return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 flex items-center space-x-2">
          <FaBrain />
          <span>Cognitive Load Analysis</span>
        </h3>
        {!analysis && (
          <button
            onClick={analyzeLoad}
            disabled={loading}
            className="btn-primary text-sm flex items-center space-x-2"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Analyzing...</span>
              </>
            ) : (
              <span>Analyze Load</span>
            )}
          </button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {analysis && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Overall Load */}
          <div className={`p-4 rounded-lg ${getLoadBgColor(analysis.overallLoad)}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-800 dark:text-gray-200">Overall Cognitive Load</span>
              <span className={`text-2xl font-bold ${getLoadColor(analysis.overallLoad)}`}>
                {analysis.overallLoad.toUpperCase()}
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${analysis.loadScore}%` }}
                transition={{ duration: 1 }}
                className={`h-2 rounded-full ${
                  analysis.loadScore < 40 ? 'bg-green-500' :
                  analysis.loadScore < 70 ? 'bg-yellow-500' :
                  analysis.loadScore < 85 ? 'bg-orange-500' : 'bg-red-500'
                }`}
              />
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Score: {analysis.loadScore}/100</p>
          </div>

          {/* Intrinsic Load */}
          {analysis.intrinsicLoad && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Intrinsic Load</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{analysis.intrinsicLoad.assessment}</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">New Concepts:</span>
                  <span className="font-semibold ml-1">{analysis.intrinsicLoad.newConcepts || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">New Terms:</span>
                  <span className="font-semibold ml-1">{analysis.intrinsicLoad.newTerms || 0}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Complexity:</span>
                  <span className="font-semibold ml-1 capitalize">{analysis.intrinsicLoad.complexity || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Pacing Analysis */}
          {analysis.pacingAnalysis && (
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Pacing Analysis</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{analysis.pacingAnalysis.assessment}</p>
              {analysis.pacingAnalysis.conceptsPerMinute && (
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Concepts per minute: <span className="font-semibold">{analysis.pacingAnalysis.conceptsPerMinute.toFixed(2)}</span>
                </p>
              )}
              {analysis.pacingAnalysis.riskLevel && (
                <div className="mt-2 flex items-center space-x-2">
                  {analysis.pacingAnalysis.riskLevel === 'high' ? (
                    <FaExclamationTriangle className="text-red-600" />
                  ) : (
                    <FaCheckCircle className="text-green-600" />
                  )}
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                    Risk Level: {analysis.pacingAnalysis.riskLevel.toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
              <h4 className="font-semibold text-orange-800 dark:text-orange-300 mb-2 flex items-center space-x-2">
                <FaExclamationTriangle />
                <span>Optimization Recommendations</span>
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium text-orange-800 dark:text-orange-300">
                      {rec.priority === 'high' ? '🔴 High Priority: ' : 
                       rec.priority === 'medium' ? '🟡 Medium Priority: ' : '🟢 Low Priority: '}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{rec.issue}</span>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 ml-4">
                      → {rec.suggestion}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Breakdown Recommendation */}
          {analysis.breakdownRecommendation && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                💡 {analysis.breakdownRecommendation}
              </p>
            </div>
          )}

          <button
            onClick={() => setAnalysis(null)}
            className="btn-secondary w-full text-sm"
          >
            Analyze Again
          </button>
        </motion.div>
      )}
    </div>
  );
};

export default CognitiveLoadAnalysis;

