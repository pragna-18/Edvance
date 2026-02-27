import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { FaUser, FaEnvelope, FaCalendar, FaShieldAlt, FaFileAlt, FaCheckCircle, FaClock, FaPaperPlane } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Profile = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/dashboard/stats`);
      setStats(response.data.stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    } finally {
      setLoading(false);
    }
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

  const getRoleBadgeColor = (role) => {
    const colors = {
      teacher: 'bg-blue-200 text-blue-800 dark:bg-blue-800 dark:text-white',
      HOD: 'bg-purple-200 text-purple-800 dark:bg-purple-800 dark:text-white',
      admin: 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-white'
    };
    return colors[role] || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800">Profile</h1>
        <p className="text-gray-600">Manage your account information and view your statistics</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2"
        >
          <div className="card">
            <h2 className="text-xl font-semibold mb-6 text-gray-800">Personal Information</h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{user?.name}</h3>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user?.role)}`}>
                    {user?.role}
                  </span>
                </div>
              </div>

                  <div className="border-t pt-4 space-y-4">
                <div className="flex items-center space-x-3">
                  <FaEnvelope className="text-gray-600" />
                  <div>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Email</p>
                        <p className="font-medium text-gray-800 dark:text-white">{user?.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <FaShieldAlt className="text-gray-600 dark:text-gray-300" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Role</p>
                    <p className="font-medium text-gray-800 dark:text-white capitalize">{user?.role}</p>
                  </div>
                </div>

                {user?.createdAt && (
                  <div className="flex items-center space-x-3">
                    <FaCalendar className="text-gray-600 dark:text-gray-300" />
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">Member Since</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Sidebar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Quick Stats</h3>
            <div className="space-y-4">
              <div className="p-4 bg-primary-50 dark:bg-primary-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Plans</p>
                  <FaFileAlt className="text-primary-600 dark:text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.totalPlans || 0}</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Approved Plans</p>
                  <FaCheckCircle className="text-green-600 dark:text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.approvedPlans || 0}</p>
              </div>
              <div className="p-4 bg-yellow-50 dark:bg-yellow-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Draft Plans</p>
                  <FaClock className="text-yellow-600 dark:text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.draftPlans || 0}</p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-700 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-300">Submitted Plans</p>
                  <FaPaperPlane className="text-blue-600 dark:text-white" />
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.submittedPlans || 0}</p>
              </div>
              {user?.role === 'HOD' || user?.role === 'admin' ? (
                <div className="p-4 bg-purple-50 dark:bg-purple-700 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Pending Approvals</p>
                    <FaClock className="text-purple-600 dark:text-white" />
                  </div>
                  <p className="text-2xl font-bold text-gray-800 dark:text-white">{stats?.pendingApprovals || 0}</p>
                </div>
              ) : null}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;




