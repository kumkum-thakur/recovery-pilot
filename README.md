# RecoveryPilot - Autonomous Care Orchestrator

An agentic healthcare application that automates post-op recovery logistics through AI-driven task management, gamified patient engagement, and streamlined doctor workflows.

## 🚀 Quick Start for Multi-Agent Development

### For Agent 1 (This System)
You're already set up! The spec is ready in `.kiro/specs/recovery-pilot/`

### For Agent 2 (Other System)
```bash
git clone https://github.com/kumkum-thakur/recovery-pilot.git
cd recovery-pilot
```

## 📋 Coordination System

**Before starting any task:**
1. Open `.kiro/specs/recovery-pilot/task-assignments.md`
2. Find an available task
3. Claim it by moving to "In Progress" with your name
4. Commit and push your claim: `git add . && git commit -m "Claiming Task X.Y" && git push`
5. Pull frequently to see what the other agent is working on: `git pull`

## 📁 Spec Files

- **`requirements.md`** - 15 detailed requirements with acceptance criteria
- **`design.md`** - Complete technical architecture, component hierarchy, 34 correctness properties
- **`tasks.md`** - 24 major tasks broken into 80+ sub-tasks
- **`task-assignments.md`** - Multi-agent coordination file (USE THIS!)

## 🔄 Auto-Sync (Optional)

Run `autosync.bat` to automatically sync changes every 30 seconds:
```bash
autosync.bat
```

This keeps both agents in sync without manual git commands.

## 🏗️ Tech Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **State:** Zustand
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Testing:** Vitest + fast-check (property-based testing)
- **Data:** LocalStorage (MVP) / Supabase (future)

## 👥 Recommended Work Split

### Phase 1: Foundation (Sequential)
- **Agent 1:** Task 1 (Project setup) → Task 2 (TypeScript interfaces)
- **Agent 2:** Wait for Task 1, then help with Task 2

### Phase 2-4: Core Services (Parallel)
- **Agent 1:** Persistence Service, UserStore, MissionStore
- **Agent 2:** Authentication Service, AgentStore, ActionItemStore

### Phase 5: Dashboards (Parallel - BEST SPLIT!)
- **Agent 1:** Patient Dashboard (Tasks 10-14, 16)
- **Agent 2:** Doctor Dashboard (Tasks 17-19)

### Phase 6-7: Polish & Testing
- **Agent 1:** Error handling
- **Agent 2:** Accessibility & polish
- **Both:** Final integration testing

## 🎯 Core Features

### Patient Dashboard (Mobile-First)
- Daily mission stream with gamification
- Photo capture for wound triage
- AI-powered visual analysis
- Streak tracking with celebrations

### Doctor Dashboard (Desktop)
- Action item inbox (not raw chats!)
- One-click approve/reject
- AI-generated context and recommendations

### AI Agent Workflows
- Visual triage with multi-step simulation
- Medication refill automation
- Demo scenarios for reliable presentations

## 📝 Development Guidelines

1. **Check task-assignments.md before starting work**
2. **Commit frequently** - Other agent needs to see your progress
3. **Pull before pushing** - Avoid conflicts
4. **Optional tests marked with `*`** - Skip for faster MVP, add later for quality
5. **Follow checkpoints** - Validate incrementally

## 🧪 Testing Strategy

- **Unit Tests:** Specific examples and edge cases
- **Property Tests:** Universal correctness across all inputs (100+ iterations)
- Both are complementary - unit tests catch concrete bugs, property tests verify general correctness

## 🎨 Design Philosophy

**"Medical but Friendly"**
- Clean whites/blues for medical trust
- Bright orange/purple for gamification
- Large readable fonts for accessibility
- Playful animations for engagement

## 📞 Communication

Use git commit messages to communicate:
```bash
git commit -m "Claiming Task 3.1: Persistence Service"
git commit -m "Completed Task 3.1: All CRUD operations working"
git commit -m "Blocked on Task 5.4: Need Task 3.1 to complete first"
```

## 🚦 Getting Started

1. **Clone the repo** (Agent 2 only)
2. **Open `task-assignments.md`**
3. **Claim your first task**
4. **Start coding!**

Let's build something amazing! 🚀
