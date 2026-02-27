import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useRoom, useOthers, useSelf, useUpdateMyPresence } from '@liveblocks/react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaUsers, FaSave, FaArrowLeft, FaComment, FaTimes, FaCheck } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const LessonPlanCollaborativeEditor = () => {
  const { id: planId } = useParams();
  const navigate = useNavigate();
  const room = useRoom();
  const others = useOthers();
  const self = useSelf();
  const updateMyPresence = useUpdateMyPresence();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [showCommentPanel, setShowCommentPanel] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const editorRef = useRef(null);

  useEffect(() => {
    fetchPlan();
    fetchCollaborators();
    fetchComments();

    // Fetch collaborators every 5 seconds
    const interval = setInterval(fetchCollaborators, 5000);
    return () => clearInterval(interval);
  }, [planId]);

  useEffect(() => {
    // Update presence when cursor position changes
    if (editorRef.current) {
      const handleSelection = () => {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          updateMyPresence({
            cursor: {
              position: {
                x: range.getBoundingClientRect().x,
                y: range.getBoundingClientRect().y
              }
            }
          });
        }
      };

      document.addEventListener('selectionchange', handleSelection);
      return () => document.removeEventListener('selectionchange', handleSelection);
    }
  }, [updateMyPresence]);

  const fetchPlan = async () => {
    try {
      const response = await axios.get(`${API_URL}/lesson-plans/${planId}`);
      setPlan(response.data.plan);
      setEditedContent(JSON.parse(JSON.stringify(response.data.plan.content)));
    } catch (error) {
      console.error('Failed to fetch plan:', error);
      alert('Failed to load lesson plan');
      navigate('/plans');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaborators = async () => {
    try {
      const response = await axios.get(`${API_URL}/collaboration/${planId}/collaborators`);
      setCollaborators(response.data);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axios.get(`${API_URL}/collaboration/${planId}/comments?resolved=false`);
      setComments(response.data.comments);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API_URL}/lesson-plans/${planId}`, {
        title: plan.title,
        subject: plan.subject,
        grade: plan.grade,
        topic: plan.topic,
        duration: plan.duration,
        content: editedContent,
        changeNote: 'Collaborative edit'
      });

      alert('Lesson plan saved successfully!');
      setPlan(prev => ({
        ...prev,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save plan:', error);
      alert('Failed to save lesson plan: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      const response = await axios.post(`${API_URL}/collaboration/${planId}/comments`, {
        content: newComment,
        position: selectedText ? { text: selectedText } : null
      });

      setComments([response.data.comment, ...comments]);
      setNewComment('');
      setSelectedText('');
    } catch (error) {
      console.error('Failed to add comment:', error);
      alert('Failed to add comment');
    }
  };

  const handleResolveComment = async (commentId) => {
    try {
      const response = await axios.put(`${API_URL}/collaboration/${planId}/comments/${commentId}`, {
        resolved: true
      });

      setComments(comments.filter(c => c.id !== commentId));
    } catch (error) {
      console.error('Failed to resolve comment:', error);
      alert('Failed to resolve comment');
    }
  };

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection.toString()) {
      setSelectedText(selection.toString());
    }
  };

  const updateNestedField = (path, value) => {
    const parts = path.split('.');
    const updated = JSON.parse(JSON.stringify(editedContent));
    let current = updated;

    for (let i = 0; i < parts.length - 1; i++) {
      if (!current[parts[i]]) {
        current[parts[i]] = {};
      }
      current = current[parts[i]];
    }

    current[parts[parts.length - 1]] = value;
    setEditedContent(updated);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="card text-center py-12">
          <p className="text-gray-600">Lesson plan not found</p>
        </div>
      </div>
    );
  }

  const activeSessions = collaborators.activeSessions || [];
  const allCollaborators = collaborators.collaborators || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/plans')}
              className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition"
            >
              <FaArrowLeft />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{plan.title}</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Last updated: {new Date(plan.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Active Collaborators */}
            <div className="flex items-center space-x-2">
              <div className="flex -space-x-2">
                {activeSessions.map((session) => (
                  <div
                    key={session.userId}
                    className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold border-2 border-white dark:border-gray-800"
                    title={session.userName}
                  >
                    {session.userName.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {activeSessions.length} editing
              </span>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary flex items-center space-x-2"
            >
              <FaSave />
              <span>{saving ? 'Saving...' : 'Save'}</span>
            </button>

            {/* Comments Button */}
            <button
              onClick={() => setShowCommentPanel(!showCommentPanel)}
              className="relative btn-secondary flex items-center space-x-2"
            >
              <FaComment />
              <span>Comments</span>
              {comments.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {comments.length}
                </span>
              )}
            </button>

            {/* Collaborators List */}
            <button
              className="btn-secondary flex items-center space-x-2"
              onClick={() => alert(`Collaborators: ${allCollaborators.map(c => c.user.name).join(', ') || 'None'}`)}
            >
              <FaUsers />
              <span>{allCollaborators.length}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-6" ref={editorRef} onMouseUp={handleTextSelect}>
          <div className="card p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lesson Title
              </label>
              <input
                type="text"
                value={editedContent?.lessonTitle || ''}
                onChange={(e) => updateNestedField('lessonTitle', e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Learning Objectives */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Learning Objectives
              </label>
              <textarea
                value={Array.isArray(editedContent?.learningObjectives) ? editedContent.learningObjectives.join('\n') : editedContent?.learningObjectives || ''}
                onChange={(e) => updateNestedField('learningObjectives', e.target.value.split('\n').filter(x => x.trim()))}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter learning objectives (one per line)"
              />
            </div>

            {/* Materials Required */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Materials Required
              </label>
              <textarea
                value={Array.isArray(editedContent?.materialsRequired) ? editedContent.materialsRequired.join('\n') : editedContent?.materialsRequired || ''}
                onChange={(e) => updateNestedField('materialsRequired', e.target.value.split('\n').filter(x => x.trim()))}
                rows="4"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Enter materials required (one per line)"
              />
            </div>

            {/* Lesson Flow */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Lesson Flow
              </label>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Introduction</label>
                <textarea
                  value={editedContent?.lessonFlow?.introduction || ''}
                  onChange={(e) => updateNestedField('lessonFlow.introduction', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Activities</label>
                <textarea
                  value={Array.isArray(editedContent?.lessonFlow?.activities) ? editedContent.lessonFlow.activities.join('\n') : editedContent?.lessonFlow?.activities || ''}
                  onChange={(e) => updateNestedField('lessonFlow.activities', e.target.value.split('\n').filter(x => x.trim()))}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Enter activities (one per line)"
                />
              </div>

              <div>
                <label className="text-xs text-gray-600 dark:text-gray-400 block mb-1">Wrap-up</label>
                <textarea
                  value={editedContent?.lessonFlow?.wrapUp || ''}
                  onChange={(e) => updateNestedField('lessonFlow.wrapUp', e.target.value)}
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>

            {/* Assessment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Assessment
              </label>
              <textarea
                value={editedContent?.assessment || ''}
                onChange={(e) => updateNestedField('assessment', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Homework */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Homework
              </label>
              <textarea
                value={editedContent?.homework || ''}
                onChange={(e) => updateNestedField('homework', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Summary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary
              </label>
              <textarea
                value={editedContent?.summary || ''}
                onChange={(e) => updateNestedField('summary', e.target.value)}
                rows="3"
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Comments Panel */}
        {showCommentPanel && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="lg:col-span-1 space-y-4"
          >
            <div className="card p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">Comments</h3>
                <button
                  onClick={() => setShowCommentPanel(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Add Comment */}
              <div className="space-y-2">
                {selectedText && (
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-gray-600 dark:text-gray-300 border-l-4 border-blue-600">
                    "{selectedText.substring(0, 50)}..."
                  </div>
                )}
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows="3"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="w-full btn-primary py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Comment
                </button>
              </div>

              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-800 dark:text-gray-200">
                            {comment.userName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleResolveComment(comment.id)}
                          className="text-green-600 hover:text-green-700 text-xs"
                          title="Resolve comment"
                        >
                          <FaCheck />
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Active Collaborators List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="lg:col-span-1"
        >
          <div className="card p-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Active Collaborators</h3>
            <div className="space-y-3">
              {activeSessions.length === 0 ? (
                <p className="text-sm text-gray-500">No other collaborators currently editing</p>
              ) : (
                activeSessions.map((session) => (
                  <div key={session.userId} className="flex items-center space-x-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold">
                      {session.userName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {session.userName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {session.status === 'active' && '● Active'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Collaborators Permissions */}
          <div className="card p-4 mt-4">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Permissions</h3>
            <div className="space-y-2">
              {allCollaborators.length === 0 ? (
                <p className="text-sm text-gray-500">No collaborators invited yet</p>
              ) : (
                allCollaborators.map((perm) => (
                  <div key={perm.id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    <span className="text-gray-800 dark:text-gray-200">{perm.user.name}</span>
                    <span className="px-2 py-1 bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded text-xs">
                      {perm.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default LessonPlanCollaborativeEditor;
