import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaMap, FaSpinner, FaCheckCircle, FaCircle } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CurriculumCoverageMap = ({ planId, subject, grade }) => {
  const [coverageData, setCoverageData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (planId && subject && grade) {
      fetchCoverageMap();
    }
  }, [planId, subject, grade]);

  const fetchCoverageMap = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${API_URL}/curriculum/coverage-map`, {
        params: { subject, grade, planId }
      });
      setCoverageData(response.data.coverageMap);
      // If coverageMap is null, also clear any previous error
      if (!response.data.coverageMap && response.data.message) {
        setError('');
      }
    } catch (error) {
      console.error('Failed to fetch coverage map:', error);
      setError(error.response?.data?.error || 'Failed to load curriculum coverage map');
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

  if (error) {
    return (
      <div className="card">
        <p className="text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={fetchCoverageMap}
          className="mt-3 btn-primary text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!coverageData) {
    return (
      <div className="card">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center space-x-2">
          <FaMap />
          <span>Curriculum Coverage Map</span>
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Coverage map will be generated automatically when you add more details to your lesson plan or check curriculum alignment.
        </p>
        <div className="flex gap-2">
          <button
            onClick={fetchCoverageMap}
            className="btn-primary text-sm"
          >
            Refresh
          </button>
        </div>
      </div>
    );
  }

  const totalTopics = coverageData.topics?.length || 0;
  const coveredTopics = coverageData.topics?.filter(t => t.covered)?.length || 0;
  const coveragePercentage = totalTopics > 0 ? Math.round((coveredTopics / totalTopics) * 100) : 0;

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center space-x-2">
        <FaMap />
        <span>Curriculum Coverage Map</span>
      </h3>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Coverage</span>
          <span className="text-lg font-bold text-primary-600">{coveragePercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${coveragePercentage}%` }}
            transition={{ duration: 1 }}
            className="bg-gradient-to-r from-primary-500 to-primary-600 h-3 rounded-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {coveredTopics} of {totalTopics} topics covered
        </p>
      </div>

      {coverageData.topics && coverageData.topics.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-800 dark:text-gray-200">Topics Coverage</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {coverageData.topics.map((topic, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`p-3 rounded-lg border-2 ${
                  topic.covered
                    ? 'bg-green-50 border-green-300'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center space-x-2">
                  {topic.covered ? (
                    <FaCheckCircle className="text-green-600" />
                  ) : (
                    <FaCircle className="text-gray-400" />
                  )}
                  <span className={`text-sm font-medium ${
                    topic.covered ? 'text-green-800' : 'text-gray-600'
                  }`}>
                    {topic.name}
                  </span>
                </div>
                {topic.standard && (
                  <p className="text-xs text-gray-500 mt-1 ml-6">{topic.standard}</p>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {coverageData.uncoveredTopics && coverageData.uncoveredTopics.length > 0 && (
        <div className="mt-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
          <h4 className="font-semibold text-orange-800 mb-2">Uncovered Topics</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-orange-700">
            {coverageData.uncoveredTopics.map((topic, index) => (
              <li key={index}>{topic}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CurriculumCoverageMap;

