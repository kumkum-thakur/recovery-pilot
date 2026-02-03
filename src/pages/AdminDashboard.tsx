/**
 * Admin Dashboard - User management and patient-doctor assignments
 * 
 * Requirements: Enhancement - Admin dashboard
 */

import { useState, useEffect } from 'react';
import { Users, UserPlus, Link as LinkIcon, Trash2 } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { userManagementService, UserCreationData, UserManagementError } from '../services/userManagementService';
import type { UserModel, PatientDoctorRelationship, UserRole } from '../types';
import { UserRole as UserRoleEnum } from '../types';
import { Header } from '../components/Header';

console.log('🎨 [AdminDashboard] Component loaded');

export function AdminDashboard() {
  const currentUser = useUserStore(state => state.currentUser);
  
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

  // Assignment form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');

  console.log('🎨 [AdminDashboard] Rendering with user:', currentUser?.username);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

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
        setError('Failed to assign patien