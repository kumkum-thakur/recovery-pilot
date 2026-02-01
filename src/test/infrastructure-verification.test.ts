/**
 * Infrastructure Verification Tests
 * 
 * Task 6: Checkpoint - Core infrastructure complete
 * 
 * This test suite verifies:
 * 1. All stores are working with persistence
 * 2. Authentication flow works end-to-end
 * 3. Seed data loads correctly
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { persistenceService } from '../services/persistenceService';
import { authService } from '../services/authService';
import { initializeSeedData, SEED_USERS, SEED_MISSIONS } from '../services/seedData';
import { useUserStore } from '../stores/userStore';
import { useMissionStore } from '../stores/missionStore';
import { useAgentStore } from '../stores/agentStore';
import { useActionItemStore } from '../stores/actionItemStore';
import { UserRole, MissionStatus, ActionItemStatus, ActionItemType } from '../types';

describe('Task 6: Core Infrastructure Verification', () => {
  beforeEach(() => {
    // Clear all data before each test
    persistenceService.clearAll();
    authService.logout();
    
    // Reset all stores
    useUserStore.setState({
      currentUser: null,
      isAuthenticated: false,
    });
    useMissionStore.setState({
      missions: [],
      isLoading: false,
    });
    useAgentStore.setState({
      currentWorkflow: null,
      isProcessing: false,
    });
    useActionItemStore.setState({
      actionItems: [],
      isLoading: false,
    });
  });

  describe('1. Persistence Service', () => {
    it('should store and retrieve data correctly', () => {
      const testData = { name: 'Test', value: 123 };
      
      persistenceService.set('test_key', testData);
      const retrieved = persistenceService.get<typeof testData>('test_key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should handle JSON serialization correctly', () => {
      const complexData = {
        string: 'hello',
        number: 42,
        boolean: true,
        array: [1, 2, 3],
        nested: { key: 'value' },
      };
      
      persistenceService.set('complex_key', complexData);
      const retrieved = persistenceService.get<typeof complexData>('complex_key');
      
      expect(retrieved).toEqual(complexData);
    });

    it('should return null for non-existent keys', () => {
      const result = persistenceService.get('non_existent_key');
      expect(result).toBeNull();
    });
  });

  describe('2. Seed Data Initialization', () => {
    it('should initialize seed users correctly', () => {
      initializeSeedData(persistenceService);
      
      const users = persistenceService.getAllUsers();
      
      expect(users).toHaveLength(2);
      expect(users[0].username).toBe('divya');
      expect(users[0].role).toBe(UserRole.PATIENT);
      expect(users[1].username).toBe('dr.smith');
      expect(users[1].role).toBe(UserRole.DOCTOR);
    });

    it('should initialize seed missions correctly', () => {
      initializeSeedData(persistenceService);
      
      const missions = persistenceService.getAllMissions();
      
      expect(missions).toHaveLength(2);
      expect(missions[0].title).toBe('Mission 1: Scan Incision');
      expect(missions[0].status).toBe(MissionStatus.PENDING);
      expect(missions[1].title).toBe('Mission 2: Medication Check');
    });

    it('should not duplicate seed data on multiple initializations', () => {
      initializeSeedData(persistenceService);
      initializeSeedData(persistenceService);
      
      const users = persistenceService.getAllUsers();
      const missions = persistenceService.getAllMissions();
      
      expect(users).toHaveLength(2);
      expect(missions).toHaveLength(2);
    });
  });

  describe('3. Authentication Flow', () => {
    beforeEach(() => {
      initializeSeedData(persistenceService);
    });

    it('should authenticate patient with valid credentials', async () => {
      const user = await authService.login('divya', 'divya');
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Divya Patel');
      expect(user.role).toBe(UserRole.PATIENT);
      expect(user.streakCount).toBe(3);
    });

    it('should authenticate doctor with valid credentials', async () => {
      const user = await authService.login('dr.smith', 'smith');
      
      expect(user).toBeDefined();
      expect(user.name).toBe('Dr. Sarah Smith');
      expect(user.role).toBe(UserRole.DOCTOR);
    });

    it('should reject invalid credentials', async () => {
      await expect(authService.login('divya', 'wrong_password'))
        .rejects.toThrow('Invalid username or password');
    });

    it('should reject non-existent user', async () => {
      await expect(authService.login('nonexistent', 'password'))
        .rejects.toThrow('Invalid username or password');
    });

    it('should maintain session after login', async () => {
      await authService.login('divya', 'divya');
      
      const currentUser = authService.getCurrentUser();
      
      expect(currentUser).toBeDefined();
      expect(currentUser?.name).toBe('Divya Patel');
    });

    it('should clear session on logout', async () => {
      await authService.login('divya', 'divya');
      authService.logout();
      
      const currentUser = authService.getCurrentUser();
      
      expect(currentUser).toBeNull();
    });
  });

  describe('4. UserStore Integration', () => {
    beforeEach(() => {
      initializeSeedData(persistenceService);
    });

    it('should update store state on successful login', async () => {
      const store = useUserStore.getState();
      
      await store.login({ username: 'divya', password: 'divya' });
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.currentUser?.name).toBe('Divya Patel');
    });

    it('should clear store state on logout', async () => {
      const store = useUserStore.getState();
      
      await store.login({ username: 'divya', password: 'divya' });
      store.logout();
      
      const state = useUserStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.currentUser).toBeNull();
    });

    it('should update streak count for patient', async () => {
      const store = useUserStore.getState();
      
      await store.login({ username: 'divya', password: 'divya' });
      store.updateStreak(5);
      
      const state = useUserStore.getState();
      expect(state.currentUser?.streakCount).toBe(5);
      
      // Verify persistence
      const userModel = persistenceService.getUser('patient-1');
      expect(userModel?.streakCount).toBe(5);
    });
  });

  describe('5. MissionStore Integration', () => {
    beforeEach(() => {
      // Seed data must be initialized after parent beforeEach clears everything
      initializeSeedData(persistenceService);
    });

    it('should fetch missions for patient', async () => {
      const store = useMissionStore.getState();
      
      await store.fetchMissions('patient-1');
      
      const state = useMissionStore.getState();
      expect(state.missions).toHaveLength(2);
      expect(state.missions[0].title).toBe('Mission 1: Scan Incision');
    });

    it('should complete a mission', async () => {
      // Re-initialize to ensure fresh data
      initializeSeedData(persistenceService);
      
      const store = useMissionStore.getState();
      
      await store.fetchMissions('patient-1');
      
      // Get the mission ID after fetching
      const state = useMissionStore.getState();
      expect(state.missions.length).toBeGreaterThan(0);
      const missionId = state.missions[0].id;
      
      await store.completeMission(missionId);
      
      const updatedState = useMissionStore.getState();
      const completedMission = updatedState.missions.find(m => m.id === missionId);
      expect(completedMission?.status).toBe(MissionStatus.COMPLETED);
      
      // Verify persistence
      const missionModel = persistenceService.getMission(missionId);
      expect(missionModel?.status).toBe(MissionStatus.COMPLETED);
      expect(missionModel?.completedAt).toBeDefined();
    });

    it('should set correct action button text for mission types', async () => {
      const store = useMissionStore.getState();
      
      await store.fetchMissions('patient-1');
      
      const state = useMissionStore.getState();
      const photoMission = state.missions.find(m => m.type === 'photo_upload');
      const medMission = state.missions.find(m => m.type === 'medication_check');
      
      expect(photoMission?.actionButtonText).toBe('Scan Incision');
      expect(medMission?.actionButtonText).toBe('Mark Complete');
    });
  });

  describe('6. AgentStore Integration', () => {
    it('should execute triage workflow', async () => {
      const store = useAgentStore.getState();
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      // Start workflow (don't await - we'll check state during execution)
      const workflowPromise = store.startTriageWorkflow(mockFile);
      
      // Check that workflow started
      let state = useAgentStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.currentWorkflow).toHaveLength(3);
      
      // Wait for workflow to complete
      await workflowPromise;
      
      // Check that workflow completed
      state = useAgentStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.currentWorkflow?.every(step => step.status === 'completed')).toBe(true);
    });

    it('should execute refill workflow', async () => {
      const store = useAgentStore.getState();
      
      // Start workflow
      const workflowPromise = store.startRefillWorkflow('Amoxicillin');
      
      // Check that workflow started
      let state = useAgentStore.getState();
      expect(state.isProcessing).toBe(true);
      expect(state.currentWorkflow).toHaveLength(3);
      
      // Wait for workflow to complete
      await workflowPromise;
      
      // Check that workflow completed
      state = useAgentStore.getState();
      expect(state.isProcessing).toBe(false);
      expect(state.currentWorkflow?.every(step => step.status === 'completed')).toBe(true);
    });

    it('should clear workflow', async () => {
      const store = useAgentStore.getState();
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      await store.startTriageWorkflow(mockFile);
      store.clearWorkflow();
      
      const state = useAgentStore.getState();
      expect(state.currentWorkflow).toBeNull();
      expect(state.isProcessing).toBe(false);
    });
  });

  describe('7. ActionItemStore Integration', () => {
    beforeEach(() => {
      initializeSeedData(persistenceService);
      
      // Create test action items
      persistenceService.saveActionItem({
        id: 'action-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
        imageUrl: 'data:image/jpeg;base64,test',
        triageAnalysis: 'red',
        triageText: 'Redness detected',
        aiConfidenceScore: 0.87,
      });
    });

    it('should fetch action items for doctor', async () => {
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const state = useActionItemStore.getState();
      expect(state.actionItems).toHaveLength(1);
      expect(state.actionItems[0].patientName).toBe('Divya Patel');
    });

    it('should approve action item', async () => {
      // Re-initialize to ensure fresh data
      persistenceService.saveActionItem({
        id: 'action-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
        imageUrl: 'data:image/jpeg;base64,test',
        triageAnalysis: 'red',
        triageText: 'Redness detected',
        aiConfidenceScore: 0.87,
      });
      
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const state = useActionItemStore.getState();
      expect(state.actionItems.length).toBeGreaterThan(0);
      const itemId = state.actionItems[0].id;
      
      await store.approveItem(itemId);
      
      const updatedState = useActionItemStore.getState();
      expect(updatedState.actionItems).toHaveLength(0); // Removed from pending list
      
      // Verify persistence
      const itemModel = persistenceService.getActionItem(itemId);
      expect(itemModel?.status).toBe(ActionItemStatus.APPROVED);
    });

    it('should reject action item with reason', async () => {
      // Re-initialize to ensure fresh data
      persistenceService.saveActionItem({
        id: 'action-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
        imageUrl: 'data:image/jpeg;base64,test',
        triageAnalysis: 'red',
        triageText: 'Redness detected',
        aiConfidenceScore: 0.87,
      });
      
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const state = useActionItemStore.getState();
      expect(state.actionItems.length).toBeGreaterThan(0);
      const itemId = state.actionItems[0].id;
      
      await store.rejectItem(itemId, 'Image quality too low');
      
      const updatedState = useActionItemStore.getState();
      expect(updatedState.actionItems).toHaveLength(0); // Removed from pending list
      
      // Verify persistence
      const itemModel = persistenceService.getActionItem(itemId);
      expect(itemModel?.status).toBe(ActionItemStatus.REJECTED);
      expect(itemModel?.rejectionReason).toBe('Image quality too low');
    });

    it('should require rejection reason', async () => {
      // Re-initialize to ensure fresh data
      persistenceService.saveActionItem({
        id: 'action-1',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        doctorId: 'doctor-1',
        imageUrl: 'data:image/jpeg;base64,test',
        triageAnalysis: 'red',
        triageText: 'Redness detected',
        aiConfidenceScore: 0.87,
      });
      
      const store = useActionItemStore.getState();
      
      await store.fetchActionItems('doctor-1');
      
      const state = useActionItemStore.getState();
      expect(state.actionItems.length).toBeGreaterThan(0);
      const itemId = state.actionItems[0].id;
      
      await expect(store.rejectItem(itemId, ''))
        .rejects.toThrow('Rejection reason is required');
    });
  });

  describe('8. End-to-End Integration', () => {
    beforeEach(() => {
      initializeSeedData(persistenceService);
    });

    it('should complete full patient workflow', async () => {
      // 1. Patient logs in
      const userStore = useUserStore.getState();
      await userStore.login({ username: 'divya', password: 'divya' });
      
      expect(useUserStore.getState().isAuthenticated).toBe(true);
      
      // 2. Fetch missions
      const missionStore = useMissionStore.getState();
      await missionStore.fetchMissions('patient-1');
      
      expect(useMissionStore.getState().missions).toHaveLength(2);
      
      // 3. Complete a mission
      const missionId = useMissionStore.getState().missions[0].id;
      await missionStore.completeMission(missionId);
      
      const completedMission = useMissionStore.getState().missions.find(m => m.id === missionId);
      expect(completedMission?.status).toBe(MissionStatus.COMPLETED);
      
      // 4. Update streak
      userStore.updateStreak(4);
      
      expect(useUserStore.getState().currentUser?.streakCount).toBe(4);
    });

    it('should complete full doctor workflow', async () => {
      // Setup: Create an action item
      persistenceService.saveActionItem({
        id: 'action-test',
        patientId: 'patient-1',
        patientName: 'Divya Patel',
        type: ActionItemType.TRIAGE,
        status: ActionItemStatus.PENDING_DOCTOR,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        imageUrl: 'data:image/jpeg;base64,test',
        triageAnalysis: 'red',
        triageText: 'Redness detected',
        aiConfidenceScore: 0.87,
      });
      
      // 1. Doctor logs in
      const userStore = useUserStore.getState();
      await userStore.login({ username: 'dr.smith', password: 'smith' });
      
      expect(useUserStore.getState().isAuthenticated).toBe(true);
      
      // 2. Fetch action items
      const actionItemStore = useActionItemStore.getState();
      await actionItemStore.fetchActionItems('doctor-1');
      
      expect(useActionItemStore.getState().actionItems).toHaveLength(1);
      
      // 3. Approve action item
      const itemId = useActionItemStore.getState().actionItems[0].id;
      await actionItemStore.approveItem(itemId);
      
      expect(useActionItemStore.getState().actionItems).toHaveLength(0);
      
      // Verify persistence
      const itemModel = persistenceService.getActionItem(itemId);
      expect(itemModel?.status).toBe(ActionItemStatus.APPROVED);
    });
  });
});
