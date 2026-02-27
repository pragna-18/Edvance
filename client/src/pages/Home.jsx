import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Spline from '@splinetool/react-spline';
import { 
  FaRobot, FaUsers, FaChartLine, FaCheckCircle, FaFilePdf, 
  FaFilePowerpoint, FaQuestionCircle, FaFileAlt, FaMagic, 
  FaShieldAlt, FaClock, FaGraduationCap, FaLightbulb,
  FaArrowRight, FaStar, FaQuoteLeft
} from 'react-icons/fa';

const Home = () => {
  const { isAuthenticated } = useAuth();
  const [splineLoaded, setSplineLoaded] = useState(false);

  
  const features = [
    {
      icon: FaRobot,
      title: 'AI-Powered Generation',
      description: 'Generate comprehensive lesson plans instantly using advanced AI technology',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FaUsers,
      title: 'Real-time Collaboration',
      description: 'Work together with colleagues in real-time on lesson plans',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: FaChartLine,
      title: 'Version Control',
      description: 'Track changes and revert to previous versions effortlessly',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: FaCheckCircle,
      title: 'Approval Workflow',
      description: 'Streamlined approval process for HOD review and management',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: FaFilePdf,
      title: 'PDF Export',
      description: 'Export professional lesson plans as PDF documents',
      color: 'from-red-500 to-rose-500'
    },
    {
      icon: FaFilePowerpoint,
      title: 'PPT Generation',
      description: 'Create beautiful PowerPoint presentations from lesson plans',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: FaQuestionCircle,
      title: 'Quiz Generation',
      description: 'AI-powered quiz generation based on lesson content',
      color: 'from-indigo-500 to-blue-500'
    },
    {
      icon: FaFileAlt,
      title: 'Question Papers',
      description: 'Generate comprehensive question papers with answer keys',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'Mathematics Teacher',
      content: 'Edvance has revolutionized how I plan my lessons. The AI suggestions are incredibly helpful!',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Science Department Head',
      content: 'The collaboration features make it so easy to work with my team. Highly recommended!',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'English Teacher',
      content: 'Exporting to PDF and PPT saves me hours every week. This platform is a game-changer!',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-black relative">
      {/* Spline 3D Background - Full Screen */}
      <div className="fixed inset-0 w-full h-full z-0">
        <div className="spline-container w-full h-full" style={{ isolation: 'isolate' }}>
          <Spline 
            scene="https://prod.spline.design/ckzPlzkF9bxkaaMa/scene.splinecode"
            onLoad={() => {
              console.log('Spline loaded successfully');
              setSplineLoaded(true);
            }}
            onError={(error) => {
              console.error('Spline loading error:', error);
              // Show content even if Spline fails
              setSplineLoaded(true);
            }}
            style={{ width: '100%', height: '100%' }}
          />
        </div>
        {/* Fallback gradient background while Spline loads or if it fails */}
        {!splineLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900 to-black" />
        )}
        {/* Dark overlay for better text readability */}
        <div className="absolute inset-0 bg-black/50 z-10 pointer-events-none" />
      </div>

      {/* Hero Section */}
      <section className="relative text-white py-32 overflow-hidden min-h-screen flex items-center z-20">

        <div className="container mx-auto px-4 relative z-30">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-block mb-8"
            >
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-white drop-shadow-lg"
            >
              Edvance
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-2xl md:text-3xl mb-4 font-semibold"
            >
              Transform Your Teaching with AI
            </motion.p>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-lg md:text-xl mb-12 text-white/90 max-w-2xl mx-auto leading-relaxed"
            >
              Create, collaborate, and manage lesson plans effortlessly. Export to PDF, generate quizzes, 
              and create presentations—all powered by cutting-edge AI technology.
            </motion.p>
            
            {!isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-col sm:flex-row justify-center items-center gap-4"
              >
                <Link
                  to="/register"
                  className="group relative bg-white text-indigo-600 hover:bg-gray-50 text-lg font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  Get Started Free
                  <FaArrowRight className="group-hover:translate-x-1 transition-transform duration-300" />
                </Link>
                <Link
                  to="/login"
                  className="bg-white/10 backdrop-blur-lg text-white border-2 border-white/30 hover:bg-white/20 hover:border-white/50 text-lg font-semibold px-8 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                >
                  Sign In
                </Link>
              </motion.div>
            )}
            {isAuthenticated && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Link
                  to="/dashboard"
                  className="inline-block bg-white text-indigo-600 hover:bg-gray-100 text-lg font-semibold px-8 py-4 rounded-2xl transition-all duration-300 shadow-2xl hover:shadow-white/50 hover:scale-105"
                >
                  Go to Dashboard
                </Link>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-24 z-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Powerful Features
            </h2>
            <p className="text-xl text-white/80 max-w-2xl mx-auto">
              Everything you need to create, manage, and deliver exceptional lesson plans
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="group relative"
                >
                  <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-0 h-full hover:bg-white/15 hover:-translate-y-1">
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.color} mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="text-white text-2xl" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white group-hover:text-blue-300 transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-white/80 leading-relaxed group-hover:text-white/90 transition-colors duration-300">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative py-24 z-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white">
              Why Choose Edvance?
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { icon: FaClock, title: 'Save Time', desc: 'Generate lesson plans in minutes, not hours' },
              { icon: FaShieldAlt, title: 'Secure & Reliable', desc: 'Your data is safe with enterprise-grade security' },
              { icon: FaLightbulb, title: 'AI-Powered Insights', desc: 'Get intelligent suggestions and improvements' }
            ].map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 shadow-lg">
                    <Icon className="text-white text-3xl" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{benefit.title}</h3>
                  <p className="text-white/80">{benefit.desc}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;

















