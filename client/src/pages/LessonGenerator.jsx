import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaMagic, FaSpinner } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import PedagogyRecommendation from '../components/PedagogyRecommendation';
import AIModelSelector from '../components/AIModelSelector';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonGenerator = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.role === 'admin') {
      navigate('/dashboard');
    }
  }, [user, navigate]);
  const [formData, setFormData] = useState({
    subject: '',
    topic: '',
    educationLevel: 'school', // 'school' or 'college'
    grade: '',
    fieldOfStudy: '',
    year: '',
    duration: 45,
    approach: 'interactive',
    includeCaseStudies: false,
    includeDiscussionQuestions: false,
    aiModel: 'gemini'  // New: AI model selection
  });
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const collegeFields = [
    'Engineering',
    'Medicine',
    'Business',
    'Computer Science',
    'Law',
    'Arts & Humanities',
    'Science',
    'Education',
    'Nursing',
    'Architecture',
    'Pharmacy',
    'Agriculture',
    'Social Sciences',
    'Psychology',
    'Economics',
    'Other'
  ];

  const collegeYears = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Graduate'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      // Reset grade/field when education level changes
      if (name === 'educationLevel') {
        updated.grade = '';
        updated.fieldOfStudy = '';
        updated.year = '';
      }
      return updated;
    });
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate required fields based on education level
    if (formData.educationLevel === 'school' && !formData.grade) {
      setError('Please select a grade level');
      return;
    }
    if (formData.educationLevel === 'college') {
      if (!formData.fieldOfStudy) {
        setError('Please select a field of study');
        return;
      }
      if (!formData.year) {
        setError('Please select a year level');
        return;
      }
    }
    
    setLoading(true);
    setGeneratedPlan(null);

    try {
      const response = await axios.post(`${API_URL}/ai/generatePlan`, formData);
      if (response.data.success && response.data.lessonPlan) {
        setGeneratedPlan(response.data.lessonPlan);
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to generate lesson plan. Please check your connection and try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPlan) return;

    try {
      // Convert duration to number
      const durationNum = parseInt(formData.duration, 10) || 45;
      
      const response = await axios.post(`${API_URL}/lesson-plans`, {
        title: generatedPlan.lessonTitle,
        subject: formData.subject,
        topic: formData.topic,
        grade: formData.educationLevel === 'school' 
          ? formData.grade 
          : `${formData.fieldOfStudy} - ${formData.year}`,
        duration: durationNum,
        content: generatedPlan
      });

      navigate(`/plans/${response.data.plan.id}`);
    } catch (err) {
      console.error('Save error:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'Failed to save lesson plan. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-800 dark:text-gray-100">AI Lesson Plan Generator</h1>
        <p className="text-gray-600 dark:text-gray-400">Create comprehensive lesson plans powered by AI in minutes</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Plan Details</h2>
          
          {error && (
            <div className="bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          <AIModelSelector 
            selectedModel={formData.aiModel}
            onModelChange={(model) => setFormData({ ...formData, aiModel: model })}
          />

          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject *
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Mathematics, Science, English"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Topic *
              </label>
              <input
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                className="input-field"
                placeholder="e.g., Quadratic Equations, Photosynthesis, Thermodynamics"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Education Level *
              </label>
              <select
                name="educationLevel"
                value={formData.educationLevel}
                onChange={handleChange}
                className="input-field"
                required
              >
                <option value="school">School (K-12)</option>
                <option value="college">College/University</option>
              </select>
            </div>

            {formData.educationLevel === 'school' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grade Level *
                </label>
                <select
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="">Select Grade</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map(grade => (
                    <option key={grade} value={`Grade ${grade}`}>
                      Grade {grade}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Field of Study *
                  </label>
                  <select
                    name="fieldOfStudy"
                    value={formData.fieldOfStudy}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Field of Study</option>
                    {collegeFields.map(field => (
                      <option key={field} value={field}>
                        {field}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Year Level *
                  </label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select Year</option>
                    {collegeYears.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                className="input-field"
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Teaching Approach
              </label>
              <select
                name="approach"
                value={formData.approach}
                onChange={handleChange}
                className="input-field"
              >
                <option value="interactive">Interactive</option>
                <option value="lecture">Lecture</option>
                <option value="hands-on">Hands-on</option>
                <option value="project-based">Project-based</option>
                <option value="inquiry-based">Inquiry-based</option>
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeCaseStudies"
                  name="includeCaseStudies"
                  checked={formData.includeCaseStudies}
                  onChange={(e) => setFormData({ ...formData, includeCaseStudies: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="includeCaseStudies" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Include Case Studies
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="includeDiscussionQuestions"
                  name="includeDiscussionQuestions"
                  checked={formData.includeDiscussionQuestions}
                  onChange={(e) => setFormData({ ...formData, includeDiscussionQuestions: e.target.checked })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded"
                />
                <label htmlFor="includeDiscussionQuestions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Include Discussion Questions
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <FaMagic />
                  <span>Generate Lesson Plan</span>
                </>
              )}
            </button>
          </form>

          {/* Pedagogy Recommendation */}
          {formData.subject && formData.topic && (formData.educationLevel === 'school' ? formData.grade : (formData.fieldOfStudy && formData.year)) && (
            <div className="mt-6">
              <PedagogyRecommendation
                subject={formData.subject}
                topic={formData.topic}
                grade={formData.educationLevel === 'school' ? formData.grade : `${formData.fieldOfStudy} - ${formData.year}`}
                educationLevel={formData.educationLevel}
                onRecommendationSelect={(approach) => {
                  setFormData(prev => ({ ...prev, approach: approach.toLowerCase().replace(/\s+/g, '-') }));
                }}
              />
            </div>
          )}
        </motion.div>

        {/* Generated Plan */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card"
        >
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Generated Lesson Plan</h2>
          
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <FaSpinner className="animate-spin text-4xl text-primary-600 mb-4" />
              <p className="text-gray-600 dark:text-gray-400">AI is generating your lesson plan...</p>
            </div>
          )}

          {generatedPlan && !loading && (
            <div className="space-y-4">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                  {generatedPlan.lessonTitle}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">
                    {formData.educationLevel === 'college' ? 'Field & Year:' : 'Grade:'}
                  </span> {generatedPlan.grade} |{' '}
                  <span className="font-medium">Duration:</span> {generatedPlan.duration} minutes
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Learning Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {generatedPlan.learningObjectives?.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Materials Required</h4>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                  {generatedPlan.materialsRequired?.map((material, index) => (
                    <li key={index}>{material}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Lesson Flow</h4>
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Introduction:</p>
                    <p className="text-gray-600 dark:text-gray-400">{generatedPlan.lessonFlow?.introduction}</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Activities:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                      {generatedPlan.lessonFlow?.activities?.map((activity, index) => (
                        <li key={index}>{activity}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-gray-700 dark:text-gray-300">Wrap-up:</p>
                    <p className="text-gray-600 dark:text-gray-400">{generatedPlan.lessonFlow?.wrapUp}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Assessment</h4>
                <p className="text-gray-700 dark:text-gray-300">{generatedPlan.assessment}</p>
              </div>

              {generatedPlan.homework && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Homework</h4>
                  <p className="text-gray-700 dark:text-gray-300">{generatedPlan.homework}</p>
                </div>
              )}

              {generatedPlan.caseStudies && generatedPlan.caseStudies.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Case Studies</h4>
                  <div className="space-y-4">
                    {generatedPlan.caseStudies.map((caseStudy, index) => (
                      <div key={index} className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <h5 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{caseStudy.title}</h5>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">{caseStudy.description}</p>
                        {caseStudy.questions && caseStudy.questions.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Analysis Questions:</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-700 dark:text-gray-300">
                              {caseStudy.questions.map((q, qIndex) => (
                                <li key={qIndex}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {generatedPlan.discussionQuestions && generatedPlan.discussionQuestions.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Discussion Questions</h4>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                    {generatedPlan.discussionQuestions.map((question, index) => (
                      <li key={index}>{question}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Summary</h4>
                <p className="text-gray-700 dark:text-gray-300">{generatedPlan.summary}</p>
              </div>

              <button
                onClick={handleSave}
                className="btn-primary w-full"
              >
                Save Lesson Plan
              </button>
            </div>
          )}

          {!generatedPlan && !loading && (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <FaMagic className="text-5xl mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>Fill in the form and click "Generate Lesson Plan" to get started</p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default LessonGenerator;

