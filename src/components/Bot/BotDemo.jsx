import React from 'react';
import { Bot, MessageCircle, Zap, Users, Bug, BarChart } from 'lucide-react';

const BotDemo = ({ onTryBot }) => {
  const features = [
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: "Natural Language Chat",
      description: "Ask questions in plain English and get intelligent responses"
    },
    {
      icon: <Bug className="w-6 h-6" />,
      title: "Bug Management",
      description: "Create, view, and manage bugs with AI assistance"
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Team Collaboration",
      description: "Get team insights and manage member interactions"
    },
    {
      icon: <BarChart className="w-6 h-6" />,
      title: "Project Analytics",
      description: "Get instant project overview and statistics"
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Smart Suggestions",
      description: "Contextual suggestions based on your conversation"
    }
  ];

  const examplePrompts = [
    "Show me all high priority bugs",
    "Create a new team called 'Frontend Team'",
    "Who are my team members?",
    "What's my project status?",
    "Find bugs related to login",
    "Assign bug #123 to John"
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Bot className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Meet Your AI Assistant
        </h2>
        <p className="text-gray-600 text-lg">
          Powered by Natural Language Processing to help you manage your projects effortlessly
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {features.map((feature, index) => (
          <div key={index} className="bg-gray-50 p-4 rounded-lg">
            <div className="text-blue-600 mb-3">
              {feature.icon}
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-sm">
              {feature.description}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">
          Try these example prompts:
        </h3>
        <div className="grid md:grid-cols-2 gap-3">
          {examplePrompts.map((prompt, index) => (
            <div
              key={index}
              className="bg-white p-3 rounded border text-sm text-gray-700 hover:bg-blue-100 cursor-pointer transition-colors"
              onClick={() => onTryBot && onTryBot(prompt)}
            >
              "{prompt}"
            </div>
          ))}
        </div>
      </div>

      <div className="text-center">
        <button
          onClick={() => onTryBot && onTryBot()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors inline-flex items-center space-x-2"
        >
          <MessageCircle className="w-5 h-5" />
          <span>Start Chatting with AI</span>
        </button>
      </div>

      <div className="mt-6 text-center text-sm text-gray-500">
        <p>The AI assistant learns from your project context and provides intelligent responses.</p>
        <p>All conversations are secure and your data remains private.</p>
      </div>
    </div>
  );
};

export default BotDemo;