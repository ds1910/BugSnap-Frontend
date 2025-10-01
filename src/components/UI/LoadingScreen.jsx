import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* 
 * LoadingScreen.jsx - Futuristic Loading Animation
 * 
 * A vibrant, tech-inspired loading screen featuring:
 * - Dynamic gradient backgrounds with smooth color transitions
 * - Morphing BugSnap logo animation
 * - Floating tech icons with particle effects
 * - Animated progress indicators and spinners
 * - ClickUp-inspired neon gradients (purple-to-blue, pink-to-yellow)
 * - Full accessibility support with ARIA labels
 */

const LoadingScreen = ({ 
  message = "Loading BugSnap...", 
  isVisible = false, 
  progress = null,
  showLogo = true 
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const [gradientPhase, setGradientPhase] = useState(0);

  // Cycle through animation phases and gradient colors
  useEffect(() => {
    if (!isVisible) return;

    const phaseInterval = setInterval(() => {
      setAnimationPhase(prev => (prev + 1) % 3);
    }, 2000);

    const gradientInterval = setInterval(() => {
      setGradientPhase(prev => (prev + 1) % 4);
    }, 3000);

    return () => {
      clearInterval(phaseInterval);
      clearInterval(gradientInterval);
    };
  }, [isVisible]);

  // Dynamic gradient backgrounds inspired by ClickUp
  const gradientBackgrounds = [
    'linear-gradient(135deg, #7612FA 0%, #40DDFF 50%, #FF6B9D 100%)', // Purple-Blue-Pink
    'linear-gradient(45deg, #FF6B9D 0%, #FFD23F 50%, #40DDFF 100%)',  // Pink-Yellow-Blue
    'linear-gradient(225deg, #40DDFF 0%, #7612FA 50%, #FF6B9D 100%)', // Blue-Purple-Pink
    'linear-gradient(315deg, #FFD23F 0%, #FF6B9D 50%, #7612FA 100%)'  // Yellow-Pink-Purple
  ];

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
        style={{
          background: gradientBackgrounds[gradientPhase],
          transition: 'background 3s ease-in-out'
        }}
        role="status"
        aria-live="polite"
        aria-label="Loading content"
      >
        {/* Animated Background Particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 6 + 2,
                height: Math.random() * 6 + 2,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut"
              }}
            />
          ))}
        </div>

        {/* Floating Tech Icons */}
        <div className="absolute inset-0">
          {[
            { icon: "🐛", delay: 0, path: "M-50,50 Q150,30 350,70" },
            { icon: "⚙️", delay: 0.5, path: "M350,30 Q150,50 -50,10" },
            { icon: "🔧", delay: 1, path: "M50,350 Q100,150 150,350" },
            { icon: "📋", delay: 1.5, path: "M300,350 Q250,150 200,350" },
            { icon: "✅", delay: 2, path: "M-30,200 Q200,180 430,220" },
          ].map((item, i) => (
            <motion.div
              key={`tech-icon-${i}`}
              className="absolute text-2xl opacity-30"
              initial={{ pathOffset: 0, opacity: 0 }}
              animate={{
                pathOffset: [0, 1],
                opacity: [0, 0.6, 0],
                rotate: [0, 360],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                delay: item.delay,
                ease: "linear"
              }}
              style={{
                left: `${20 + (i * 15)}%`,
                top: `${10 + (i * 20)}%`,
              }}
            >
              {item.icon}
            </motion.div>
          ))}
        </div>

        {/* Main Loading Content Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: -50 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="relative text-center text-white max-w-md mx-4"
        >
          {/* Morphing BugSnap Logo */}
          {showLogo && (
            <motion.div
              className="mb-8 flex items-center justify-center"
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 4, repeat: Infinity, ease: "easeInOut" },
              }}
            >
              {/* Animated Logo Icon */}
              <motion.svg
                className="w-16 h-16 mr-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="2"
                animate={{
                  pathLength: [0, 1, 0],
                  rotate: animationPhase === 1 ? 360 : 0,
                }}
                transition={{
                  pathLength: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                  rotate: { duration: 2, ease: "easeInOut" },
                }}
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.5))',
                }}
              >
                <motion.path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.103a2.155 2.155 0 010 3.048l-2.484 2.484a2.155 2.155 0 01-3.048 0L9 12M12 2a10 10 0 100 20 10 10 0 000-20z"
                  animate={{
                    strokeWidth: [2, 4, 2],
                    opacity: [0.7, 1, 0.7],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.svg>

              {/* Animated Logo Text */}
              <motion.span
                className="text-4xl font-bold"
                style={{
                  background: 'linear-gradient(45deg, #FFD23F, #FF6B9D, #40DDFF)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundSize: '200% 200%',
                }}
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                bugSnap
              </motion.span>
            </motion.div>
          )}

          {/* Advanced Loading Spinner */}
          <div className="relative mb-8 flex items-center justify-center">
            {/* Outer spinning ring */}
            <motion.div
              className="absolute w-24 h-24 border-4 border-transparent border-t-white/50 rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Middle spinning ring */}
            <motion.div
              className="absolute w-16 h-16 border-4 border-transparent border-r-white/70 rounded-full"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            
            {/* Inner morphing shape */}
            <motion.div
              className="w-8 h-8 bg-white/90 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                borderRadius: ["50%", "20%", "50%"],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Loading Message */}
          <motion.h2
            className="text-2xl font-bold mb-4"
            animate={{
              opacity: [0.7, 1, 0.7],
              y: [0, -5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {message}
          </motion.h2>

          {/* Animated Loading Dots */}
          <motion.div 
            className="flex justify-center space-x-2 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-white rounded-full"
                animate={{
                  y: [0, -15, 0],
                  opacity: [0.4, 1, 0.4],
                  scale: [0.8, 1.2, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>

          {/* Progress Bar */}
          <div className="w-full max-w-xs mx-auto mb-4">
            <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              {progress !== null ? (
                /* Determinate progress */
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ) : (
                /* Indeterminate progress */
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-400 via-pink-400 to-blue-400 rounded-full"
                  style={{ width: '30%' }}
                  animate={{
                    x: ['-100%', '300%'],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </div>
            
            {/* Progress Percentage */}
            {progress !== null && (
              <motion.p
                className="text-center text-sm mt-2 text-white/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {Math.round(progress)}%
              </motion.p>
            )}
          </div>

          {/* Loading Tips */}
          <motion.p
            className="text-sm text-white/70 max-w-sm mx-auto"
            animate={{
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Preparing your bug tracking experience...
          </motion.p>

          {/* Hidden text for screen readers */}
          <span className="sr-only">
            Loading BugSnap application. Please wait while we prepare your dashboard.
          </span>
        </motion.div>

        {/* Corner decorative elements */}
        <motion.div
          className="absolute top-10 left-10 w-20 h-20 border-2 border-white/20 rounded-full"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 180, 270, 360],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-10 right-10 w-16 h-16 border-2 border-white/20 rounded-full"
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [360, 270, 180, 90, 0],
            opacity: [0.5, 0.2, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default LoadingScreen;