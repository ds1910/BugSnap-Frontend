import React, { useState, useRef } from "react";
import { Upload, X, File, AlertCircle, Check } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const FileUpload = ({ bugId, onFileUploaded, className = "" }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  // File type validation
  const allowedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
    'application/zip',
    'application/x-rar-compressed',
    'application/x-7z-compressed'
  ];

  const maxFileSize = 5 * 1024 * 1024; // 5MB

  const validateFile = (file) => {
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed. Please upload images, documents, or archives.`);
    }
    if (file.size > maxFileSize) {
      throw new Error(`File size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
    }
  };

  const uploadFile = async (file) => {
    try {
      validateFile(file);
      setError("");
      setSuccess("");
      setUploading(true);
      setUploadProgress(0);

      const activeTeamString = localStorage.getItem("activeTeam");
      if (!activeTeamString) {
        throw new Error("No active team found");
      }
      const activeTeam = JSON.parse(activeTeamString);

      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post(
        `${backendUrl}/bug/manage/${bugId}/upload?teamId=${activeTeam._id}`,
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
          },
        }
      );

      setSuccess(`${file.name} uploaded successfully!`);
      onFileUploaded && onFileUploaded(response.data.file);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.error || err.message || "Failed to upload file");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      uploadFile(files[0]); // Upload first file only
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      uploadFile(files[0]);
    }
    // Clear the input so the same file can be selected again
    e.target.value = "";
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer
          ${isDragging 
            ? "border-blue-400 bg-blue-50/50" 
            : "border-gray-600 hover:border-gray-500"
          }
          ${uploading ? "pointer-events-none" : ""}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          className="hidden"
          accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z"
        />

        <div className="flex flex-col items-center justify-center space-y-3">
          {uploading ? (
            <>
              <div className="animate-spin text-blue-500">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-300">Uploading...</p>
                <div className="w-48 bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-1">{uploadProgress}%</p>
              </div>
            </>
          ) : (
            <>
              <Upload size={32} className="text-gray-400" />
              <div className="text-center">
                <p className="text-sm text-gray-300">
                  <span className="font-medium">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Images, PDFs, Documents, Archives (max 5MB)
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg flex items-start space-x-2">
          <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300">{error}</p>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mt-3 p-3 bg-green-900/20 border border-green-500/30 rounded-lg flex items-start space-x-2">
          <Check size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-green-300">{success}</p>
          <button
            onClick={() => setSuccess("")}
            className="ml-auto text-green-400 hover:text-green-300"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;