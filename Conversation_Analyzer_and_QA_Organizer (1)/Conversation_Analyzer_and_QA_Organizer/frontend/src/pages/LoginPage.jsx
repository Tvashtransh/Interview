import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
import { User, Briefcase, LogIn } from 'lucide-react';

const LoginPage = () => {
  const [selectedRole, setSelectedRole] = useState(null);
  const [name, setName] = useState('');
  const { login } = useRole();
  const navigate = useNavigate();

  const handleLogin = () => {
    if (!selectedRole) {
      alert('Please select a role');
      return;
    }
    login(selectedRole, name.trim());
    navigate(selectedRole === 'hr' ? '/hr/dashboard' : '/candidate/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-2">
            Welcome to Q&A Analyzer
          </h2>
          <p className="text-gray-600">
            Select your role to continue
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name (Optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Select Your Role
            </label>
            <div className="space-y-3">
              {/* HR Role */}
              <button
                onClick={() => setSelectedRole('hr')}
                className={`w-full p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'hr'
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'hr' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">HR / Recruiter</div>
                    <div className="text-sm text-gray-600">Manage questions, view analytics</div>
                  </div>
                  {selectedRole === 'hr' && (
                    <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>

              {/* Candidate Role */}
              <button
                onClick={() => setSelectedRole('candidate')}
                className={`w-full p-4 border-2 rounded-lg transition-all ${
                  selectedRole === 'candidate'
                    ? 'border-purple-500 bg-purple-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === 'candidate' ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900">Candidate</div>
                    <div className="text-sm text-gray-600">Practice questions, prepare for interviews</div>
                  </div>
                  {selectedRole === 'candidate' && (
                    <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white"></div>
                    </div>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            onClick={handleLogin}
            disabled={!selectedRole}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <LogIn className="w-5 h-5" />
            <span>Continue</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

