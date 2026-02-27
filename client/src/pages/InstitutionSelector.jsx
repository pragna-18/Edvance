import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaSchool, FaUniversity, FaChalkboardUser, FaFamilyDots, FaArrowLeft } from 'react-icons/fa';

const InstitutionSelector = () => {
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const navigate = useNavigate();

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
      <button
        onClick={handleBackToHome}
        className="absolute top-8 left-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
      >
        <FaArrowLeft />
        <span>Back to Home</span>
      </button>

      {/* Institution Selection View */}
      {!selectedInstitution && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-16">
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-5xl md:text-6xl font-bold text-white mb-4"
            >
              Welcome to Edvance
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl md:text-2xl text-white/80"
            >
              Select your institution type to get started
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* School Option */}
            <motion.button
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedInstitution('school')}
              className="group relative overflow-hidden rounded-3xl p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 border-2 border-indigo-400/50 hover:border-indigo-300"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <FaSchool className="text-7xl text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-3xl font-bold text-white mb-3">School</h3>
                <p className="text-indigo-100 text-lg mb-6">For school teachers and parents</p>
                <span className="inline-block px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl group-hover:bg-indigo-50 transition-colors duration-300">
                  Continue
                </span>
              </div>
            </motion.button>

            {/* College Option */}
            <motion.button
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedInstitution('college')}
              className="group relative overflow-hidden rounded-3xl p-10 bg-gradient-to-br from-purple-600 to-purple-800 shadow-2xl hover:shadow-purple-500/50 transition-all duration-300 border-2 border-purple-400/50 hover:border-purple-300"
            >
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <FaUniversity className="text-7xl text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-3xl font-bold text-white mb-3">College</h3>
                <p className="text-purple-100 text-lg mb-6">For college educators</p>
                <span className="inline-block px-6 py-3 bg-white text-purple-600 font-semibold rounded-xl group-hover:bg-purple-50 transition-colors duration-300">
                  Continue
                </span>
              </div>
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* School User Type Selection View */}
      {selectedInstitution === 'school' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl"
        >
          <div className="text-center mb-16">
            <motion.button
              onClick={() => setSelectedInstitution(null)}
              className="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors mx-auto"
              whileHover={{ x: -5 }}
            >
              <FaArrowLeft />
              <span>Back</span>
            </motion.button>

            <motion.h2
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-4xl md:text-5xl font-bold text-white mb-4"
            >
              School Users
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-lg md:text-xl text-white/80"
            >
              Select your role to continue
            </motion.p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Teacher Option */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Link
                to="/register?role=teacher&institution=school"
                className="group relative overflow-hidden rounded-3xl p-10 bg-gradient-to-br from-blue-600 to-blue-800 shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 border-2 border-blue-400/50 hover:border-blue-300 block h-full hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <FaChalkboardUser className="text-7xl text-white mx-auto mb-6 group-hover:scale-110 transition-transform duration-300" />
                  <h3 className="text-3xl font-bold text-white mb-3">Teacher</h3>
                  <p className="text-blue-100 text-lg mb-6">Sign up or login as teacher</p>
                  <span className="inline-block px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl group-hover:bg-blue-50 transition-colors duration-300">
                    Continue
                  </span>
                </div>
              </Link>
            </motion.div>

            {/* Parents Option */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={() => alert('Parents portal coming soon!')}
                className="group relative overflow-hidden rounded-3xl p-10 bg-gradient-to-br from-green-600 to-green-800 shadow-2xl hover:shadow-green-500/50 transition-all duration-300 border-2 border-green-400/50 hover:border-green-300 w-full opacity-60 cursor-not-allowed h-full hover:scale-105"
                disabled
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <FaFamilyDots className="text-7xl text-white mx-auto mb-6" />
                  <h3 className="text-3xl font-bold text-white mb-3">Parents</h3>
                  <p className="text-green-100 text-lg mb-6">Coming soon</p>
                  <span className="inline-block px-6 py-3 bg-gray-400 text-white font-semibold rounded-xl">
                    Coming Soon
                  </span>
                </div>
              </button>
            </motion.div>
          </div>
        </motion.div>
      )}

      {/* College User Type Selection View */}
      {selectedInstitution === 'college' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-2xl text-center"
        >
          <motion.button
            onClick={() => setSelectedInstitution(null)}
            className="mb-8 flex items-center gap-2 text-white/70 hover:text-white transition-colors mx-auto"
            whileHover={{ x: -5 }}
          >
            <FaArrowLeft />
            <span>Back</span>
          </motion.button>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-3xl p-12 shadow-2xl border border-purple-400/30"
          >
            <FaUniversity className="text-7xl text-white mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">College Portal</h2>
            <p className="text-white/80 mb-8">
              You will be redirected to the main dashboard where you can access all college educator features.
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-8 py-4 bg-white text-purple-600 font-semibold rounded-2xl hover:bg-purple-50 transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Go to Dashboard
            </Link>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default InstitutionSelector;
