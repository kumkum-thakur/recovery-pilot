/**
 * DebugMenu - Hidden debug menu for demo scenario configuration
 * 
 * Provides a floating UI to switch between demo scenarios:
 * - SCENARIO_HAPPY_PATH: All uploads = Green/Healthy, Insurance = Approved
 * - SCENARIO_RISK_DETECTED: Next upload = Red/Infected, triggers Doctor Triage
 * 
 * Toggle visibility with: Ctrl+Shift+D (or Cmd+Shift+D on Mac)
 * 
 * Requirements: 15.1, 15.2
 */

import { useState, useEffect } from 'react';
import { Settings, Check } from 'lucide-react';
import { useConfigStore } from '../stores';
import { DemoScenario } from '../types';

/**