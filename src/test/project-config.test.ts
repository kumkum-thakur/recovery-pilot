/**
 * Project Configuration Tests
 * 
 * Tests for project setup and configuration
 * 
 * Requirements: Technical Constraints 1
 */

import { describe, it, expect } from 'vitest';
import tailwindConfig from '../../tailwind.config.js';
import packageJson from '../../package.json';

describe('Project Configuration', () => {
  describe('Tailwind Theme Colors', () => {
    it('should have medical core colors configured', () => {
      const colors = tailwindConfig.theme.extend.colors;
      
      // Verify medical colors exist
      expect(colors.medical).toBeDefined();
      expect(colors.medical.bg).toBe('#f8fafc'); // slate-50
      expect(colors.medical.text).toBe('#0f172a'); // slate-900
      expect(colors.medical.primary).toBe('#2563eb'); // blue-600
    });

    it('should have gamification colors configured', () => {
      const colors = tailwindConfig.theme.extend.colors;
      
      // Verify gamification colors exist
      expect(colors.gamification).toBeDefined();
      expect(colors.gamification.accent).toBe('#8b5cf6'); // violet-500
      expect(colors.gamification.success).toBe('#34d399'); // emerald-400
      expect(colors.gamification.agent).toBe('#fbbf24'); // amber-400
    });

    it('should have correct font families configured', () => {
      const fontFamily = tailwindConfig.theme.extend.fontFamily;
      
      // Verify font families
      expect(fontFamily.sans).toEqual(['Inter', 'system-ui', 'sans-serif']);
      expect(fontFamily.mono).toEqual(['Space Grotesk', 'monospace']);
    });

    it('should have content paths configured for React files', () => {
      const content = tailwindConfig.content;
      
      // Verify content paths include HTML and React files
      expect(content).toContain('./index.html');
      expect(content).toContain('./src/**/*.{js,ts,jsx,tsx}');
    });
  });

  describe('Required Dependencies', () => {
    it('should have React installed', () => {
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
    });

    it('should have Zustand for state management', () => {
      expect(packageJson.dependencies.zustand).toBeDefined();
    });

    it('should have React Router for routing', () => {
      expect(packageJson.dependencies['react-router-dom']).toBeDefined();
    });

    it('should have Lucide React for icons', () => {
      expect(packageJson.dependencies['lucide-react']).toBeDefined();
    });

    it('should have Framer Motion for animations', () => {
      expect(packageJson.dependencies['framer-motion']).toBeDefined();
    });

    it('should have Tailwind CSS installed', () => {
      expect(packageJson.devDependencies.tailwindcss).toBeDefined();
      expect(packageJson.devDependencies.autoprefixer).toBeDefined();
      expect(packageJson.devDependencies.postcss).toBeDefined();
    });

    it('should have Vitest for testing', () => {
      expect(packageJson.devDependencies.vitest).toBeDefined();
    });

    it('should have fast-check for property-based testing', () => {
      expect(packageJson.devDependencies['fast-check']).toBeDefined();
    });

    it('should have TypeScript installed', () => {
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });

    it('should have Testing Library for React component testing', () => {
      expect(packageJson.devDependencies['@testing-library/react']).toBeDefined();
      expect(packageJson.devDependencies['@testing-library/jest-dom']).toBeDefined();
    });
  });

  describe('Project Scripts', () => {
    it('should have development script', () => {
      expect(packageJson.scripts.dev).toBe('vite');
    });

    it('should have build script', () => {
      expect(packageJson.scripts.build).toBe('tsc -b && vite build');
    });

    it('should have test scripts', () => {
      expect(packageJson.scripts.test).toBe('vitest');
      expect(packageJson.scripts['test:ui']).toBe('vitest --ui');
      expect(packageJson.scripts['test:coverage']).toBe('vitest --coverage');
    });

    it('should have lint script', () => {
      expect(packageJson.scripts.lint).toBe('eslint .');
    });
  });

  describe('Project Type', () => {
    it('should be configured as ES module', () => {
      expect(packageJson.type).toBe('module');
    });

    it('should have correct project name', () => {
      expect(packageJson.name).toBe('recovery-pilot');
    });
  });
});
