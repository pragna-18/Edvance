import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCheck, FaTimes, FaEye, FaClock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Approvals = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [comments, setComments] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      const response = await axios.get(`${API_URL}/approvals/pending`);
      setPlans(response.data.plans || []);
    } catch (error) {
      console.error('Failed to fetch pending approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (planId, status) => {
    setActionLoading(planId);
    try {
      await axios.post(`${API_URL}/approvals/${planId}`, {
        status,
        comments
      });
      setComments('');
      setSelectedPlan(null);
      fetchPendingApprovals();
      alert(`Lesson plan ${status} successfully`);
    } catch (error) {
      console.error('Failed to update approval:', error);
      alert('Failed to update approval');
    } finally {
      setActionLoading(null);
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

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 text-gray-800">Pending Approvals</h1>

      <div className="grid gap-6">
        {plans.length > 0 ? (
          plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="card"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-800">{plan.title}</h3>
                    <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
                      {plan.status}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    <span className="font-medium">Subject:</span> {plan.subject} |{' '}
                    <span className="font-medium">Grade:</span> {plan.grade}
                  </p>
                  {plan.topic && (
                    <p className="text-gray-600 mb-2">
                      <span className="font-medium">Topic:</span> {plan.topic}
                    </p>
                  )}
                  <p className="text-sm text-gray-500">
                    Created by {plan.creator?.name} on {new Date(plan.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/plans/${plan.id}`}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors"
                    title="View Plan"
                  >
                    <FaEye />
                  </Link>
                  <button
                    onClick={() => setSelectedPlan(plan)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <FaClock />
                    <span>Review</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="card text-center py-12">
            <FaCheck className="text-5xl text-green-600 mx-auto mb-4" />
            <p className="text-gray-600">No pending approvals</p>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedPlan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Review Lesson Plan</h2>
            
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{selectedPlan.title}</h3>
              <p className="text-gray-600">
                <span className="font-medium">Subject:</span> {selectedPlan.subject} |{' '}
                <span className="font-medium">Grade:</span> {selectedPlan.grade}
              </p>
            </div>

            <div className="mb-4">
              <h4 className="font-semibold text-gray-800 mb-4">Lesson Plan Content</h4>
              <div className="bg-gray-50 p-6 rounded-xl max-h-[500px] overflow-y-auto space-y-6">
                {(() => {
                  const content = selectedPlan.content || {};
                  
                  return (
                    <>
                      {content.lessonTitle && (
                        <div>
                          <h5 className="text-lg font-bold text-gray-800 mb-2">
                            {content.lessonTitle}
                          </h5>
                        </div>
                      )}

                      {content.learningObjectives && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Learning Objectives</h5>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {Array.isArray(content.learningObjectives) ? (
                              content.learningObjectives.map((obj, index) => (
                                <li key={index}>{obj}</li>
                              ))
                            ) : (
                              <li>{content.learningObjectives}</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {content.materialsRequired && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Materials Required</h5>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {Array.isArray(content.materialsRequired) ? (
                              content.materialsRequired.map((material, index) => (
                                <li key={index}>{material}</li>
                              ))
                            ) : (
                              <li>{content.materialsRequired}</li>
                            )}
                          </ul>
                        </div>
                      )}

                      {content.lessonFlow && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Lesson Flow</h5>
                          {content.lessonFlow.introduction && (
                            <div className="mb-3">
                              <p className="font-medium text-gray-700 mb-1">Introduction:</p>
                              <p className="text-gray-600">{content.lessonFlow.introduction}</p>
                            </div>
                          )}
                          {content.lessonFlow.activities && (
                            <div className="mb-3">
                              <p className="font-medium text-gray-700 mb-1">Activities:</p>
                              <ul className="list-disc list-inside space-y-1 text-gray-600">
                                {Array.isArray(content.lessonFlow.activities) ? (
                                  content.lessonFlow.activities.map((activity, index) => (
                                    <li key={index}>{activity}</li>
                                  ))
                                ) : (
                                  <li>{content.lessonFlow.activities}</li>
                                )}
                              </ul>
                            </div>
                          )}
                          {content.lessonFlow.wrapUp && (
                            <div>
                              <p className="font-medium text-gray-700 mb-1">Wrap-up:</p>
                              <p className="text-gray-600">{content.lessonFlow.wrapUp}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {content.assessment && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Assessment</h5>
                          <p className="text-gray-700">{content.assessment}</p>
                        </div>
                      )}

                      {content.homework && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Homework</h5>
                          <p className="text-gray-700">{content.homework}</p>
                        </div>
                      )}

                      {content.caseStudies && Array.isArray(content.caseStudies) && content.caseStudies.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Case Studies</h5>
                          <div className="space-y-3">
                            {content.caseStudies.map((caseStudy, index) => (
                              <div key={index} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h6 className="font-medium text-gray-800 mb-1">{caseStudy.title}</h6>
                                <p className="text-sm text-gray-700 mb-2">{caseStudy.description}</p>
                                {caseStudy.questions && Array.isArray(caseStudy.questions) && caseStudy.questions.length > 0 && (
                                  <div>
                                    <p className="text-xs font-medium text-gray-600 mb-1">Analysis Questions:</p>
                                    <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
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

                      {content.discussionQuestions && Array.isArray(content.discussionQuestions) && content.discussionQuestions.length > 0 && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Discussion Questions</h5>
                          <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {content.discussionQuestions.map((question, index) => (
                              <li key={index}>{question}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {content.summary && (
                        <div>
                          <h5 className="font-semibold text-gray-800 mb-2">Summary</h5>
                          <p className="text-gray-700">{content.summary}</p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments (optional)
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="input-field w-full"
                rows="3"
                placeholder="Add your review comments..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setSelectedPlan(null);
                  setComments('');
                }}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApprove(selectedPlan.id, 'rejected')}
                disabled={actionLoading === selectedPlan.id}
                className="btn-secondary flex-1 bg-red-600 text-white hover:bg-red-700 flex items-center justify-center space-x-2"
              >
                <FaTimes />
                <span>Reject</span>
              </button>
              <button
                onClick={() => handleApprove(selectedPlan.id, 'approved')}
                disabled={actionLoading === selectedPlan.id}
                className="btn-primary flex-1 flex items-center justify-center space-x-2"
              >
                <FaCheck />
                <span>
                  {actionLoading === selectedPlan.id ? 'Processing...' : 'Approve'}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Approvals;






