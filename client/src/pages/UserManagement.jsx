import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaEdit, FaTrash, FaSearch, FaUserShield, FaUserTie, FaChalkboardTeacher, FaLock, FaUnlock } from 'react-icons/fa';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  useEffect(() => {
    fetchUsers();
  }, [pagination.page, roleFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
        ...(roleFilter && { role: roleFilter }),
        ...(searchTerm && { search: searchTerm })
      };

      const response = await axios.get(`${API_URL}/users`, { params });
      setUsers(response.data.users || []);
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      alert('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setActionLoading(`role-${userId}`);
    try {
      await axios.patch(`${API_URL}/users/${userId}/role`, { role: newRole });
      alert('User role updated successfully');
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Failed to update role:', error);
      alert(error.response?.data?.error || 'Failed to update user role');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePasswordReset = async (userId) => {
    if (!newPassword || newPassword.length < 6) {
      alert('Password must be at least 6 characters');
      return;
    }

    setActionLoading(`password-${userId}`);
    try {
      await axios.patch(`${API_URL}/users/${userId}/password`, { password: newPassword });
      alert('Password reset successfully');
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      console.error('Failed to reset password:', error);
      alert(error.response?.data?.error || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    setActionLoading(`delete-${userId}`);
    try {
      await axios.delete(`${API_URL}/users/${userId}`);
      alert('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert(error.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <FaUserShield className="text-red-600" />;
      case 'HOD':
        return <FaUserTie className="text-blue-600" />;
      default:
        return <FaChalkboardTeacher className="text-green-600" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'HOD':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-800">User Management</h1>
        <p className="text-gray-600">Manage all users in the system</p>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination(prev => ({ ...prev, page: 1 }));
              }}
              className="input-field pl-10"
            />
          </div>
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className="input-field"
          >
            <option value="">All Roles</option>
            <option value="teacher">Teacher</option>
            <option value="HOD">HOD</option>
            <option value="admin">Admin</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Role</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Stats</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user, index) => (
              <motion.tr
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    {getRoleIcon(user.role)}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeColor(user.role)}`}>
                      {user.role}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4">
                  <div className="text-sm text-gray-600">
                    <p>Plans: {user._count?.createdPlans || 0}</p>
                    <p>Approvals: {user._count?.approvals || 0}</p>
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-gray-600">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center justify-end space-x-2">
                    <button
                      onClick={() => setSelectedUser(user)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Edit User"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.name)}
                      disabled={actionLoading === `delete-${user.id}`}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Delete User"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No users found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
            disabled={pagination.page === 1}
            className="btn-secondary disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
            disabled={pagination.page === pagination.pages}
            className="btn-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card max-w-md w-full mx-4"
          >
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit User</h2>
            
            <div className="mb-4">
              <p className="font-medium text-gray-800">{selectedUser.name}</p>
              <p className="text-sm text-gray-600">{selectedUser.email}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Role
              </label>
              <select
                value={editRole || selectedUser.role}
                onChange={(e) => setEditRole(e.target.value)}
                className="input-field"
              >
                <option value="teacher">Teacher</option>
                <option value="HOD">HOD</option>
                <option value="admin">Admin</option>
              </select>
              {editRole && editRole !== selectedUser.role && (
                <button
                  onClick={() => handleRoleChange(selectedUser.id, editRole)}
                  disabled={actionLoading === `role-${selectedUser.id}`}
                  className="btn-primary mt-2 w-full"
                >
                  {actionLoading === `role-${selectedUser.id}` ? 'Updating...' : 'Update Role'}
                </button>
              )}
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reset Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                className="input-field"
              />
              <button
                onClick={() => handlePasswordReset(selectedUser.id)}
                disabled={actionLoading === `password-${selectedUser.id}` || !newPassword}
                className="btn-secondary mt-2 w-full"
              >
                {actionLoading === `password-${selectedUser.id}` ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>

            <button
              onClick={() => {
                setSelectedUser(null);
                setEditRole('');
                setNewPassword('');
              }}
              className="btn-secondary w-full"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;



