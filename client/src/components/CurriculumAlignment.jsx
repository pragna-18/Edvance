import { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';
import { motion } from 'framer-motion';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CurriculumAlignment = ({ planId }) => {
  const [alignment, setAlignment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [formData, setFormData] = useState({
    country: 'US',
    gradeLevel: '',
    curriculumStandards: '',
    syllabus: ''
  });

  useEffect(() => {
    fetchAlignment();
  }, [planId]);

  const fetchAlignment = async () => {
    try {
      const response = await axios.get(`${API_URL}/curriculum/${planId}`);
      setAlignment(response.data.alignment);
    } catch (error) {
      console.error('Failed to fetch curriculum alignment:', error);
    }
  };

  const checkAlignment = async () => {
    setChecking(true);
    try {
      const response = await axios.post(`${API_URL}/curriculum/check-alignment/${planId}`, formData);
      setAlignment(response.data.alignment);
    } catch (error) {
      console.error('Failed to check curriculum alignment:', error);
      alert('Failed to check curriculum alignment. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const regeneratePlan = async () => {
    if (!window.confirm('This will regenerate the lesson plan to improve curriculum alignment. The current version will be saved. Continue?')) {
      return;
    }
    
    setRegenerating(true);
    try {
      const response = await axios.post(`${API_URL}/curriculum/regenerate/${planId}`, formData);
      alert(response.data.message || 'Lesson plan regenerated successfully! Please refresh the page to see the updated plan.');
      setAlignment(null); // Reset alignment so it can be rechecked
      // Optionally reload the page
      window.location.reload();
    } catch (error) {
      console.error('Failed to regenerate lesson plan:', error);
      alert('Failed to regenerate lesson plan: ' + (error.response?.data?.error || error.message));
    } finally {
      setRegenerating(false);
    }
  };

  const getAlignmentColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAlignmentBgColor = (score) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900/30';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900/30';
    return 'bg-red-100 dark:bg-red-900/30';
  };

  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Curriculum Alignment</h3>

      {!alignment ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Country/Region
            </label>
            <select
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              className="input-field"
            >
              <option value="US">United States</option>
              <option value="UK">United Kingdom</option>
              <option value="CA">Canada</option>
              <option value="AU">Australia</option>
              <option value="IN">India</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Grade Level (Optional)
            </label>
            <input
              type="text"
              value={formData.gradeLevel}
              onChange={(e) => setFormData({ ...formData, gradeLevel: e.target.value })}
              className="input-field"
              placeholder="e.g., Grade 10"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Standards (Optional)
            </label>
            <textarea
              value={formData.curriculumStandards}
              onChange={(e) => setFormData({ ...formData, curriculumStandards: e.target.value })}
              className="input-field"
              rows="3"
              placeholder="Enter specific curriculum standards to check..."
            />
          </div>

          <button
            onClick={checkAlignment}
            disabled={checking}
            className="btn-primary w-full flex items-center justify-center space-x-2"
          >
            {checking ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Checking Alignment...</span>
              </>
            ) : (
              <span>Check Alignment</span>
            )}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className={`text-center p-6 rounded-2xl ${getAlignmentBgColor(alignment.alignmentScore)}`}>
            <div className={`text-4xl font-bold ${getAlignmentColor(alignment.alignmentScore)} mb-2`}>
              {alignment.alignmentScore}%
            </div>
            <div className="flex items-center justify-center space-x-2">
              {alignment.overallAlignment === 'excellent' || alignment.overallAlignment === 'good' ? (
                <FaCheckCircle className="text-green-600" />
              ) : (
                <FaExclamationTriangle className="text-yellow-600" />
              )}
              <span className="font-medium text-gray-700 dark:text-gray-300 capitalize">
                {alignment.overallAlignment} Alignment
              </span>
            </div>
          </div>

          {alignment.alignedStandards && alignment.alignedStandards.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Aligned Standards</h4>
              <div className="space-y-2">
                {alignment.alignedStandards.map((standard, index) => (
                  <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-gray-800 dark:text-gray-200">{standard.standard}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        standard.coverage === 'fully' ? 'bg-green-100 text-green-700' :
                        standard.coverage === 'partially' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {standard.coverage}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{standard.description}</p>
                    {standard.evidence && (
                      <p className="text-xs text-gray-500 dark:text-gray-500">Evidence: {standard.evidence}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {alignment.gaps && alignment.gaps.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Identified Gaps</h4>
              <div className="space-y-2">
                {alignment.gaps.map((gap, index) => (
                  <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="font-medium text-gray-800 dark:text-gray-200 mb-1">{gap.area}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{gap.missing}</p>
                    <p className="text-xs text-primary-600">Suggestion: {gap.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {alignment.recommendations && alignment.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Recommendations</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                {alignment.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </div>
          )}

          {alignment.alignmentScore < 60 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
              <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                <strong>Low Alignment Score:</strong> The curriculum alignment is below 60%. 
                You can regenerate the lesson plan to improve alignment with curriculum standards.
              </p>
              <button
                onClick={regeneratePlan}
                disabled={regenerating}
                className="btn-primary w-full flex items-center justify-center space-x-2"
              >
                {regenerating ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Regenerating Plan...</span>
                  </>
                ) : (
                  <span>Regenerate Plan for Better Alignment</span>
                )}
              </button>
            </div>
          )}

          <button
            onClick={checkAlignment}
            disabled={checking}
            className="btn-secondary w-full flex items-center justify-center space-x-2"
          >
            {checking ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Rechecking...</span>
              </>
            ) : (
              <span>Recheck Alignment</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default CurriculumAlignment;






