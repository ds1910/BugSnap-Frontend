import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  X, 
  Send, 
  Minimize2, 
  Maximize2, 
  Bot, 
  User, 
  Sparkles, 
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  BarChart3,
  Users,
  Bug,
  FileText,
  MessageSquare,
  Folder,
  Clock,
  AlertTriangle,
  Plus,
  Star,
  ArrowRight,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import { QUESTION_TREE, QUICK_ACTIONS, CONTEXTUAL_SUGGESTIONS } from './QuestionTree';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const EnhancedAIBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState('main');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [questionPath, setQuestionPath] = useState([]);
  const [customQuery, setCustomQuery] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [userContext, setUserContext] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Icon mapping
  const iconMap = {
    bug: Bug,
    users: Users,
    user: User,
    chart: BarChart3,
    folder: Folder,
    message: MessageSquare,
    clock: Clock,
    'alert-triangle': AlertTriangle,
    plus: Plus,
    star: Star
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize bot when opened for the first time
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initializeBot();
    }
  }, [isOpen]);

  const initializeBot = async () => {
    try {
      // Get user context and suggestions
      const response = await axios.get(`${backendUrl}/bot/context`, {
        withCredentials: true
      });

      if (response.data.success) {
        setUserContext(response.data.data.context);
        setSuggestions(response.data.data.suggestions || []);
      }

      // Add welcome message
      addBotMessage(
        "👋 Welcome to BugSnap AI Assistant! I'm here to help you manage your projects efficiently.",
        'welcome'
      );
      
      setTimeout(() => {
        addBotMessage(
          "What would you like to do today? Choose from the categories below or ask me anything!",
          'categories'
        );
      }, 1000);

    } catch (error) {
      // console.error('Bot initialization error:', error);
      addBotMessage(
        "Hi! I'm your BugSnap AI Assistant. How can I help you today?",
        'welcome'
      );
    }
  };

  const addBotMessage = (content, type = 'text', data = null) => {
    const message = {
      id: Date.now(),
      type: 'bot',
      content,
      messageType: type,
      data,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const addUserMessage = (content) => {
    const message = {
      id: Date.now(),
      type: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleCategorySelection = (category) => {
    setSelectedCategory(category);
    setCurrentStep('category');
    setQuestionPath([category.title]);
    
    addUserMessage(`I want to work with ${category.title}`);
    
    setTimeout(() => {
      const categoryData = QUESTION_TREE[category.id.toUpperCase()];
      if (categoryData) {
        addBotMessage(
          `Great! Here are the ${category.title.toLowerCase()} options:`,
          'subcategories',
          { category: category.id, subcategories: categoryData }
        );
      }
    }, 500);
  };

  const handleSubcategorySelection = (subcategory, subcategoryKey) => {
    setSelectedSubcategory(subcategory);
    setQuestionPath(prev => [...prev, subcategory.title]);
    
    addUserMessage(subcategory.title);
    
    setTimeout(() => {
      if (subcategory.questions) {
        addBotMessage(
          `Here are the available options for ${subcategory.title.toLowerCase()}:`,
          'questions',
          { questions: subcategory.questions, category: selectedCategory.id }
        );
      } else if (subcategory.followUp) {
        // Handle follow-up questions
        const followUpData = QUESTION_TREE[selectedCategory.id.toUpperCase()][subcategory.followUp];
        if (followUpData) {
          addBotMessage(
            `Let me help you with ${subcategory.title.toLowerCase()}:`,
            'followup',
            { followUp: followUpData, category: selectedCategory.id }
          );
        }
      }
    }, 500);
  };

  const handleQuestionSelection = async (question) => {
    console.log('💬 Frontend: Question selected:', question);
    addUserMessage(question);
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      console.log('🚀 Frontend: Sending request to backend...');
      // Process the question through the backend
      const response = await axios.post(`${backendUrl}/bot/chat`, {
        message: question,
        context: {
          category: selectedCategory?.id,
          path: questionPath,
          userContext
        }
      }, {
        withCredentials: true
      });

      console.log('✅ Frontend: Response received from backend:', {
        success: response.data?.success,
        hasResponse: !!response.data?.data?.response,
        responseLength: response.data?.data?.response?.length
      });

      setIsTyping(false);
      
      if (response.data.success) {
        addBotMessage(
          response.data.data.response || "I've processed your request!",
          'result',
          response.data.data
        );
        
        // Add contextual suggestions
        if (response.data.data.suggestions) {
          setTimeout(() => {
            addBotMessage(
              "Would you like to try any of these related actions?",
              'suggestions',
              { suggestions: response.data.data.suggestions }
            );
          }, 1000);
        }
      } else {
        addBotMessage("I encountered an issue processing your request. Please try again.", 'error');
      }
      
    } catch (error) {
      setIsTyping(false);
      // console.error('Question processing error:', error);
      addBotMessage(
        "I'm having trouble processing your request right now. Please try again later.",
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomQuery = async () => {
    if (!inputMessage.trim()) return;
    
    const userQuery = inputMessage.trim();
    console.log('📝 Frontend: Custom query entered:', userQuery);
    setInputMessage('');
    addUserMessage(userQuery);
    setIsLoading(true);
    setIsTyping(true);
    
    try {
      console.log('🚀 Frontend: Sending custom query to backend...');
      const response = await axios.post(`${backendUrl}/bot/chat`, {
        message: userQuery,
        context: {
          category: selectedCategory?.id,
          path: questionPath,
          userContext
        }
      }, {
        withCredentials: true
      });

      setIsTyping(false);
      
      if (response.data.success) {
        addBotMessage(
          response.data.data.response || "I've processed your request!",
          'result',
          response.data.data
        );
      } else {
        addBotMessage("I couldn't understand your request. Please try rephrasing it.", 'error');
      }
      
    } catch (error) {
      setIsTyping(false);
      // console.error('Custom query error:', error);
      addBotMessage(
        "I'm having trouble understanding your request. Please try again.",
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetToMain = () => {
    setCurrentStep('main');
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setQuestionPath([]);
    setCustomQuery(false);
    
    addBotMessage(
      "What else would you like to do? Choose from the categories below:",
      'categories'
    );
  };

  const goBack = () => {
    if (questionPath.length > 1) {
      const newPath = questionPath.slice(0, -1);
      setQuestionPath(newPath);
      
      if (newPath.length === 1) {
        // Go back to category level
        setCurrentStep('category');
        setSelectedSubcategory(null);
        const categoryData = QUESTION_TREE[selectedCategory.id.toUpperCase()];
        addBotMessage(
          `Back to ${selectedCategory.title.toLowerCase()} options:`,
          'subcategories',
          { category: selectedCategory.id, subcategories: categoryData }
        );
      }
    } else {
      resetToMain();
    }
  };

  const renderMessage = (message) => {
    const isBot = message.type === 'bot';
    
    return (
      <div key={message.id} className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
        <div className={`flex max-w-[80%] ${isBot ? 'flex-row' : 'flex-row-reverse'}`}>
          {/* Avatar */}
          <div className={`flex-shrink-0 ${isBot ? 'mr-3' : 'ml-3'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              isBot 
                ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                : 'bg-gradient-to-r from-green-500 to-teal-600'
            }`}>
              {isBot ? <Bot size={16} className="text-white" /> : <User size={16} className="text-white" />}
            </div>
          </div>
          
          {/* Message Content */}
          <div className={`rounded-2xl p-4 ${
            isBot 
              ? 'bg-gray-800 border border-gray-700 text-gray-100' 
              : 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
          } shadow-lg`}>
            {renderMessageContent(message)}
          </div>
        </div>
      </div>
    );
  };

  const renderMessageContent = (message) => {
    switch (message.messageType) {
      case 'welcome':
        return (
          <div className="space-y-2">
            <p className="text-sm">{message.content}</p>
            <div className="flex items-center space-x-2 text-xs text-gray-400">
              <Sparkles size={12} />
              <span>Powered by AI</span>
            </div>
          </div>
        );
        
      case 'categories':
        return (
          <div className="space-y-3">
            <p className="text-sm mb-3">{message.content}</p>
            <div className="grid grid-cols-2 gap-2">
              {QUESTION_TREE.MAIN_CATEGORIES.map((category) => {
                const IconComponent = iconMap[category.icon] || Bug;
                return (
                  <button
                    key={category.id}
                    onClick={() => handleCategorySelection(category)}
                    className="flex items-center space-x-2 p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left border border-gray-600 hover:border-gray-500"
                  >
                    <IconComponent size={16} style={{ color: category.color }} />
                    <div>
                      <div className="text-xs font-medium text-gray-200">{category.title}</div>
                      <div className="text-xs text-gray-400">{category.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            {/* Quick Actions */}
            <div className="mt-4 pt-3 border-t border-gray-600">
              <p className="text-xs text-gray-400 mb-2">⚡ Quick Actions:</p>
              <div className="flex flex-wrap gap-1">
                {QUICK_ACTIONS.slice(0, 4).map((action) => {
                  const IconComponent = iconMap[action.icon] || Star;
                  return (
                    <button
                      key={action.id}
                      onClick={() => handleQuestionSelection(action.query)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-md bg-gray-600 hover:bg-gray-500 transition-colors text-xs"
                    >
                      <IconComponent size={12} style={{ color: action.color }} />
                      <span>{action.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
        
      case 'subcategories':
        return (
          <div className="space-y-3">
            <p className="text-sm">{message.content}</p>
            <div className="space-y-2">
              {Object.entries(message.data.subcategories).map(([key, subcategory]) => (
                <button
                  key={key}
                  onClick={() => handleSubcategorySelection(subcategory, key)}
                  className="flex items-center justify-between w-full p-3 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left border border-gray-600 hover:border-gray-500"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-200">{subcategory.title}</div>
                    {subcategory.questions && (
                      <div className="text-xs text-gray-400">{subcategory.questions.length} options available</div>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'questions':
        return (
          <div className="space-y-3">
            <p className="text-sm">{message.content}</p>
            <div className="space-y-2">
              {message.data.questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionSelection(question)}
                  className="flex items-center justify-between w-full p-2 rounded-lg bg-gray-700 hover:bg-gray-600 transition-colors text-left border border-gray-600 hover:border-gray-500"
                >
                  <span className="text-sm text-gray-200">{question}</span>
                  <ArrowRight size={14} className="text-gray-400" />
                </button>
              ))}
            </div>
          </div>
        );
        
      case 'result':
        return (
          <div className="space-y-3">
            <p className="text-sm">{message.content}</p>
            {message.data && renderResultData(message.data)}
          </div>
        );
        
      case 'suggestions':
        return (
          <div className="space-y-3">
            <p className="text-sm">{message.content}</p>
            <div className="flex flex-wrap gap-2">
              {message.data.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionSelection(suggestion)}
                  className="px-3 py-1 rounded-full bg-blue-600 hover:bg-blue-500 transition-colors text-xs"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        );
        
      default:
        return <p className="text-sm">{message.content}</p>;
    }
  };

  const renderResultData = (data) => {
    if (data.bugs && Array.isArray(data.bugs)) {
      return (
        <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-sm font-medium text-gray-200 mb-2">📋 Bug Results ({data.bugs.length})</h4>
          {data.bugs.slice(0, 5).map((bug, index) => (
            <div key={index} className="flex justify-between items-center py-2 border-b border-gray-600 last:border-b-0">
              <div>
                <div className="text-xs font-medium text-gray-200">{bug.title || 'Untitled Bug'}</div>
                <div className="text-xs text-gray-400">
                  {bug.status} • {bug.priority} • {bug.assignedTo?.length || 0} assigned
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs ${
                bug.priority === 'critical' ? 'bg-red-600' :
                bug.priority === 'high' ? 'bg-orange-600' :
                bug.priority === 'medium' ? 'bg-yellow-600' : 'bg-green-600'
              }`}>
                {bug.priority}
              </div>
            </div>
          ))}
          {data.bugs.length > 5 && (
            <div className="text-xs text-gray-400 mt-2">... and {data.bugs.length - 5} more</div>
          )}
        </div>
      );
    }
    
    if (data.teams && Array.isArray(data.teams)) {
      return (
        <div className="mt-3 p-3 bg-gray-700 rounded-lg border border-gray-600">
          <h4 className="text-sm font-medium text-gray-200 mb-2">👥 Team Results ({data.teams.length})</h4>
          {data.teams.slice(0, 3).map((team, index) => (
            <div key={index} className="py-2 border-b border-gray-600 last:border-b-0">
              <div className="text-xs font-medium text-gray-200">{team.name}</div>
              <div className="text-xs text-gray-400">{team.members?.length || 0} members</div>
            </div>
          ))}
        </div>
      );
    }
    
    return null;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 hover:scale-110"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${
      isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]'
    }`}>
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden h-full flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-white font-medium text-sm">BugSnap AI Assistant</h3>
              {isTyping && (
                <div className="flex items-center space-x-1 text-xs text-blue-100">
                  <Loader2 size={12} className="animate-spin" />
                  <span>AI is thinking...</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {questionPath.length > 0 && (
              <button
                onClick={goBack}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Go Back"
              >
                <ChevronLeft size={16} className="text-white" />
              </button>
            )}
            
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              {isMinimized ? <Maximize2 size={16} className="text-white" /> : <Minimize2 size={16} className="text-white" />}
            </button>
            
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={16} className="text-white" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Breadcrumb */}
            {questionPath.length > 0 && (
              <div className="px-4 py-2 bg-gray-800 border-b border-gray-700">
                <div className="flex items-center space-x-2 text-xs text-gray-400">
                  <span>Home</span>
                  {questionPath.map((path, index) => (
                    <React.Fragment key={index}>
                      <ChevronRight size={12} />
                      <span className={index === questionPath.length - 1 ? 'text-blue-400' : ''}>{path}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-900">
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleCustomQuery()}
                    placeholder="Type your question..."
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                    disabled={isLoading}
                  />
                </div>
                <button
                  onClick={handleCustomQuery}
                  disabled={isLoading || !inputMessage.trim()}
                  className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
              
              {/* Quick reset */}
              <div className="flex justify-between items-center mt-2">
                <button
                  onClick={resetToMain}
                  className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                >
                  🏠 Back to Main Menu
                </button>
                <div className="text-xs text-gray-500">
                  Press Enter to send
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedAIBot;