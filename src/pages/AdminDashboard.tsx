/**
 * Admin Dashboard - User management and patient-doctor assignments
 * 
 * Requirements: Enhancement - Admin dashboard
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, Link as LinkIcon, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../stores/userStore';
import { userManagementService, UserManagementError } from '../services/userManagementService';
import type { UserCreationData } from '../services/userManagementService';
import type { UserModel, PatientDoctorRelationship, UserRole } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { Header } from '../components/Header';

console.log('🎨 [AdminDashboard] Component loaded');

export function AdminDashboard() {
  const navigate = useNavigate();
  const currentUser = useUserStore(state => state.currentUser);
  const logout = useUserStore(state => state.logout);
  
  const [users, setUsers] = useState<UserModel[]>([]);
  const [relationships, setRelationships] = useState<PatientDoctorRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // User creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState<Partial<UserCreationData>>({
    role: UserRoleEnum.PATIENT,
  });

  // User edit form state
  const [editingUser, setEditingUser] = useState<UserModel | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<UserCreationData>>({});

  // Assignment form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  console.log('🎨 [AdminDashboard] Rendering with user:', currentUser?.name);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const handleLogout = () => {
    console.log('🚪 [AdminDashboard] Logging out');
    logout();
    navigate('/login');
  };

  const loadData = () => {
    console.log('📊 [AdminDashboard] Loading data...');
    setLoading(true);
    try {
      const allUsers = userManagementService.getAllUsers();
      const allRelationships = userManagementService.getActiveRelationships();
      
      setUsers(allUsers);
      setRelationships(allRelationships);
      
      console.log('✅ [AdminDashboard] Data loaded:', {
        users: allUsers.length,
        relationships: allRelationships.length,
      });
    } catch (err) {
      console.error('❌ [AdminDashboard] Error loading data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('👤 [AdminDashboard] Creating user:', newUser);
    
    setError(null);
    setSuccess(null);

    try {
      if (!newUser.username || !newUser.password || !newUser.name || !newUser.role) {
        throw new Error('Please fill in all required fields');
      }

      const userData: UserCreationData = {
        username: newUser.username,
        password: newUser.password,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email,
        specialization: newUser.specialization,
        dateOfBirth: newUser.dateOfBirth,
      };

      userManagementService.createUser(userData, currentUser?.id || 'admin-1');
      
      setSuccess(`User ${newUser.username} created successfully!`);
      setShowCreateForm(false);
      setNewUser({ role: UserRoleEnum.PATIENT });
      loadData();
      
      console.log('✅ [AdminDashboard] User created successfully');
    } catch (err) {
      console.error('❌ [AdminDashboard] Error creating user:', err);
      if (err instanceof UserManagementError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to create user');
      }
    }
  };

  const handleEditUser = (user: UserModel) => {
    console.log('✏️ [AdminDashboard] Editing user:', user.id);
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      name: user.name,
      role: user.role,
      password: '', // Don't pre-fill password
    });
    setShowCreateForm(false); // Close create form if open
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('💾 [AdminDashboard] Updating user:', editingUser?.id, editFormData);
    
    setError(null);
    setSuccess(null);

    try {
      if (!editingUser) {
        throw new Error('No user selected for editing');
      }

      if (!editFormData.name || !editFormData.role) {
        throw new Error('Please fill in all required fields');
      }

      const updates: Partial<UserCreationData> = {
        name: editFormData.name,
        role: editFormData.role,
      };

      // Only update username if it changed
      if (editFormData.username && editFormData.username !== editingUser.username) {
        updates.username = editFormData.username;
      }

      // Only update password if provided
      if (editFormData.password && editFormData.password.trim() !== '') {
        updates.password = editFormData.password;
      }

      userManagementService.updateUser(editingUser.id, updates);
      
      setSuccess(`User ${editFormData.name} updated successfully!`);
      setEditingUser(null);
      setEditFormData({});
      loadData();
      
      console.log('✅ [AdminDashboard] User updated successfully');
    } catch (err) {
      console.error('❌ [AdminDashboard] Error updating user:', err);
      if (err instanceof UserManagementError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to update user');
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditFormData({});
  };

  const handleAssignPatient = () => {
    console.log('🔗 [AdminDashboard] Assigning patient to doctor:', {
      patientId: selectedPatient,
      doctorId: selectedDoctor,
    });
    
    setError(null);
    setSuccess(null);

    try {
      if (!selectedPatient || !selectedDoctor) {
        throw new Error('Please select both patient and doctor');
      }

      userManagementService.assignPatientToDoctor(
        selectedPatient,
        selectedDoctor,
        currentUser?.id || 'admin-1'
      );

      setSuccess('Patient assigned successfully!');
      setSelectedPatient('');
      setSelectedDoctor('');
      loadData();
      
      console.log('✅ [AdminDashboard] Assignment successful');
    } catch (err) {
      console.error('❌ [AdminDashboard] Error assigning patient:', err);
      if (err instanceof UserManagementError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to assign patient');
      }
    }
  };

  const handleRemoveRelationship = (relationshipId: string) => {
    console.log('🗑️ [AdminDashboard] Removing relationship:', relationshipId);
    
    setError(null);
    setSuccess(null);

    try {
      const relationship = relationships.find(r => r.id === relationshipId);
      if (!relationship) {
        throw new Error('Relationship not found');
      }

      userManagementService.removePatientFromDoctor(
        relationship.patientId,
        relationship.doctorId
      );

      setSuccess('Relationship removed successfully!');
      loadData();
      
      console.log('✅ [AdminDashboard] Relationship removed');
    } catch (err) {
      console.error('❌ [AdminDashboard] Error removing relationship:', err);
      if (err instanceof UserManagementError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to remove relationship');
      }
    }
  };

  const patients = users.filter(u => u.role === UserRoleEnum.PATIENT);
  const doctors = users.filter(u => u.role === UserRoleEnum.DOCTOR);

  // Group relationships by patient
  const groupedRelationships = relationships.reduce((acc, rel) => {
    if (!acc[rel.patientId]) {
      acc[rel.patientId] = [];
    }
    acc[rel.patientId].push(rel);
    return acc;
  }, {} as Record<string, PatientDoctorRelationship[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-medical-bg">
        <Header 
          userName={currentUser?.name || 'Admin'} 
          userRole="patient"
          onLogout={handleLogout}
        />
        <div className="flex items-center justify-center h-64">
          <p className="text-medical-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-medical-bg">
      <Header 
        userName={currentUser?.name || 'Admin'} 
        userRole="patient"
        onLogout={handleLogout}
      />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-medical-text mb-2">Admin Dashboard</h1>
          <p className="text-medical-text/70">Manage users and patient-doctor assignments</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {/* Create User Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-medical-text flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Create New User
            </h2>
            <button
              onClick={() => {
                setShowCreateForm(!showCreateForm);
                setEditingUser(null); // Close edit form if open
              }}
              className="px-4 py-2 bg-medical-primary text-white rounded-lg hover:bg-blue-700"
            >
              {showCreateForm ? 'Cancel' : 'New User'}
            </button>
          </div>

          {showCreateForm && (
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={newUser.username || ''}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Password *
                  </label>
                  <input
                    type="password"
                    value={newUser.password || ''}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={newUser.name || ''}
                    onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Role *
                  </label>
                  <select
                    value={newUser.role || UserRoleEnum.PATIENT}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value={UserRoleEnum.PATIENT}>Patient</option>
                    <option value={UserRoleEnum.DOCTOR}>Doctor</option>
                    <option value={UserRoleEnum.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-medical-primary text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Create User
              </button>
            </form>
          )}
        </div>

        {/* Edit User Section */}
        {editingUser && (
          <div className="bg-white rounded-lg shadow-sm border border-blue-300 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-medical-text flex items-center gap-2">
                <Edit2 className="w-5 h-5" />
                Edit User: {editingUser.name}
              </h2>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={editFormData.username || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Password (leave blank to keep current)
                  </label>
                  <input
                    type="password"
                    value={editFormData.password || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    placeholder="Enter new password or leave blank"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-medical-text mb-2">
                    Role *
                  </label>
                  <select
                    value={editFormData.role || UserRoleEnum.PATIENT}
                    onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value={UserRoleEnum.PATIENT}>Patient</option>
                    <option value={UserRoleEnum.DOCTOR}>Doctor</option>
                    <option value={UserRoleEnum.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-medical-primary text-white py-3 rounded-lg hover:bg-blue-700"
              >
                Update User
              </button>
            </form>
          </div>
        )}

        {/* Users List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-medical-text flex items-center gap-2 mb-4">
            <Users className="w-5 h-5" />
            All Users ({users.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Username</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Name</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Role</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-gray-100">
                    <td className="py-3 px-4 text-sm text-medical-text">{user.username}</td>
                    <td className="py-3 px-4 text-sm text-medical-text">{user.name}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.role === UserRoleEnum.ADMIN ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRoleEnum.DOCTOR ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-medical-text">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit2 className="w-4 h-4" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Patient-Doctor Assignments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-medical-text flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5" />
            Patient-Doctor Assignments
          </h2>

          {/* Assignment Form */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-medical-text mb-3">Assign Patient to Doctor</h3>
            <div className="grid grid-cols-3 gap-4">
              <select
                value={selectedPatient}
                onChange={(e) => setSelectedPatient(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Patient</option>
                {patients.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <select
                value={selectedDoctor}
                onChange={(e) => setSelectedDoctor(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Doctor</option>
                {doctors.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
              <button
                onClick={handleAssignPatient}
                disabled={!selectedPatient || !selectedDoctor}
                className="bg-medical-primary text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Assign
              </button>
            </div>
          </div>

          {/* Relationships Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Patient</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Doctors</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Assigned</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-medical-text">Actions</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedRelationships).map(([patientId, patientRelationships]) => {
                  const patient = users.find(u => u.id === patientId);
                  const doctorNames = patientRelationships
                    .map(rel => {
                      const doctor = users.find(u => u.id === rel.doctorId);
                      return doctor?.name || 'Unknown';
                    })
                    .join(', ');
                  
                  const assignedDates = patientRelationships
                    .map(rel => new Date(rel.assignedAt).toLocaleDateString())
                    .join(', ');

                  return (
                    <tr key={patientId} className="border-b border-gray-100">
                      <td className="py-3 px-4 text-sm text-medical-text">{patient?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-sm text-medical-text">{doctorNames}</td>
                      <td className="py-3 px-4 text-sm text-medical-text">{assignedDates}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          {patientRelationships.map(rel => {
                            const doctor = users.find(u => u.id === rel.doctorId);
                            return (
                              <button
                                key={rel.id}
                                onClick={() => handleRemoveRelationship(rel.id)}
                                className="text-red-600 hover:text-red-800 flex items-center gap-1 text-xs"
                              >
                                <Trash2 className="w-3 h-3" />
                                Remove {doctor?.name}
                              </button>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {Object.keys(groupedRelationships).length === 0 && (
              <p className="text-center py-8 text-medical-text/70">No assignments yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
