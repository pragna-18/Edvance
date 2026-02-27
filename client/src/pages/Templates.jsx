import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaPlus, FaEdit, FaTrash, FaEye, FaLock, FaGlobe } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Templates = () => {
  const { user } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    structure: {},
    isPublic: false
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_URL}/templates`);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/templates`, formData);
      setShowModal(false);
      setFormData({ name: '', description: '', structure: {}, isPublic: false });
      fetchTemplates();
    } catch (error) {
      console.error('Failed to create template:', error);
      alert('Failed to create template');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return;

    try {
      await axios.delete(`${API_URL}/templates/${id}`);
      fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
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
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Template Library</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center space-x-2">
          <FaPlus />
          <span>Create Template</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template, index) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="card hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{template.name}</h3>
                {template.description && (
                  <p className="text-gray-600 text-sm mb-2">{template.description}</p>
                )}
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {template.isPublic ? (
                    <>
                      <FaGlobe className="text-green-600" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <FaLock className="text-gray-400" />
                      <span>Private</span>
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  By {template.owner?.name}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 mt-4">
              <button className="flex-1 btn-secondary text-sm flex items-center justify-center space-x-2">
                <FaEye />
                <span>View</span>
              </button>
              {user && template.ownerId === user.id && (
                <>
                  <button className="btn-secondary text-sm p-2">
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className="btn-secondary text-sm p-2 text-red-600 hover:bg-red-50"
                  >
                    <FaTrash />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-600 mb-4">No templates found</p>
          <button onClick={() => setShowModal(true)} className="btn-primary">
            Create Your First Template
          </button>
        </div>
      )}

      {/* Create Template Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Create Template</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="3"
                />
              </div>

              <div>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Make this template public</span>
                </label>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex-1">
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Templates;

