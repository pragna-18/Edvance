import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaRobot, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AIModelSelector = ({ selectedModel, onModelChange }) => {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAvailableModels();
  }, []);

  const fetchAvailableModels = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/ai/available-models`);
      setModels(response.data.models || []);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch models:', err);
      setError('Unable to load available AI models');
      // Fallback to default models
      setModels([
        {
          id: 'gemini',
          name: 'Google Gemini',
          description: 'Fast, accurate, and powerful AI model from Google',
          available: true,
          model: 'gemini-2.0-flash'
        },
        {
          id: 'groq',
          name: 'Groq Mixtral',
          description: 'Fast and efficient open-source model',
          available: true,
          model: 'mixtral-8x7b-32768'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6 bg-gradient-to-br from-primary-50 to-primary-100 rounded-xl border border-primary-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <span className="ml-3 text-gray-600">Loading AI models...</span>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <FaRobot className="text-primary-600 text-2xl" />
        <label className="text-lg font-semibold text-gray-800 dark:text-white">
          Select AI Model for Lesson Generation
        </label>
      </div>

      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        Choose which AI model to use for generating your lesson plan. Each model has unique strengths.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
          <FaExclamationCircle />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {models.map((model) => (
          <motion.button
            key={model.id}
            onClick={() => {
              if (model.available) {
                onModelChange(model.id);
              }
            }}
            disabled={!model.available}
            whileHover={model.available ? { scale: 1.02, y: -2 } : {}}
            whileTap={model.available ? { scale: 0.98 } : {}}
            className={`relative overflow-hidden rounded-2xl p-4 transition-all duration-300 text-left ${
              selectedModel === model.id
                ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/50'
                : model.available
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 dark:hover:border-primary-400'
                : 'bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-400 border-2 border-gray-200 dark:border-gray-700 opacity-60 cursor-not-allowed'
            }`}
          >
            {/* Selected badge */}
            {selectedModel === model.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute top-2 right-2 bg-white/20 rounded-full p-1"
              >
                <FaCheckCircle className="text-white text-lg" />
              </motion.div>
            )}

            <div className="mb-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base leading-tight">{model.name}</h4>
                  <p className="text-xs opacity-75 mt-1">{model.model}</p>
                </div>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-3 opacity-80">
              {model.description}
            </p>

            <div className="flex items-center justify-between">
              {model.available ? (
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full font-medium flex items-center gap-1">
                  <FaCheckCircle />
                  Available
                </span>
              ) : (
                <span className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1 rounded-full font-medium">
                  Not Available
                </span>
              )}
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default AIModelSelector;
