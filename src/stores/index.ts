/**
 * Stores index - Central export for all Zustand stores
 * 
 * Exports:
 * - useUserStore: User authentication and profile management
 * - useMissionStore: Patient mission management
 * - useAgentStore: AI workflow management
 * - useActionItemStore: Doctor action item review management
 * - useConfigStore: Demo scenario configuration management
 */

export { useUserStore } from './userStore';
export { useMissionStore } from './missionStore';
export { useAgentStore } from './agentStore';
export { useActionItemStore } from './actionItemStore';
export { useConfigStore } from './configStore';
