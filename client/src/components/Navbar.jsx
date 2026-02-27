import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { FaUser, FaSignOutAlt } from 'react-icons/fa';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-black/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-0"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center justify-center transition-all duration-300"
            >
              <img 
                src="/logo.svg" 
                alt="Edvance Logo" 
                className="h-10 w-auto opacity-70 hover:opacity-100 drop-shadow-lg group-hover:drop-shadow-xl transition-all duration-300"
              />
            </motion.div>
            <span className="text-2xl font-bold text-white group-hover:text-indigo-200 transition-colors duration-300">
              Edvance
            </span>
          </Link>

          <div className="flex items-center space-x-2 md:space-x-6">
            {isAuthenticated && <ThemeToggle />}
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="hidden md:block text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Dashboard
                </Link>
                {user?.role !== 'admin' && (
                  <Link
                    to="/generate"
                    className="hidden md:block text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Generate
                  </Link>
                )}
                <Link
                  to="/plans"
                  className="text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Plans
                </Link>
                <Link
                  to="/templates"
                  className="hidden md:block text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  Templates
                </Link>
                {user?.role === 'HOD' && (
                  <Link
                    to="/approvals"
                    className="hidden md:block text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Approvals
                  </Link>
                )}
                {user?.role === 'admin' && (
                  <Link
                    to="/users"
                    className="hidden md:block text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                  >
                    Users
                  </Link>
                )}
                <Link
                  to="/profile"
                  className="flex items-center gap-2 text-white/90 hover:text-white transition-colors font-medium px-3 py-2 rounded-lg hover:bg-white/10"
                >
                  <FaUser className="text-sm" />
                  <span className="hidden md:inline">{user?.name}</span>
                </Link>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-300 font-medium"
                >
                  <FaSignOutAlt />
                  <span className="hidden md:inline">Logout</span>
                </motion.button>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-white/90 hover:text-white transition-colors font-medium px-4 py-2 rounded-lg hover:bg-white/10"
                >
                  Login
                </Link>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2 rounded-xl hover:shadow-lg transition-all duration-300 font-semibold"
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;



