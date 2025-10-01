import React, { useState, useEffect } from 'react';
import LoadingScreen from './UI/LoadingScreen';

/* 
 * LoadingScreenDemo.jsx - Interactive Demo Component
 * 
 * A demo page to test and showcase the new futuristic loading screen
 * with different configurations and scenarios.
 */

const LoadingScreenDemo = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(null);
  const [message, setMessage] = useState("Loading BugSnap...");
  const [showLogo, setShowLogo] = useState(true);

  // Simulate loading with progress
  const simulateProgressLoading = () => {
    setIsLoading(true);
    setProgress(0);
    setMessage("Initializing BugSnap...");

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsLoading(false);
            setProgress(null);
          }, 1000);
          return 100;
        }
        
        // Update message based on progress
        if (prev < 30) {
          setMessage("Connecting to server...");
        } else if (prev < 60) {
          setMessage("Loading your dashboard...");
        } else if (prev < 90) {
          setMessage("Preparing bug tracker...");
        } else {
          setMessage("Almost ready!");
        }
        
        return prev + Math.random() * 15;
      });
    }, 300);
  };

  // Simulate indefinite loading
  const simulateIndefiniteLoading = () => {
    setIsLoading(true);
    setProgress(null);
    setMessage("Processing your request...");
    
    setTimeout(() => {
      setIsLoading(false);
    }, 8000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          BugSnap Loading Screen Demo
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-gray-700">
            🚀 Interactive Demo Controls
          </h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-600">Loading Scenarios</h3>
              
              <button
                onClick={simulateProgressLoading}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🎯 Progress Loading (with percentage)
              </button>
              
              <button
                onClick={simulateIndefiniteLoading}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gradient-to-r from-pink-600 to-yellow-600 text-white font-medium rounded-lg hover:from-pink-700 hover:to-yellow-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ♾️ Indefinite Loading
              </button>
              
              <button
                onClick={() => setIsLoading(false)}
                className="w-full px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 transition-all"
              >
                ❌ Stop Loading
              </button>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-600">Customization</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Loading Message
                </label>
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter custom message..."
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="showLogo"
                  checked={showLogo}
                  onChange={(e) => setShowLogo(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="showLogo" className="text-sm font-medium text-gray-700">
                  Show BugSnap Logo
                </label>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-700 mb-4">✨ Features Showcase</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🎨 Visual Effects</h4>
                <ul className="space-y-1">
                  <li>• Dynamic gradient backgrounds</li>
                  <li>• Morphing BugSnap logo animation</li>
                  <li>• Floating particle effects</li>
                  <li>• Multi-layer spinning elements</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">🔧 Technical Features</h4>
                <ul className="space-y-1">
                  <li>• Progress tracking support</li>
                  <li>• Accessibility (ARIA labels)</li>
                  <li>• Responsive design</li>
                  <li>• Smooth transitions</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">
            📊 Current State
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="font-medium text-blue-800">Loading Status</div>
              <div className="text-blue-600">
                {isLoading ? "🟢 Active" : "🔴 Inactive"}
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="font-medium text-green-800">Progress</div>
              <div className="text-green-600">
                {progress !== null ? `${Math.round(progress)}%` : "Indefinite"}
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="font-medium text-purple-800">Message</div>
              <div className="text-purple-600 truncate" title={message}>
                {message}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Loading Screen Component */}
      <LoadingScreen
        isVisible={isLoading}
        message={message}
        progress={progress}
        showLogo={showLogo}
      />
    </div>
  );
};

export default LoadingScreenDemo;