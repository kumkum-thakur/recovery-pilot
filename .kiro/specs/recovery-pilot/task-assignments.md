# Task Assignments: RecoveryPilot

## Purpose
This file coordinates work between multiple agents/developers working on RecoveryPilot. Before starting a task, claim it here to avoid conflicts.

## How to Use
1. **Before starting work**: Find an available task and move it to "In Progress" with your agent/developer name
2. **While working**: Keep the task in "In Progress" 
3. **After completing**: Move the task to "Completed" with completion timestamp
4. **If blocked**: Move to "Blocked" with reason and ask for help

## Task Status

### Available Tasks (Ready to Start)
These tasks are ready to be claimed by any agent:

- [ ] 1. Project setup and core infrastructure
- [ ] 2. Define core TypeScript interfaces and types
- [ ] 3. Implement Persistence Service with LocalStorage
  - [ ] 3.1 Create PersistenceService with generic CRUD operations
  - [ ] 3.4 Create seed data (SEED_USERS, SEED_MISSIONS)
- [ ] 4. Implement Authentication Service
  - [ ] 4.1 Create AuthService with login/logout functionality

### In Progress
Format: `- [Agent Name] Task X.Y - Started: YYYY-MM-DD HH:MM`

*No tasks currently in progress*

### Completed
Format: `- [x] Task X.Y - Completed by: [Agent Name] on YYYY-MM-DD HH:MM`

*No tasks completed yet*

### Blocked
Format: `- [!] Task X.Y - Blocked by: [Agent Name] - Reason: [description]`

*No tasks currently blocked*

---

## Task Dependencies

Some tasks must be completed before others can start. Check these dependencies:

**Must complete FIRST:**
- Task 1 (Project setup) → Required for all other tasks
- Task 2 (TypeScript interfaces) → Required for tasks 3-5

**Then these can run in parallel:**
- Task 3 (Persistence Service)
- Task 4 (Authentication Service)
- Task 5 (Zustand stores) - depends on tasks 3 & 4

**After core infrastructure (tasks 1-5):**
- Task 7 (Mock Agent Service) - depends on task 5
- Task 8 (Routing) - depends on task 5
- Task 9 (Login page) - depends on tasks 4, 5, 8

**Patient Dashboard (can parallelize):**
- Task 10 (Patient Dashboard layout) - depends on task 8
- Task 11 (Mission Stream) - depends on task 10
- Task 12 (Photo Capture) - depends on task 11
- Task 13 (Agent Status Toast) - depends on task 7
- Task 14 (Triage Result Display) - depends on task 7

**Doctor Dashboard (can parallelize with Patient Dashboard):**
- Task 17 (Doctor Dashboard layout) - depends on task 8
- Task 18 (Triage Inbox) - depends on task 17
- Task 19 (Action Item Review) - depends on task 18

**Final tasks:**
- Task 16 (Gamification) - depends on task 11
- Task 21 (Error handling) - can start anytime
- Task 22 (Polish) - near the end
- Task 23 (Final testing) - last

---

## Parallel Work Recommendations

### Phase 1: Foundation (Sequential)
**Agent 1:** Task 1 → Task 2
**Agent 2:** Wait for Task 1 to complete, then help with Task 2

### Phase 2: Core Services (Parallel)
**Agent 1:** Task 3 (Persistence Service)
**Agent 2:** Task 4 (Authentication Service)

### Phase 3: State Management (Parallel)
**Agent 1:** Task 5.1, 5.4 (UserStore, MissionStore)
**Agent 2:** Task 5.5, 5.6 (AgentStore, ActionItemStore)

### Phase 4: Services & Routing (Parallel)
**Agent 1:** Task 7 (Mock Agent Service)
**Agent 2:** Task 8 (Routing) → Task 9 (Login page)

### Phase 5: Dashboards (Parallel - Best for 2 agents!)
**Agent 1:** Patient Dashboard (Tasks 10-14, 16)
**Agent 2:** Doctor Dashboard (Tasks 17-19)

### Phase 6: Polish (Parallel)
**Agent 1:** Task 21 (Error handling)
**Agent 2:** Task 22 (Polish & accessibility)

### Phase 7: Final Testing (Together)
**Both Agents:** Task 23 (Final integration testing)

---

## Communication Protocol

### When claiming a task:
```
Claiming Task X.Y: [Task Name]
Agent: [Your Name]
Started: [Timestamp]
Expected completion: [Estimate]
```

### When completing a task:
```
Completed Task X.Y: [Task Name]
Agent: [Your Name]
Completed: [Timestamp]
Notes: [Any important notes for other agents]
```

### When blocked:
```
Blocked on Task X.Y: [Task Name]
Agent: [Your Name]
Reason: [What's blocking you]
Need: [What you need to unblock]
```

---

## Current Recommendations

**Start Here (Agent 1):**
- Claim Task 1 (Project setup) - This unblocks everything else

**Start Here (Agent 2):**
- Wait for Task 1, then claim Task 2 (TypeScript interfaces) or help with Task 1

**After Foundation:**
- Agent 1 → Task 3 (Persistence)
- Agent 2 → Task 4 (Authentication)

This approach maximizes parallel work while respecting dependencies!
