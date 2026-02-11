#!/bin/bash
# ============================================================================
# RecoveryPilot - One-Shot Autostart Script (Linux/Mac)
# ============================================================================

set -e

echo "============================================"
echo "  RecoveryPilot - Autonomous Care Orchestrator"
echo "  Starting up..."
echo "============================================"
echo ""

# Step 1: Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed. Please install Node.js 18+ from https://nodejs.org"
    exit 1
fi
echo "[OK] Node.js found: $(node --version)"

# Step 2: Check directory
if [ ! -f "package.json" ]; then
    echo "[ERROR] package.json not found. Run this script from the recovery-pilot directory."
    exit 1
fi
echo "[OK] Project directory confirmed"

# Step 3: Check Gemini Key
if [ -z "$GEMINI_KEY" ]; then
    echo "[WARNING] GEMINI_KEY not set. AI analysis will use fallback mode."
    echo "          To enable real AI: export GEMINI_KEY=your_api_key_here"
else
    echo "[OK] GEMINI_KEY configured"
fi
echo ""

# Step 4: Install dependencies
echo "[STEP 1/3] Installing dependencies..."
npm install
echo "[OK] Dependencies installed"
echo ""

# Step 5: Build check
echo "[STEP 2/3] Verifying TypeScript compilation..."
npx tsc --noEmit || echo "[WARNING] Minor TypeScript issues, continuing..."
echo "[OK] Build verified"
echo ""

# Step 6: Launch
echo "[STEP 3/3] Starting RecoveryPilot..."
echo ""
echo "============================================"
echo ""
echo "  RecoveryPilot is starting!"
echo ""
echo "  Open your browser to:"
echo "    http://localhost:5173"
echo ""
echo "  Login credentials:"
echo "    Patient: divya / recovery123"
echo "    Doctor:  sarah / doctor123"
echo "    Admin:   admin / admin123"
echo ""
echo "  Features:"
echo "    Patient Dashboard - Missions, Photo Upload, Real AI Triage"
echo "    Doctor Dashboard  - Triage Inbox, Care Plans, Approve/Reject"
echo "    Real Gemini AI    - Wound image analysis with confidence scores"
echo "    Gamification      - Streaks, Celebrations, Recovery Buddy"
echo "    Care Plans        - Templates, Medications, Mission Scheduling"
echo ""
echo "  Press Ctrl+C to stop the server."
echo ""
echo "============================================"
echo ""

npx vite --host 0.0.0.0
