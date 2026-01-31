/**
 * LoginPage - User authentication interface
 * 
 * Provides login functionality for both patients and doctors with:
 * - Username and password input fields
 * - Form validation
 * - Role auto-detection from credentials
 * - Error message display
 * - Connection to UserStore
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, AlertCircle } from 'lucide-react';
import { useUserStore } from '../stores/userStore';
import { UserRole } from '../types';

/**
 * LoginPage component
 * 
 * Renders a login form with username and password fields.
 * On successful login, redirects to the appropriate dashboard based on user role.
 * 
 * Requirements: 1.1, 1.2, 2.1, 2.2
 */
export function LoginPage() {
  const navigate = useNavigate();
  const login = useUserStore((state) => state.login);
  
  // Form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Validates form inputs
   * 
   * @returns true if form is valid, false otherwise
   */
  const validateForm = (): boolean => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (!password.trim()) {
      setError('Password is required');
      return false;
    }
    
    return true;
  };

  /**
   * Handles form submission
   * 
   * Validates inputs, attempts login, and redirects on success.
   * Displays error message on failure.
   * 
   * Requirements: 1.1, 1.2, 2.1, 2.2
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Attempt login via UserStore
      await login({ username, password });
      
      // Get the logged-in user to determine redirect
      const currentUser = useUserStore.getState().currentUser;
      
      if (!currentUser) {
        throw new Error('Login succeeded but user not found');
      }
      
      // Redirect based on role
      if (currentUser.role === UserRole.PATIENT) {
        navigate('/patient');
      } else if (currentUser.role === UserRole.DOCTOR) {
        navigate('/doctor');
      } else {
        throw new Error('Unknown user role');
      }
    } catch (err) {
      // Display user-friendly error message
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-medical-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-medical-primary mb-2">
            RecoveryPilot
          </h1>
          <p className="text-medical-text opacity-70">
            Autonomous care orchestrator for post-operative recovery
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-medical-primary" />
          </div>
          
          <h2 className="text-2xl font-semibold text-medical-text text-center mb-6">
            Sign In
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username Field */}
            <div>
              <label 
                htmlFor="username" 
                className="block text-sm font-medium text-medical-text mb-2"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                placeholder="Enter your username"
                disabled={isLoading}
                autoComplete="username"
              />
            </div>

            {/* Password Field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-medical-text mb-2"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-primary focus:border-transparent"
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-medical-primary text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-medical-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials Hint */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center mb-2">
              Demo Credentials:
            </p>
            <div className="text-xs text-gray-600 space-y-1">
              <p className="text-center">
                <span className="font-medium">Patient:</span> divya / divya
              </p>
              <p className="text-center">
                <span className="font-medium">Doctor:</span> dr.smith / smith
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Role is automatically detected from your credentials
        </p>
      </div>
    </div>
  );
}
