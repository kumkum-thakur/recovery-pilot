/**
 * Property-based tests for Agent Service
 * 
 * Uses fast-check to verify universal properties of the workflow step simulator
 * across a wide range of inputs.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { simulateWorkflowSteps } from './agentService';
import type { AgentStep, AgentStepStatus } from '../types';

describe('Agent Service - Property-Based Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('simulateWorkflowSteps properties', () => {
    it('Property: Each step yields exactly 2 results (in_progress, completed)', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate an array of 1-10 steps with random properties
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.option(fc.nat({ max: 5000 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: Total results should be exactly 2 × number of steps
            expect(results.length).toBe(steps.length * 2);
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('Property: Steps are processed in order', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.option(fc.nat({ max: 5000 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: Step IDs should appear in the same order as input
            for (let i = 0; i < steps.length; i++) {
              const expectedId = steps[i].id;
              const inProgressIndex = i * 2;
              const completedIndex = i * 2 + 1;

              expect(results[inProgressIndex].id).toBe(expectedId);
              expect(results[completedIndex].id).toBe(expectedId);
            }
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('Property: Each step transitions from in_progress to completed', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.option(fc.nat({ max: 5000 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: For each step, status should be in_progress then completed
            for (let i = 0; i < steps.length; i++) {
              const inProgressIndex = i * 2;
              const completedIndex = i * 2 + 1;

              expect(results[inProgressIndex].status).toBe('in_progress');
              expect(results[completedIndex].status).toBe('completed');
            }
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('Property: Step labels and IDs are preserved', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.option(fc.nat({ max: 5000 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: Labels and IDs should match original steps
            for (let i = 0; i < steps.length; i++) {
              const originalStep = steps[i];
              const inProgressStep = results[i * 2];
              const completedStep = results[i * 2 + 1];

              expect(inProgressStep.id).toBe(originalStep.id);
              expect(inProgressStep.label).toBe(originalStep.label);
              expect(completedStep.id).toBe(originalStep.id);
              expect(completedStep.label).toBe(originalStep.label);
            }
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('Property: Original step objects are not mutated', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.option(fc.nat({ max: 5000 }), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            // Deep clone to preserve original state
            const originalSteps = JSON.parse(JSON.stringify(steps));

            const generator = simulateWorkflowSteps(steps);

            const promise = (async () => {
              for await (const _step of generator) {
                // Just consume the generator
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: Original steps should be unchanged
            expect(steps).toEqual(originalSteps);
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });

    it('Property: Empty array yields no results', async () => {
      const generator = simulateWorkflowSteps([]);
      const results: AgentStep[] = [];

      for await (const step of generator) {
        results.push(step);
      }

      expect(results).toHaveLength(0);
    });

    it('Property: Duration defaults to 1000ms when undefined', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              // Explicitly no duration field
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            // Advance by less than 1000ms per step
            const totalTime = (steps.length * 1000) - 100;
            await vi.advanceTimersByTimeAsync(totalTime);

            // Should not have all completed steps yet
            const completedCount = results.filter(r => r.status === 'completed').length;
            expect(completedCount).toBeLessThan(steps.length);

            // Complete the rest
            await vi.runAllTimersAsync();
            await promise;

            // Now all should be complete
            expect(results.length).toBe(steps.length * 2);
          }
        ),
        { numRuns: 50 }
      );
    });

    it('Property: Steps with zero duration still yield both states', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.constant(0),
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (steps) => {
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            await vi.runAllTimersAsync();
            await promise;

            // Property: Even with 0 duration, should yield 2 states per step
            expect(results.length).toBe(steps.length * 2);

            // All odd indices should be in_progress, even indices completed
            for (let i = 0; i < results.length; i++) {
              if (i % 2 === 0) {
                expect(results[i].status).toBe('in_progress');
              } else {
                expect(results[i].status).toBe('completed');
              }
            }
          }
        ),
        { numRuns: 20 } // Reduced for faster execution
      );
    });
  });

  describe('Workflow timing properties', () => {
    it('Property: Total execution time equals sum of durations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              label: fc.string({ minLength: 1, maxLength: 100 }),
              status: fc.constant('pending' as AgentStepStatus),
              duration: fc.integer({ min: 100, max: 1000 }), // Ensure minimum duration to avoid timing issues
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (steps) => {
            const totalDuration = steps.reduce((sum, step) => sum + (step.duration ?? 1000), 0);
            
            const generator = simulateWorkflowSteps(steps);
            const results: AgentStep[] = [];

            const promise = (async () => {
              for await (const step of generator) {
                results.push(step);
              }
            })();

            // Only test timing if total duration is significant enough
            if (totalDuration > 50) {
              // Advance by total duration minus a small amount
              await vi.advanceTimersByTimeAsync(totalDuration - 50);

              // Should not be fully complete yet
              const completedCount = results.filter(r => r.status === 'completed').length;
              expect(completedCount).toBeLessThan(steps.length);
            }

            // Complete the rest
            await vi.runAllTimersAsync();
            await promise;

            // Now should be fully complete
            expect(results.length).toBe(steps.length * 2);
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
