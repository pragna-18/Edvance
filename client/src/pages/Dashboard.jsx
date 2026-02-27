import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaBook, FaFileAlt, FaCheckCircle, FaClock, FaPlus, FaUsers, FaUserShield } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activities, setActivities] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user?.role]);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard/stats`),
        axios.get(`${API_URL}/dashboard/analytics`)
      ]);

      setStats(statsRes.data.stats);
      setActivities(statsRes.data.recentActivities || []);
      setAnalytics(analyticsRes.data);

      // Fetch admin stats if user is admin
      if (user?.role === 'admin') {
        try {
          const usersRes = await axios.get(`${API_URL}/users`, { params: { limit: 1 } });
          setAdminStats({
            totalUsers: usersRes.data.pagination?.total || 0
          });
        } catch (error) {
          console.error('Failed to fetch admin stats:', error);
        }
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  const chartData = analytics?.activityByDate
    ? Object.entries(analytics.activityByDate)
        .map(([date, count]) => ({ date, activities: count }))
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(-7)
    : [];

  const activityTypeData = analytics?.activityByType
    ? Object.entries(analytics.activityByType).map(([name, value]) => ({
        name,
        value
      }))
    : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your overview.</p>
        </div>
        {user?.role !== 'admin' && (
          <Link to="/generate" className="btn-primary flex items-center space-x-2 whitespace-nowrap">
            <FaPlus />
            <span>Create New Plan</span>
          </Link>
        )}
      </div>

      {/* Admin Badge */}
      {user?.role === 'admin' && (
        <div className="mb-6 p-4 bg-gradient-to-r from-red-500 to-pink-500 rounded-2xl text-white">
          <div className="flex items-center space-x-3">
            <FaUserShield className="text-2xl" />
            <div>
              <p className="font-bold text-lg">Administrator Dashboard</p>
              <p className="text-sm opacity-90">You have full system access and management privileges</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className={`grid md:grid-cols-2 ${user?.role === 'admin' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'} gap-6 mb-8`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -4 }}
          className="card cursor-default"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.totalPlans || 0}</p>
            </div>
            <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-2xl">
              <FaBook className="text-4xl text-indigo-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ y: -4 }}
          className="card cursor-default"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Draft Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.draftPlans || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-800 rounded-2xl">
              <FaFileAlt className="text-4xl text-yellow-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ y: -4 }}
          className="card cursor-default"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Approved Plans</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.approvedPlans || 0}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-800 rounded-2xl">
              <FaCheckCircle className="text-4xl text-green-600" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          whileHover={{ y: -4 }}
          className="card cursor-default"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Pending Approvals</p>
              <p className="text-3xl font-bold text-gray-800 mt-2">{stats?.pendingApprovals || 0}</p>
            </div>
            <div className="p-3 bg-orange-100 dark:bg-orange-800 rounded-2xl">
              <FaClock className="text-4xl text-orange-600" />
            </div>
          </div>
        </motion.div>

        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -4 }}
            className="card cursor-default"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{adminStats?.totalUsers || 0}</p>
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-800 rounded-2xl">
                <FaUsers className="text-4xl text-purple-600" />
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Activity Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="activities" stroke="#14b8a6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Activity Types</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#14b8a6" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Recent Activities */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card"
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Activities</h2>
        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">{activity.description}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {activity.user?.name} • {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 dark:bg-primary-700 dark:text-white rounded-full text-sm">
                  {activity.action}
                </span>
              </div>
            ))
          ) : (
            <p className="text-gray-600 text-center py-8">No recent activities</p>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;




