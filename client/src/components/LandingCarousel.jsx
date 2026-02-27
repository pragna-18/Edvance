import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaRobot, FaUsers, FaChartLine, FaCheckCircle, FaFilePdf,
  FaFilePowerpoint, FaQuestionCircle, FaFileAlt, FaGraduationCap,
  FaClock, FaShieldAlt, FaLightbulb, FaStar, FaArrowLeft, FaArrowRight,
} from 'react-icons/fa';

const features = [
  { icon: FaRobot, title: 'AI-Powered Generation', desc: 'Generate comprehensive lesson plans instantly using advanced AI technology', color: 'from-blue-500 to-cyan-500' },
  { icon: FaUsers, title: 'Real-time Collaboration', desc: 'Work together with colleagues in real-time on lesson plans', color: 'from-purple-500 to-pink-500' },
  { icon: FaChartLine, title: 'Version Control', desc: 'Track changes and revert to previous versions effortlessly', color: 'from-green-500 to-emerald-500' },
  { icon: FaCheckCircle, title: 'Approval Workflow', desc: 'Streamlined approval process for HOD review and management', color: 'from-orange-500 to-red-500' },
  { icon: FaFilePdf, title: 'PDF Export', desc: 'Export professional lesson plans as PDF documents', color: 'from-red-500 to-rose-500' },
  { icon: FaFilePowerpoint, title: 'PPT Generation', desc: 'Create beautiful PowerPoint presentations from lesson plans', color: 'from-yellow-500 to-amber-500' },
  { icon: FaQuestionCircle, title: 'Quiz Generation', desc: 'AI-powered quiz generation based on lesson content', color: 'from-indigo-500 to-blue-500' },
  { icon: FaFileAlt, title: 'Question Papers', desc: 'Generate comprehensive question papers with answer keys', color: 'from-teal-500 to-cyan-500' },
];

const testimonials = [
  { name: 'Sarah Johnson', role: 'Mathematics Teacher', content: 'Edvance has revolutionized how I plan my lessons. The AI suggestions are incredibly helpful!', rating: 5 },
  { name: 'Michael Chen', role: 'Science Department Head', content: 'The collaboration features make it so easy to work with my team. Highly recommended!', rating: 5 },
  { name: 'Emily Rodriguez', role: 'English Teacher', content: 'Exporting to PDF and PPT saves me hours every week. This platform is a game-changer!', rating: 5 }
];

const benefits = [
  { icon: FaClock, title: 'Save Time', desc: 'Generate lesson plans in minutes, not hours' },
  { icon: FaShieldAlt, title: 'Secure & Reliable', desc: 'Your data is safe with enterprise-grade security' },
  { icon: FaLightbulb, title: 'AI-Powered Insights', desc: 'Get intelligent suggestions and improvements' }
];

const slides = [
  { key: 'features', title: 'Powerful Features' },
  { key: 'testimonials', title: 'What Teachers Say' },
  { key: 'benefits', title: 'Why Choose Edvance?' }
];

const slideVariants = {
  enter: (direction) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function LandingCarousel() {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  function paginate(newIndex) {
    const dir = newIndex > index ? 1 : -1;
    setDirection(dir);
    setIndex((prev) => (newIndex + slides.length) % slides.length);
  }

  return (
    <section className="relative py-24 z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-4xl md:text-5xl font-bold text-white">{slides[index].title}</h2>
          <div className="flex items-center gap-3">
            <button
              aria-label="previous"
              onClick={() => paginate(index - 1)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <FaArrowLeft />
            </button>
            <button
              aria-label="next"
              onClick={() => paginate(index + 1)}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
            >
              <FaArrowRight />
            </button>
          </div>
        </div>

        <div className="relative h-auto">
          <AnimatePresence custom={direction} initial={false} mode="wait">
            {slides[index].key === 'features' && (
              <motion.div
                key="features"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {features.map((f, i) => {
                  const Icon = f.icon;
                  return (
                    <div key={i} className="bg-white/8 backdrop-blur-lg rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-0 h-full">
                      <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.color} mb-4 shadow-lg`}> 
                        <Icon className="text-white text-2xl" />
                      </div>
                      <h3 className="text-xl font-bold mb-3 text-white">{f.title}</h3>
                      <p className="text-white/80 leading-relaxed">{f.desc}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}

            {slides[index].key === 'testimonials' && (
              <motion.div
                key="testimonials"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="grid md:grid-cols-3 gap-8"
              >
                {testimonials.map((t, i) => (
                  <div key={i} className="bg-white/8 backdrop-blur-lg rounded-3xl p-8 shadow-lg border-0 hover:shadow-2xl transition-all duration-300 hover:bg-white/12 hover:-translate-y-1">
                    <div className="flex items-center gap-2 mb-4">
                      {[...Array(t.rating)].map((_, r) => (
                        <FaStar key={r} className="text-yellow-400" />
                      ))}
                    </div>
                    <p className="text-white/90 mb-6 leading-relaxed italic text-base">"{t.content}"</p>
                    <div className="pt-4 border-t border-white/10">
                      <div className="font-bold text-white">{t.name}</div>
                      <div className="text-sm text-white/70">{t.role}</div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {slides[index].key === 'benefits' && (
              <motion.div
                key="benefits"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
              >
                {benefits.map((b, i) => {
                  const Icon = b.icon;
                  return (
                    <div key={i} className="text-center">
                      <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 shadow-lg">
                        <Icon className="text-white text-3xl" />
                      </div>
                      <h3 className="text-xl font-bold mb-2 text-white">{b.title}</h3>
                      <p className="text-white/80">{b.desc}</p>
                    </div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Dots */}
          <div className="mt-8 flex justify-center items-center gap-3">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => paginate(i)}
                className={`w-3 h-3 rounded-full ${i === index ? 'bg-white' : 'bg-white/30'}`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
