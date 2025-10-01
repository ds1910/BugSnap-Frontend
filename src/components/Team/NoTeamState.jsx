import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Users, X, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

/* ----------------- Custom Toast Component ----------------- */
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed top-6 right-6 flex items-center gap-3 px-5 py-3 rounded-xl shadow-lg border z-[9999] 
        transform transition-all duration-500 ease-in-out animate-slideIn
        ${
          type === "success"
            ? "bg-gradient-to-r from-green-500 to-emerald-600 border-green-400 text-white"
            : "bg-gradient-to-r from-red-500 to-rose-600 border-red-400 text-white"
        }`}
    >
      {type === "success" ? (
        <CheckCircle size={20} className="text-white" />
      ) : (
        <XCircle size={20} className="text-white" />
      )}
      <span className="font-medium">{message}</span>
    </div>
  );
};

const NoTeamState = ({ onCreateTeam, onTeamCreated }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamDescription, setNewTeamDescription] = useState("");
  const [toast, setToast] = useState(null);
  const showToast = (message, type = "success") => setToast({ message, type });

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) {
      showToast("Team name is required", "error");
      return;
    }

    if (!backendUrl) {
      showToast("Backend URL not configured", "error");
      return;
    }

    try {
      console.log("Attempting to create team:", { name: newTeamName, description: newTeamDescription });
      console.log("Backend URL:", backendUrl);
      
      const response = await axios.post(
        `${backendUrl}/team/create`,
        {
          name: newTeamName,
          description: newTeamDescription || "",
        },
        {
          withCredentials: true,
        }
      );

      console.log("Team creation response:", response);

      if (response.status === 200 || response.status === 201) {
        const returnedTeam = response.data?.team ?? null;
        const userData = JSON.parse(localStorage.getItem("userData"));
        
        // Create team object with user as owner
        const newTeam = returnedTeam || {
          id: Date.now(),
          name: newTeamName,
          description: newTeamDescription || "",
          members: userData ? [{
            id: userData.user?.id || userData.id,
            name: userData.user?.name || userData.name,
            email: userData.user?.email || userData.email,
            isOwner: true,
          }] : [],
          invites: [],
          projects: [],
          bugs: [],
        };

        // Update local storage
        const userTeams = JSON.parse(localStorage.getItem("userTeams")) || [];
        userTeams.push(newTeam);
        localStorage.setItem("userTeams", JSON.stringify(userTeams));
        localStorage.setItem("activeTeam", JSON.stringify(newTeam));
        
        setShowCreateModal(false);
        setNewTeamName("");
        setNewTeamDescription("");
        showToast("Team created successfully!", "success");
        
        // Notify parent component that a team was created
        if (onTeamCreated) {
          onTeamCreated();
        }
      } else {
        showToast(response.data?.message || "Failed to create team", "error");
      }
    } catch (error) {
      console.error("Error creating team:", error);
      
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response:", error.response.data);
        console.error("Error status:", error.response.status);
        
        if (error.response.status === 401) {
          showToast("Please log in first to create a team", "error");
        } else if (error.response.status === 403) {
          showToast("You don't have permission to create a team", "error");
        } else {
          showToast(error.response.data?.message || "Failed to create team", "error");
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.error("No response received:", error.request);
        showToast("Cannot connect to server. Please check your connection.", "error");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Request setup error:", error.message);
        showToast("An error occurred while creating the team", "error");
      }
    }
  };
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.6, -0.05, 0.01, 0.99],
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.6, -0.05, 0.01, 0.99]
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
                 border border-zinc-700/50
                 shadow-2xl shadow-zinc-900/50
                 hover:shadow-zinc-800/50 hover:border-zinc-600/50
                 transition-all duration-500 ease-out
                 mx-auto max-w-6xl"
    >
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#2C2C2C]/80 via-[#2C2C2C] to-[#2C2C2C]" />
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.1, 0.2, 0.1]
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -top-32 -left-32 w-64 h-64 bg-zinc-400/10 rounded-full blur-3xl"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.15, 0.1]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute -bottom-32 -right-32 w-64 h-64 bg-zinc-500/10 rounded-full blur-3xl"
      />

      {/* Content */}
      <motion.div 
        variants={itemVariants}
        className="relative flex flex-col items-center text-center z-10"
      >
        <motion.div 
          whileHover={{ scale: 1.05, rotate: [0, -5, 5, 0] }}
          className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 
                      bg-gradient-to-br from-zinc-700 to-zinc-800 
                      rounded-xl lg:rounded-2xl 
                      flex items-center justify-center 
                      mb-4 sm:mb-6
                      border border-zinc-600 shadow-xl backdrop-blur-sm
                      hover:border-zinc-500 hover:shadow-zinc-700/50
                      transition-all duration-300 ease-out
                      transform-gpu">
          <Users size={28} className="sm:w-8 sm:h-8 lg:w-9 lg:h-9 text-zinc-300 group-hover:text-white transition-colors" />
        </motion.div>

        <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-3 sm:mb-4 text-center">No Team Created Yet</h2>
        <p className="text-gray-400 max-w-sm sm:max-w-md lg:max-w-lg mb-6 sm:mb-8 text-center text-sm sm:text-base leading-relaxed">
          Create your first team to start collaborating with others and track bugs efficiently.
          Teams help you organize your projects seamlessly.
        </p>

        <motion.button
          onClick={() => setShowCreateModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 sm:gap-3 
                   px-6 sm:px-8 py-3 sm:py-4
                   bg-gradient-to-r from-zinc-700 to-zinc-800 text-white
                   rounded-xl font-semibold text-sm sm:text-base
                   transition-all duration-300 ease-out
                   hover:from-zinc-600 hover:to-zinc-700
                   hover:shadow-lg hover:shadow-zinc-700/30
                   border border-zinc-600/50 hover:border-zinc-500/50
                   active:scale-95"
        >
          <Plus size={18} className="sm:w-5 sm:h-5" />
          Create Your First Team
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
            title: "Collaborate",
            description: "Work together with your team members in real-time"
          },
          {
            title: "Organize",
            description: "Keep your projects and bugs organized in one place"
          },
          {
            title: "Track",
            description: "Monitor progress and resolve issues efficiently"
          }
        ].map((tip, index) => (
          <div 
            key={index}
            className="p-4 sm:p-6 rounded-xl 
              bg-gradient-to-br from-[#2C2C2C]/60 to-[#2C2C2C]/80
              border border-zinc-700/50 backdrop-blur-sm
              hover:border-zinc-600/50 hover:from-[#2C2C2C]/70 hover:to-[#2C2C2C]/90
              transition-all duration-300 ease-out
              hover:transform hover:scale-105 hover:shadow-lg hover:shadow-zinc-900/30"
          >
            <h3 className="text-white font-semibold mb-2 sm:mb-3 text-base sm:text-lg">{tip.title}</h3>
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed">{tip.description}</p>
          </div>
        ))}
      </motion.div>

      {/* Create Team Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-zinc-900 p-6 rounded-2xl w-96 shadow-xl border border-zinc-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Plus size={20} /> Create Team
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Team Name
            </label>
            <input
              type="text"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className="w-full mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team name"
            />
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={newTeamDescription}
              onChange={(e) => setNewTeamDescription(e.target.value)}
              className="w-full h-24 mb-4 px-3 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-700 focus:ring-2 focus:ring-blue-500"
              placeholder="Enter team description (optional)"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-zinc-700 text-gray-300 rounded-lg hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </motion.div>
  );
};

export default NoTeamState;