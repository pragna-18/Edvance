import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FaPlus, FaTimes, FaCheck, FaUsers } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CollaboratorsManager = ({ lessonPlanId, onClose, isCreator, onCollaboratorAdded }) => {
  const planId = lessonPlanId;
  
  // Guard against undefined planId
  if (!planId) {
    console.error('CollaboratorsManager rendered without lessonPlanId');
    return null;
  }

  console.log('CollaboratorsManager initialized with planId:', planId, 'Type:', typeof planId);
  const [collaborators, setCollaborators] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRole, setSelectedRole] = useState('editor');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    fetchCollaborators();
    fetchAllUsers();
  }, [planId]);

  const fetchCollaborators = async () => {
    try {
      console.log('Fetching collaborators for planId:', planId);
      const response = await axios.get(`${API_URL}/collaboration/${planId}/collaborators`);
      console.log('Collaborators fetched:', response.data);
      setCollaborators(response.data.collaborators || []);
    } catch (error) {
      console.error('Failed to fetch collaborators:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/teachers`);
      setAllUsers(response.data.users || []);
    } catch (error) {
      console.error('Failed to fetch teachers:', error);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUser) return;

    console.log('Adding collaborator:', { planId, selectedUser, selectedRole });

    setAdding(true);
    try {
      const response = await axios.post(`${API_URL}/collaboration/${planId}/grant-access`, {
        userId: selectedUser,
        role: selectedRole
      });

      console.log('Collaborator added successfully:', response.data);
      fetchCollaborators();
      setSelectedUser('');
      setSelectedRole('editor');
      
      // Notify parent component
      if (onCollaboratorAdded) {
        onCollaboratorAdded();
      }
    } catch (error) {
      console.error('Failed to add collaborator:', error);
      console.error('Error response:', error.response?.data);
      alert(error.response?.data?.error || 'Failed to add collaborator');
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveCollaborator = async (userId) => {
    if (!window.confirm('Remove this collaborator?')) return;

    setRemoving(true);
    try {
      await axios.post(`${API_URL}/collaboration/${planId}/revoke-access`, {
        userId
      });

      fetchCollaborators();
    } catch (error) {
      console.error('Failed to remove collaborator:', error);
      alert('Failed to remove collaborator');
    } finally {
      setRemoving(false);
    }
  };

  // Filter users who are not already collaborators
  const availableUsers = allUsers.filter(
    user => !collaborators.some(collab => collab.userId === user.id)
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-96 overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center space-x-2">
            <FaUsers />
            <span>Manage Collaborators</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Add Collaborator Form */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">Add Collaborator</h3>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Select User
              </label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">Choose a user...</option>
                {availableUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-600 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="viewer">Viewer (Read-only)</option>
                <option value="commenter">Commenter (Comments only)</option>
                <option value="editor">Editor (Full edit)</option>
              </select>
            </div>

            <button
              onClick={handleAddCollaborator}
              disabled={!selectedUser || adding}
              className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaPlus />
              <span>{adding ? 'Adding...' : 'Add Collaborator'}</span>
            </button>
          </div>

          {/* Collaborators List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">
              Current Collaborators ({collaborators.length})
            </h3>

            {collaborators.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No collaborators yet</p>
            ) : (
              <div className="space-y-2">
                {collaborators.map((collab) => (
                  <div
                    key={collab.id}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-800 dark:text-gray-200">
                        {collab.user.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {collab.user.email}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs bg-primary-100 text-primary-700 dark:bg-primary-900/20 dark:text-primary-300 rounded">
                        {collab.role}
                      </span>
                      <button
                        onClick={() => handleRemoveCollaborator(collab.userId)}
                        disabled={removing}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <FaTimes />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CollaboratorsManager;
