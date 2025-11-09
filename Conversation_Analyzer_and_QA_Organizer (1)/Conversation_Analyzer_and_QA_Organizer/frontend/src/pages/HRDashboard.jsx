import { useState, useEffect } from 'react';
import { useRole } from '../contexts/RoleContext';
import { BarChart3, Upload, Users, FileText, TrendingUp, Filter, Search } from 'lucide-react';

const HRDashboard = () => {
  const { role, userName } = useRole();
  const [stats, setStats] = useState({
    totalQuestions: 0,
    totalTags: 0,
    totalChats: 0,
    recentActivity: 0
  });
  const [questions, setQuestions] = useState([]);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, [selectedTags, searchQuery]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load questions
      const questionsRes = await fetch(
        `http://localhost:5000/api/formatted-questions?${selectedTags.length > 0 ? `tags=${selectedTags.join(',')}&` : ''}${searchQuery ? `search=${searchQuery}&` : ''}page=1&limit=50`
      );
      const questionsData = await questionsRes.json();
      setQuestions(questionsData.questions || []);

      // Load tags
      const tagsRes = await fetch('http://localhost:5000/api/formatted-questions/tags');
      const tagsData = await tagsRes.json();
      setTags(tagsData.tags || []);

      // Calculate stats
      setStats({
        totalQuestions: questionsData.pagination?.total || 0,
        totalTags: tagsData.tags?.length || 0,
        totalChats: 0, // Would need separate endpoint
        recentActivity: questionsData.questions?.length || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  if (role !== 'hr') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to HR users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            HR Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome back{userName ? `, ${userName}` : ''}! Manage and analyze interview questions
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Questions</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalQuestions}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tags</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalTags}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Filter className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Chats</p>
                <p className="text-3xl font-bold text-gray-800">{stats.totalChats}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Recent Activity</p>
                <p className="text-3xl font-bold text-gray-800">{stats.recentActivity}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Tag Filters */}
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 10).map((tagObj) => (
                <button
                  key={tagObj.tag}
                  onClick={() => handleTagToggle(tagObj.tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedTags.includes(tagObj.tag)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {tagObj.tag} ({tagObj.count})
                </button>
              ))}
              {selectedTags.length > 0 && (
                <button
                  onClick={() => setSelectedTags([])}
                  className="px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Questions</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading questions...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No questions found. Upload a file to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q.questionId} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-800 font-medium mb-2">{q.cleanedQuestion || q.originalQuestion}</p>
                      {q.tags && q.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {q.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HRDashboard;

