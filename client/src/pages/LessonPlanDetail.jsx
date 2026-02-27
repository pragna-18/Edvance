import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaEdit, FaHistory, FaCheck, FaTimes, FaPaperPlane, FaFilePdf, FaFilePowerpoint, FaQuestionCircle, FaFileAlt, FaUsers, FaShare } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import HealthScore from '../components/HealthScore';
import SimilarPlans from '../components/SimilarPlans';
import CurriculumAlignment from '../components/CurriculumAlignment';
import LanguageTools from '../components/LanguageTools';
import CurriculumCoverageMap from '../components/CurriculumCoverageMap';
import CognitiveLoadAnalysis from '../components/CognitiveLoadAnalysis';
import CollaboratorsManager from '../components/CollaboratorsManager';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonPlanDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuestionPaperModal, setShowQuestionPaperModal] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [questionPaper, setQuestionPaper] = useState(null);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [generatingQuestionPaper, setGeneratingQuestionPaper] = useState(false);
  const [showCollaboratorsModal, setShowCollaboratorsModal] = useState(false);
  const [collaborators, setCollaborators] = useState([]);

  const isCreator = plan?.creatorId === user?.id;
  
  // Check if current user is a collaborator with Editor role
  const userCollaborator = collaborators.find(c => c.userId === user?.id);
  const isCollaboratorEditor = userCollaborator?.role === 'editor';

  useEffect(() => {
    fetchPlan();
    fetchCollaborators();
  }, [id]);

  const fetchPlan = async () => {
    try {
      const response = await axios.get(`${API_URL}/lesson-plans/${id}`);
      setPlan(response.data.plan);
      if (response.data.plan.content) {
        setSelectedVersion(response.data.plan.content);
      }
    } catch (error) {
      console.error('Failed to fetch lesson plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const response = await axios.get(`${API_URL}/collaboration/${id}/collaborators`);
      setCollaborators(response.data.collaborators || []);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    }
  };

  const handleRevert = async (version) => {
    if (!window.confirm(`Are you sure you want to revert to version ${version}?`)) return;

    try {
      await axios.post(`${API_URL}/lesson-plans/${id}/revert/${version}`);
      fetchPlan();
      alert('Lesson plan reverted successfully');
    } catch (error) {
      console.error('Failed to revert lesson plan:', error);
      alert('Failed to revert lesson plan');
    }
  };

  const handleSubmit = async () => {
    try {
      await axios.post(`${API_URL}/lesson-plans/${id}/submit`);
      fetchPlan();
      alert('Lesson plan submitted for approval');
    } catch (error) {
      console.error('Failed to submit lesson plan:', error);
      alert('Failed to submit lesson plan');
    }
  };

  const handleExportPDF = async () => {
    try {
      const response = await axios.get(`${API_URL}/lesson-plans/${id}/export/pdf`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${plan.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleExportPPT = async () => {
    try {
      const response = await axios.get(`${API_URL}/lesson-plans/${id}/export/ppt`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${plan.title.replace(/[^a-z0-9]/gi, '_')}.pptx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export PPT:', error);
      alert('Failed to export PPT');
    }
  };

  const handleGenerateQuiz = async (numberOfQuestions = 10, difficulty = 'medium') => {
    setGeneratingQuiz(true);
    try {
      const response = await axios.post(`${API_URL}/lesson-plans/${id}/generate/quiz`, {
        numberOfQuestions,
        difficulty
      });
      setQuiz(response.data.quiz);
      setShowQuizModal(true);
    } catch (error) {
      console.error('Failed to generate quiz:', error);
      alert('Failed to generate quiz: ' + (error.response?.data?.error || error.message));
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleGenerateQuestionPaper = async (totalMarks = 50, difficulty = 'medium') => {
    setGeneratingQuestionPaper(true);
    try {
      const response = await axios.post(`${API_URL}/lesson-plans/${id}/generate/question-paper`, {
        totalMarks,
        difficulty,
        includeMultipleChoice: true,
        includeShortAnswer: true,
        includeLongAnswer: true
      });
      setQuestionPaper(response.data.questionPaper);
      setShowQuestionPaperModal(true);
    } catch (error) {
      console.error('Failed to generate question paper:', error);
      alert('Failed to generate question paper: ' + (error.response?.data?.error || error.message));
    } finally {
      setGeneratingQuestionPaper(false);
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

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Lesson plan not found</p>
          <Link to="/plans" className="btn-primary">
            Back to Plans
          </Link>
        </div>
      </div>
    );
  }

  const content = selectedVersion || plan.content || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <Link to="/plans" className="text-primary-600 hover:text-primary-700 mb-2 inline-block">
            ← Back to Plans
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">{plan.title}</h1>
        </div>
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          {/* Export Buttons */}
          <button
            onClick={handleExportPDF}
            className="btn-secondary flex items-center space-x-2"
            title="Export as PDF"
          >
            <FaFilePdf />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleExportPPT}
            className="btn-secondary flex items-center space-x-2"
            title="Export as PowerPoint"
          >
            <FaFilePowerpoint />
            <span>Export PPT</span>
          </button>
          <button
            onClick={() => handleGenerateQuiz(10, 'medium')}
            className="btn-secondary flex items-center space-x-2"
            disabled={generatingQuiz}
            title="Generate Quiz"
          >
            <FaQuestionCircle />
            <span>{generatingQuiz ? 'Generating...' : 'Generate Quiz'}</span>
          </button>
          <button
            onClick={() => handleGenerateQuestionPaper(50, 'medium')}
            className="btn-secondary flex items-center space-x-2"
            disabled={generatingQuestionPaper}
            title="Generate Question Paper"
          >
            <FaFileAlt />
            <span>{generatingQuestionPaper ? 'Generating...' : 'Generate QP'}</span>
          </button>
          {isCreator && (
            <button
              onClick={() => setShowCollaboratorsModal(true)}
              className="btn-secondary flex items-center space-x-2"
              title="Manage collaborators"
            >
              <FaShare />
              <span>Share</span>
            </button>
          )}
          {(plan.status === 'draft' || isCollaboratorEditor) && (
            <>
              <Link
                to={`/collaborate/${plan.id}`}
                className="btn-primary flex items-center space-x-2"
                title={isCollaboratorEditor ? "Edit as collaborator" : "Edit lesson plan"}
              >
                <FaEdit />
                <span>Edit</span>
              </Link>
              {plan.status === 'draft' && (
                <button
                  onClick={handleSubmit}
                  className="btn-primary flex items-center space-x-2"
                >
                  <FaPaperPlane />
                  <span>Submit for Approval</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Lesson Plan Details</h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                plan.status === 'approved' ? 'bg-green-200 text-green-800' :
                plan.status === 'submitted' ? 'bg-yellow-200 text-yellow-800' :
                plan.status === 'revision_requested' ? 'bg-orange-200 text-orange-800' :
                'bg-gray-200 text-gray-800'
              }`}>
                {plan.status.replace('_', ' ')}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{plan.subject}</p>
              </div>
              {plan.topic && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Topic</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{plan.topic}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Grade</p>
                <p className="font-medium text-gray-800 dark:text-gray-200">{plan.grade}</p>
              </div>
              {plan.duration && (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                  <p className="font-medium text-gray-800 dark:text-gray-200">{plan.duration} minutes</p>
                </div>
              )}
            </div>
          </div>

          {/* Lesson Plan Content */}
          <div className="card">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {content.lessonTitle || plan.title}
            </h2>

            {content.learningObjectives && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Learning Objectives</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
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
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Materials Required</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
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
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Lesson Flow</h3>
                {content.lessonFlow.introduction && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Introduction:</p>
                    <p className="text-gray-600 dark:text-gray-400">{content.lessonFlow.introduction}</p>
                  </div>
                )}
                {content.lessonFlow.activities && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Activities:</p>
                    <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
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
                    <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">Wrap-up:</p>
                    <p className="text-gray-600 dark:text-gray-400">{content.lessonFlow.wrapUp}</p>
                  </div>
          )}
        </div>
      )}

      {/* Collaborators Manager Modal */}
      {showCollaboratorsModal && plan?.id && (
        <CollaboratorsManager
          key={`collaborators-${plan.id}`}
          lessonPlanId={plan.id}
          isCreator={isCreator}
          onClose={() => setShowCollaboratorsModal(false)}
          onCollaboratorAdded={fetchCollaborators}
        />
      )}

            {content.assessment && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Assessment</h3>
                <p className="text-gray-700 dark:text-gray-300">{content.assessment}</p>
              </div>
            )}

            {content.homework && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Homework</h3>
                <p className="text-gray-700 dark:text-gray-300">{content.homework}</p>
              </div>
            )}

            {content.caseStudies && Array.isArray(content.caseStudies) && content.caseStudies.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Case Studies</h3>
                <div className="space-y-4">
                  {content.caseStudies.map((caseStudy, index) => (
                    <div key={index} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">{caseStudy.title}</h4>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{caseStudy.description}</p>
                      {caseStudy.questions && Array.isArray(caseStudy.questions) && caseStudy.questions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Analysis Questions:</p>
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

            {content.discussionQuestions && Array.isArray(content.discussionQuestions) && content.discussionQuestions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Discussion Questions</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
                  {content.discussionQuestions.map((question, index) => (
                    <li key={index}>{question}</li>
                  ))}
                </ul>
              </div>
            )}

            {content.summary && (
              <div>
                <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Summary</h3>
                <p className="text-gray-700 dark:text-gray-300">{content.summary}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Versions */}
          {plan.versions && plan.versions.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                <FaHistory />
                <span>Version History</span>
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedVersion(plan.content)}
                  className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                    !selectedVersion || JSON.stringify(selectedVersion) === JSON.stringify(plan.content)
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  Version {plan.version} (Current)
                </button>
                {plan.versions.map((version) => (
                  <div key={version.id} className="space-y-2">
                    <button
                      onClick={() => setSelectedVersion(version.content)}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-colors ${
                        JSON.stringify(selectedVersion) === JSON.stringify(version.content)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      Version {version.version}
                      {version.changeNote && (
                        <p className="text-xs text-gray-600 mt-1">{version.changeNote}</p>
                      )}
                      <p className="text-xs text-gray-500">
                        {new Date(version.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    {JSON.stringify(selectedVersion) === JSON.stringify(version.content) && selectedVersion !== plan.content && (
                      <button
                        onClick={() => handleRevert(version.version)}
                        className="w-full btn-primary text-sm"
                      >
                        Revert to this version
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approvals */}
          {plan.approvals && plan.approvals.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-800 mb-4">Approval History</h3>
              <div className="space-y-3">
                {plan.approvals.map((approval) => (
                  <div key={approval.id} className="border-l-4 border-primary-600 pl-3">
                    <div className="flex items-center space-x-2 mb-1">
                      {approval.status === 'approved' ? (
                        <FaCheck className="text-green-600" />
                      ) : approval.status === 'rejected' ? (
                        <FaTimes className="text-red-600" />
                      ) : null}
                      <span className={`font-medium ${
                        approval.status === 'approved' ? 'text-green-700' :
                        approval.status === 'rejected' ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        {approval.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Reviewed by {approval.reviewer?.name}
                    </p>
                    {approval.comments && (
                      <p className="text-sm text-gray-700 mt-1">{approval.comments}</p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan Info */}
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-4">Plan Information</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-600">Created by:</span>{' '}
                <span className="font-medium">{plan.creator?.name}</span>
              </p>
              <p>
                <span className="text-gray-600">Created:</span>{' '}
                {new Date(plan.createdAt).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-600">Last updated:</span>{' '}
                {new Date(plan.updatedAt).toLocaleString()}
              </p>
              <p>
                <span className="text-gray-600">Version:</span>{' '}
                <span className="font-medium">{plan.version}</span>
              </p>
              {plan.language && (
                <p>
                  <span className="text-gray-600">Language:</span>{' '}
                  <span className="font-medium uppercase">{plan.language}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Features Section */}
      <div className="mt-8 grid lg:grid-cols-2 gap-6">
        {/* Health Score */}
        <HealthScore planId={plan.id} />

        {/* Curriculum Alignment */}
        <CurriculumAlignment planId={plan.id} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Similar Plans */}
        <SimilarPlans planId={plan.id} />

        {/* Language Tools */}
        <LanguageTools planId={plan.id} />
      </div>

      <div className="mt-6 grid lg:grid-cols-2 gap-6">
        {/* Curriculum Coverage Map */}
        <CurriculumCoverageMap planId={plan.id} subject={plan.subject} grade={plan.grade} />

        {/* Cognitive Load Analysis */}
        <CognitiveLoadAnalysis planId={plan.id} />
      </div>

      {/* Quiz Modal */}
      {showQuizModal && quiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{quiz.title}</h2>
              <button
                onClick={() => setShowQuizModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 text-sm text-gray-600">
                <p><strong>Subject:</strong> {quiz.subject} | <strong>Grade:</strong> {quiz.grade} | <strong>Difficulty:</strong> {quiz.difficulty} | <strong>Total Marks:</strong> {quiz.totalMarks}</p>
              </div>
              <div className="space-y-6">
                {quiz.questions && quiz.questions.map((q, index) => (
                  <div key={index} className="border-l-4 border-primary-600 pl-4">
                    <p className="font-semibold text-gray-800 mb-2">
                      {q.questionNumber || index + 1}. {q.question}
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      {q.options && q.options.map((option, optIndex) => (
                        <li key={optIndex} className={optIndex === q.correctAnswer ? 'text-green-600 font-medium' : ''}>
                          {String.fromCharCode(65 + optIndex)}. {option}
                          {optIndex === q.correctAnswer && ' ✓ (Correct)'}
                        </li>
                      ))}
                    </ul>
                    {q.explanation && (
                      <p className="mt-2 text-sm text-gray-600 italic">
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Question Paper Modal */}
      {showQuestionPaperModal && questionPaper && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800">{questionPaper.title}</h2>
              <button
                onClick={() => setShowQuestionPaperModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6 text-sm text-gray-600 space-y-1">
                <p><strong>Subject:</strong> {questionPaper.subject} | <strong>Grade:</strong> {questionPaper.grade}</p>
                <p><strong>Total Marks:</strong> {questionPaper.totalMarks} | <strong>Duration:</strong> {questionPaper.duration}</p>
                {questionPaper.instructions && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="font-semibold mb-1">Instructions:</p>
                    <p>{questionPaper.instructions}</p>
                  </div>
                )}
              </div>
              <div className="space-y-8">
                {questionPaper.sections && questionPaper.sections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="border-t pt-6">
                    <h3 className="text-xl font-bold text-primary-600 mb-4">
                      {section.sectionName} ({section.marks} marks)
                    </h3>
                    <div className="space-y-4">
                      {section.questions && section.questions.map((q, qIndex) => (
                        <div key={qIndex} className="border-l-4 border-gray-300 pl-4">
                          <p className="font-semibold text-gray-800 mb-2">
                            {q.questionNumber || qIndex + 1}. {q.question} [{q.marks} marks]
                          </p>
                          {q.options && (
                            <ul className="list-disc list-inside space-y-1 ml-4">
                              {q.options.map((option, optIndex) => (
                                <li key={optIndex}>
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                </li>
                              ))}
                            </ul>
                          )}
                          {q.expectedAnswer && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <p className="font-semibold">Expected Answer Points:</p>
                              <p className="text-gray-700">{q.expectedAnswer}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {questionPaper.answerKey && (
                <div className="mt-8 border-t pt-6">
                  <h3 className="text-xl font-bold text-green-600 mb-4">Answer Key</h3>
                  <div className="space-y-2">
                    {Object.entries(questionPaper.answerKey).map(([section, answers]) => (
                      <div key={section} className="mb-4">
                        <p className="font-semibold mb-2">{section}:</p>
                        {Array.isArray(answers) && answers.map((answer, index) => (
                          <div key={index} className="ml-4 text-sm">
                            <p>Q{answer.questionNumber}: {answer.correctAnswer} {answer.explanation && `- ${answer.explanation}`}</p>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LessonPlanDetail;

