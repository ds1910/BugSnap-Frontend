// commentApi.js
import axios from "axios";
const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

/**
 * Get active team id from localStorage.
 * Returns a string id or null.
 */
const getTeamId = () => {
  try {
    const teamStr = localStorage.getItem("activeTeam");
    if (!teamStr) return null;
    const team = JSON.parse(teamStr);
    if (!team) return null;
    if (typeof team === "string") return team;
    return team._id || team.id || null;
  } catch (err) {
    console.warn("getTeamId parse error:", err);
    return null;
  }
};

const commentApi = {
  // =============================
  // Get all comments for a bug
  // =============================
  getCommentsForBug: async ({ bugId }) => {
    try {
      const response = await axios.get(`${backendUrl}/comment/all`, {
        params: { bugId },
        withCredentials: true, // Use cookies for authentication
      });
      return response?.data?.comments ?? [];
    } catch (err) {
      console.error("commentApi.getCommentsForBug error:", err);
      throw err;
    }
  },

  // =============================
  // Create a new comment
  // =============================
  createComment: async ({ text, bugId, teamId = null }) => {
    try {
      const tId = teamId ?? getTeamId();
      const response = await axios.post(
        `${backendUrl}/comment/create`,
        { text, bugId, teamId: tId },
        { withCredentials: true }
      );
      return response?.data?.comment ?? response?.data ?? null;
    } catch (err) {
      console.error("commentApi.createComment error:", err);
      throw err;
    }
  },

  // =============================
  // Update a comment
  // =============================
  updateComment: async ({ commentId, text, teamId = null }) => {
    try {
      const tId = teamId ?? getTeamId();
      const res = await axios.patch(
        `${backendUrl}/comment/manage/${commentId}`,
        { text, teamId: tId },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      console.error("commentApi.updateComment error:", err);
      throw err;
    }
  },

  // =============================
  // Delete a comment
  // =============================
  deleteComment: async ({ commentId, teamId = null }) => {
    try {
      const tId = teamId ?? getTeamId();
      const res = await axios.delete(`${backendUrl}/comment/manage/${commentId}`, {
        data: { teamId: tId },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (error) {
      console.error("commentApi.deleteComment error:", error);
      throw error;
    }
  },

  // =============================
  // Create a reply
  // =============================
  createReply: async ({ parentId, text, bugId, teamId = null }) => {
    try {
      const tId = teamId ?? getTeamId();
      const response = await axios.post(
        `${backendUrl}/comment/reply`,
        { parentId, text, bugId, teamId: tId },
        { withCredentials: true }
      );
      return response?.data?.reply ?? response?.data ?? null;
    } catch (err) {
      console.error("commentApi.createReply error:", err);
      throw err;
    }
  },

  // =============================
  // Get replies for a comment
  // =============================
  getRepliesForComment: async ({ parentId, bugId }) => {
    try {
      console.log("Getting replies for:", { parentId, bugId });
      const response = await axios.get(`${backendUrl}/comment/reply`, {
        params: { parentId, bugId },
        withCredentials: true,
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Reply response data:", response?.data);
      const data = response?.data;
      
      // Backend returns both 'reply' and 'replies' properties with the same array
      const replies = data?.replies || data?.reply || [];
      return { success: true, replies };
    } catch (err) {
      console.error("commentApi.getRepliesForComment error:", err);
      throw err;
    }
  },

  // =============================
  // Update a reply
  // =============================
  updateReply: async ({ parentId, replyId, text, teamId = null }) => {
    if (!parentId || !replyId) {
      throw new Error("parentId and replyId are required");
    }
    if (typeof text !== "string" || text.trim().length === 0) {
      throw new Error("text must be a non-empty string");
    }

    try {
      const tId = teamId ?? getTeamId();
      const res = await axios.patch(
        `${backendUrl}/comment/reply`,
        { parentId, replyId, text, teamId: tId },
        { withCredentials: true }
      );
      return res.data;
    } catch (err) {
      console.error("commentApi.updateReply error:", err);
      throw err;
    }
  },

  // =============================
  // Delete a reply
  // =============================
  deleteReply: async ({ parentId, replyId, teamId = null }) => {
    try {
      const tId = teamId ?? getTeamId();
      const res = await axios.delete(`${backendUrl}/comment/reply`, {
        data: { parentId, replyId, teamId: tId },
        withCredentials: true,
        headers: { "Content-Type": "application/json" },
      });
      return res.data;
    } catch (err) {
      console.error("commentApi.deleteReply error:", err);
      throw err;
    }
  },
};

export default commentApi;
