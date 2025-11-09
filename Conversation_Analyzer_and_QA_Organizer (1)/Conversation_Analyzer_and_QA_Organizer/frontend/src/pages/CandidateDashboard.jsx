import { useState, useEffect } from 'react';
import { useRole } from '../contexts/RoleContext';
import { User, BookOpen, Target, Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const CandidateDashboard = () => {
  const { role, userName } = useRole();
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [selectedTags, setSelectedTags] = useState([]);
  const [tags, setTags] = useState([]);
  const [practiceStats, setPracticeStats] = useState({
    totalPracticed: 0,
    correctAnswers: 0,
    timeSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuestions();
  }, [selectedTags]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: '1',
        limit: '100'
      });
      
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const res = await fetch(`http://localhost:5000/api/formatted-questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);

      // Load tags
      const tagsRes = await fetch('http://localhost:5000/api/formatted-questions/tags');
      const tagsData = await tagsRes.json();
      setTags(tagsData.tags || []);

      // Reset to first question
      setCurrentQuestionIndex(0);
      setShowAnswer(false);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setShowAnswer(false);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setShowAnswer(false);
    }
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleMarkCorrect = () => {
    setPracticeStats(prev => ({
      ...prev,
      totalPracticed: prev.totalPracticed + 1,
      correctAnswers: prev.correctAnswers + 1
    }));
  };

  const handleMarkIncorrect = () => {
    setPracticeStats(prev => ({
      ...prev,
      totalPracticed: prev.totalPracticed + 1
    }));
  };

  const currentQuestion = questions[currentQuestionIndex];

  if (role !== 'candidate') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h2>
          <p className="text-gray-600">This page is only accessible to candidates.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Candidate Practice Dashboard
          </h1>
          <p className="text-gray-600">
            Welcome{userName ? `, ${userName}` : ''}! Practice interview questions and track your progress
          </p>
        </div>

        {/* Practice Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Questions Practiced</p>
                <p className="text-3xl font-bold text-gray-800">{practiceStats.totalPracticed}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
                <p className="text-3xl font-bold text-green-600">{practiceStats.correctAnswers}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-purple-600">
                  {practiceStats.totalPracticed > 0 
                    ? Math.round((practiceStats.correctAnswers / practiceStats.totalPracticed) * 100)
                    : 0}%
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Tag Filters */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter by Technology</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {tags.map((tagObj) => (
                  <button
                    key={tagObj.tag}
                    onClick={() => handleTagToggle(tagObj.tag)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      selectedTags.includes(tagObj.tag)
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tagObj.tag} ({tagObj.count})
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Main Content - Question Practice */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading questions...</p>
              </div>
            ) : questions.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No questions available. Please check back later.</p>
              </div>
            ) : currentQuestion ? (
              <div className="bg-white rounded-xl shadow-md p-8">
                {/* Question Counter */}
                <div className="flex items-center justify-between mb-6">
                  <div className="text-sm text-gray-600">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleMarkCorrect}
                      className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors flex items-center space-x-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Correct</span>
                    </button>
                    <button
                      onClick={handleMarkIncorrect}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Incorrect</span>
                    </button>
                  </div>
                </div>

                {/* Question */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4">
                    {currentQuestion.cleanedQuestion || currentQuestion.originalQuestion}
                  </h2>
                  {currentQuestion.tags && currentQuestion.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {currentQuestion.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Answer Toggle */}
                <div className="mb-6">
                  <button
                    onClick={() => setShowAnswer(!showAnswer)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                  >
                    {showAnswer ? 'Hide Answer' : 'Show Answer'}
                  </button>
                </div>

                {/* Answer Section */}
                {showAnswer && (
                  <div className="bg-purple-50 rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Answer:</h3>
                    <p className="text-gray-700">
                      This is where the answer would be displayed. In a full implementation, 
                      you would fetch the answer from the backend or display it from the question data.
                    </p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                  <button
                    onClick={handlePreviousQuestion}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => {
                      const randomIndex = Math.floor(Math.random() * questions.length);
                      setCurrentQuestionIndex(randomIndex);
                      setShowAnswer(false);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Random</span>
                  </button>
                  <button
                    onClick={handleNextQuestion}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateDashboard;

