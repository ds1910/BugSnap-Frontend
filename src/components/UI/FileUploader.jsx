import React, { useState, useCallback } from "react";
import { UploadCloud, X, CheckCircle, AlertCircle } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const FileUploader = ({ bugId, onFileUploaded, className = "" }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [error, setError] = useState("");

  const uploadFile = useCallback(async (file) => {
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      if (window.showToast) {
        window.showToast(`File "${file.name}" is too large. Maximum size is 5MB.`, 'error');
      }
      return;
    }

    // Validate file type
    const allowedTypes = [
      // Images
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp',
      // Documents
      'application/pdf', 'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain', 'text/csv',
      // Archives
      'application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      setError('File type not supported. Please upload images, documents (PDF, Word, Excel), text files, or archives.');
      if (window.showToast) {
        window.showToast(`File type "${file.type}" is not supported.`, 'error');
      }
      return;
    }
    
    const fileId = Date.now() + Math.random();
    setUploadProgress(prev => ({ ...prev, [fileId]: 0 }));
    setError(''); // Clear any previous errors
    
    try {
      const formData = new FormData();
      formData.append('attachment', file);
      formData.append('bugId', bugId);

      const response = await axios.post(
        `${backendUrl}/media/bug/upload`,
        formData,
        {
          withCredentials: true, // Use cookies for authentication
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(prev => ({ ...prev, [fileId]: percentCompleted }));
          }
        }
      );

      if (response.status === 200) {
        // Upload successful
        setUploadProgress(prev => ({ ...prev, [fileId]: 100 }));
        
        // Call parent callback with uploaded file info
        if (onFileUploaded) {
          onFileUploaded(response.data.file);
        }
        
        // Show success toast
        if (window.showToast) {
          window.showToast(`"${file.name}" uploaded successfully`, 'success');
        }
        
        // Clean up progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[fileId];
            return newProgress;
          });
        }, 2000);
        
        return response.data.file;
      }
    } catch (error) {
      console.error('Upload failed:', error);
      const errorMessage = error.response?.data?.message || 'Upload failed';
      setError(errorMessage);
      
      // Show error toast
      if (window.showToast) {
        window.showToast(`Failed to upload "${file.name}": ${errorMessage}`, 'error');
      }
      
      // Clean up failed upload progress
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileId];
        return newProgress;
      });
      
      throw error;
    }
  }, [bugId, onFileUploaded]);

  const handleFileSelect = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    
    setUploading(true);
    setError("");
    
    try {
      const files = Array.from(fileList);
      
      // Upload files one by one to avoid overwhelming the server
      for (const file of files) {
        await uploadFile(file);
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const progressEntries = Object.entries(uploadProgress);
  const hasUploading = progressEntries.length > 0;

  return (
    <div className={className}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition cursor-pointer"
      >
        <UploadCloud className="w-6 h-6 mb-2" />
        <p className="text-sm">
          {uploading ? "Uploading files..." : "Drag & drop files here, or click to upload"}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Supports: Images, PDF, Word, Excel, Text files, Archives (max 5MB each)
        </p>

        <input
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar,.7z,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv,application/zip"
          className="hidden"
          id="fileUploadInput"
          onChange={(e) => handleFileSelect(e.target.files)}
          disabled={uploading}
        />

        <label
          htmlFor="fileUploadInput"
          className={`mt-2 px-3 py-1 ${
            uploading 
              ? "bg-gray-600 cursor-not-allowed" 
              : "bg-indigo-600 hover:bg-indigo-700 cursor-pointer"
          } text-white text-xs rounded-lg transition`}
        >
          {uploading ? "Uploading..." : "Browse Files"}
        </label>
      </div>

      {/* Progress Indicators */}
      {hasUploading && (
        <div className="mt-4 space-y-2">
          {progressEntries.map(([fileId, progress]) => (
            <div key={fileId} className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-gray-300">Uploading file...</span>
                <span className="text-gray-400">{progress}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progress === 100 
                      ? "bg-green-500" 
                      : "bg-indigo-500"
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {progress === 100 && (
                <div className="flex items-center gap-1 mt-2 text-green-400 text-xs">
                  <CheckCircle size={12} />
                  Upload complete
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mt-4 p-3 bg-red-900/50 border border-red-600 rounded-lg flex items-center gap-2 text-red-400">
          <AlertCircle size={16} />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileUploader;