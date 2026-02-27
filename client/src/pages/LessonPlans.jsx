import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaEdit, FaTrash, FaEye, FaPaperPlane, FaFilter } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    subject: '',
    grade: ''
  });

  useEffect(() => {
    fetchPlans();
  }, [filters]);

  const fetchPlans = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.grade) params.append('grade', filters.grade);

      const response = await axios.get(`${API_URL}/lesson-plans?${params}`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch lesson plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this lesson plan?')) return;

    try {
      await axios.delete(`${API_URL}/lesson-plans/${id}`);
      fetchPlans();
    } catch (error) {
      console.error('Failed to delete lesson plan:', error);
      alert('Failed to delete lesson plan');
    }
  };

  const handleSubmit = async (id) => {
    try {
      await axios.post(`${API_URL}/lesson-plans/${id}/submit`);
      fetchPlans();
      alert('Lesson plan submitted for approval');
    } catch (error) {
      console.error('Failed to submit lesson plan:', error);
      alert('Failed to submit lesson plan');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white',
      submitted: 'bg-yellow-200 text-yellow-800 dark:bg-yellow-700 dark:text-white',
      approved: 'bg-green-200 text-green-800 dark:bg-green-700 dark:text-white',
      rejected: 'bg-red-200 text-red-800 dark:bg-red-700 dark:text-white',
      revision_requested: 'bg-orange-200 text-orange-800 dark:bg-orange-700 dark:text-white'
    };
    return colors[status] || 'bg-gray-200 text-gray-800';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Lesson Plans</h1>
          <p className="text-gray-600">View and manage all your lesson plans</p>
        </div>
        <Link to="/generate" className="btn-primary">
          Create New Plan
        </Link>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex items-center space-x-4">
          <FaFilter className="text-gray-600" />
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">All Status</option>
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
            <option value="revision_requested">Revision Requested</option>
          </select>
          <input
            type="text"
            placeholder="Filter by subject"
            value={filters.subject}
            onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            className="input-field w-auto"
          />
          <input
            type="text"
            placeholder="Filter by grade"
            value={filters.grade}
            onChange={(e) => setFilters({ ...filters, grade: e.target.value })}
            className="input-field w-auto"
          />
        </div>
      </div>

      {/* Plans List */}
      <div className="grid gap-4">
        {plans.length > 0 ? (
          plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card hover:shadow-xl transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{plan.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(plan.status)}`}>
                      {plan.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mb-2">
                    <p className="text-gray-600">
                      <span className="font-medium">Subject:</span> {plan.subject} |{' '}
                      <span className="font-medium">Grade:</span> {plan.grade} |{' '}
                      <span className="font-medium">Version:</span> {plan.version}
                    </p>
                    {plan.healthScore && (
                      <div className="flex items-center space-x-1">
                        <span className="text-xs font-medium text-gray-600">Health:</span>
                        <span className={`text-sm font-bold ${
                          plan.healthScore >= 8 ? 'text-green-600' :
                          plan.healthScore >= 6 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {plan.healthScore.toFixed(1)}/10
                        </span>
                      </div>
                    )}
                  </div>
                  {plan.topic && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Topic:</span> {plan.topic}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Created: {new Date(plan.createdAt).toLocaleDateString()} |{' '}
                    Updated: {new Date(plan.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/plans/${plan.id}`}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    title="View"
                  >
                    <FaEye />
                  </Link>
                  {plan.status === 'draft' && (
                    <>
                      <Link
                        to={`/collaborate/${plan.id}`}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                        title="Collaborate"
                      >
                        <FaEdit />
                      </Link>
                      <button
                        onClick={() => handleSubmit(plan.id)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition-colors"
                        title="Submit for Approval"
                      >
                        <FaPaperPlane />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(plan.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="card text-center py-12">
            <p className="text-gray-600 mb-4">No lesson plans found</p>
            <Link to="/generate" className="btn-primary">
              Create Your First Lesson Plan
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonPlans;

