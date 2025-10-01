
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, UserPlus, Mail, MessageCircle } from 'lucide-react';
import InvitePopup from './InvitePopup';

const NoPeopleState = ({ onInvitePeople }) => {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [toast, setToast] = useState(null);
  
  const showToast = (message, type = "success") => setToast({ message, type });

  const handleInviteClick = () => {
    setShowInviteModal(true);
  };

  const handleInviteSuccess = (emails) => {
    setShowInviteModal(false);
    showToast(`Invite sent to ${emails}`, "success");
    // Also call the parent callback if provided
    if (onInvitePeople) {
      onInvitePeople();
    }
  };

  const handleInviteError = (errMsg) => {
    showToast(errMsg || "Invite failed", "error");
  };
  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.6, -0.05, 0.01, 0.99],
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: [0.6, -0.05, 0.01, 0.99]
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [-10, 10, -10],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="min-h-[50vh] max-h-[88vh] 
                 flex flex-col items-center justify-center 
                 bg-[#2C2C2C]
                 rounded-xl lg:rounded-2xl 
                 p-4 sm:p-6 lg:p-8 
                 relative overflow-hidden
                 border border-zinc-700/60
                 shadow-2xl shadow-black/30
                 hover:shadow-black/40 hover:border-zinc-600/70
                 transition-all duration-500 ease-out
                 backdrop-blur-sm
                 mx-auto max-w-6xl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2C2C2C]/80 via-[#2C2C2C] to-[#2C2C2C]" />
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.08, 0.15, 0.08],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-32 -left-32 w-64 h-64 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.06, 0.12, 0.06],
          rotate: [360, 180, 0]
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-32 -right-32 w-64 h-64 bg-gradient-to-r from-zinc-600/10 to-zinc-500/10 rounded-full blur-3xl"
      />

      {/* Content */}
      <motion.div 
        variants={itemVariants}
        className="relative flex flex-col items-center text-center z-10"
      >
        <motion.div 
          variants={floatingVariants}
          animate="animate"
          whileHover={{ 
            scale: 1.1, 
            rotate: [0, -10, 10, 0],
            transition: { duration: 0.3 }
          }}
          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 
                      bg-gradient-to-br from-zinc-600/60 to-zinc-700/80
                      rounded-xl lg:rounded-2xl 
                      flex items-center justify-center 
                      mb-4 sm:mb-6
                      border border-zinc-600/70 shadow-xl backdrop-blur-sm
                      hover:border-zinc-500/80 hover:shadow-zinc-600/30
                      transition-all duration-300 ease-out
                      transform-gpu relative overflow-hidden">
          {/* Inner glow effect */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300" />
          <UserPlus size={28} className="sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-zinc-300 hover:text-white transition-colors duration-300 relative z-10" />
        </motion.div>

        <motion.h2 
          variants={itemVariants}
          className="text-xl sm:text-2xl lg:text-3xl font-bold text-white 
                     mb-3 sm:mb-4 text-center"
        >
          No Team Members Yet
        </motion.h2>
        <motion.p 
          variants={itemVariants}
          className="text-gray-400 max-w-sm sm:max-w-md lg:max-w-lg 
                     mb-6 sm:mb-8 text-center leading-relaxed
                     text-sm sm:text-base"
        >
          Start building your team by inviting members. Collaborate and manage projects together.
        </motion.p>

        <motion.button
          variants={itemVariants}
          onClick={handleInviteClick}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 sm:gap-3 
                   px-6 sm:px-8 py-3 sm:py-4
                   bg-gradient-to-r from-[#1F51FF] to-[#4169E1] text-white font-semibold
                   rounded-xl shadow-lg text-sm sm:text-base
                   transition-all duration-300 ease-out
                   hover:shadow-blue-500/25 hover:shadow-xl
                   border border-blue-500/20 hover:border-blue-400/30
                   active:scale-95 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <Mail size={18} className="sm:w-5 sm:h-5 relative z-10" />
          <span className="relative z-10">Invite People</span>
        </motion.button>
      </motion.div>

      {/* Tips */}
      <motion.div
        variants={itemVariants}
        className="mt-10 sm:mt-12 
                   grid grid-cols-1 sm:grid-cols-3 
                   gap-4 sm:gap-6 
                   max-w-sm sm:max-w-3xl 
                   relative z-10 w-full"
      >
        {[
          {
            icon: Users,
            title: "Collaborate",
            description: "Work together efficiently with your team members in real-time"
          },
          {
            icon: UserPlus,
            title: "Assign",
            description: "Easily assign bugs and tasks to team members based on expertise"
          },
          {
            icon: MessageCircle,
            title: "Communicate",
            description: "Keep everyone in sync with updates, comments and notifications"
          }
        ].map((tip, index) => {
          const IconComponent = tip.icon;
          return (
            <motion.div 
              key={index}
              whileHover={{ 
                scale: 1.05,
                y: -5,
                transition: { duration: 0.2 }
              }}
              className="p-4 sm:p-6 rounded-xl 
                bg-gradient-to-br from-[#2C2C2C]/60 to-[#2C2C2C]/80
                border border-zinc-700/60 backdrop-blur-sm
                hover:bg-gradient-to-br hover:from-[#2C2C2C]/70 hover:to-[#2C2C2C]/90
                hover:border-zinc-600/70
                transition-all duration-300 ease-out
                shadow-lg hover:shadow-zinc-900/50
                relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <div className="w-10 h-10 sm:w-12 sm:h-12 
                               bg-zinc-600/40 rounded-lg 
                               flex items-center justify-center 
                               mb-3 sm:mb-4 
                               group-hover:bg-zinc-500/50 transition-colors duration-300">
                  <IconComponent size={20} className="sm:w-6 sm:h-6 text-zinc-300 group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-white font-bold mb-2 sm:mb-3 text-base sm:text-lg">{tip.title}</h3>
                <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{tip.description}</p>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* InvitePopup Modal */}
      {showInviteModal && (
        <InvitePopup
          onClose={() => setShowInviteModal(false)}
          onInvite={handleInviteSuccess}
          onInviteError={handleInviteError}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999] 
            transform transition-all duration-500 ease-in-out
            ${
              toast.type === "success"
                ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white"
                : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400 text-white"
            }`}
        >
          {toast.type === "success" ? (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-3 text-white/70 hover:text-white transition"
          >
            ✕
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default NoPeopleState;