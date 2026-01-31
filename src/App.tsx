import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-medical-bg text-medical-text">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-medical-primary mb-4">
          RecoveryPilot
        </h1>
        <p className="text-lg">
          Autonomous care orchestrator for post-operative recovery logistics
        </p>
        <div className="mt-8 space-y-4">
          <div className="p-4 bg-white rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gamification-accent">
              Gamification Theme
            </h2>
            <p className="text-gamification-success">Success color</p>
            <p className="text-gamification-agent">Agent active color</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
