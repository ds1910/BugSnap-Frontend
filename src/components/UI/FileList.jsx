import React, { useState } from "react";
import { 
  File, 
  FileText, 
  FileImage, 
  FileArchive, 
  Download, 
  Trash2, 
  Eye,
  ExternalLink,
  Calendar
} from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const FileList = ({ files = [], onFileDeleted, className = "" }) => {
  const [deletingFile, setDeletingFile] = useState(null);

  // Get appropriate icon for file type
  const getFileIcon = (mimetype) => {
    if (mimetype.startsWith('image/')) return FileImage;
    if (mimetype === 'application/pdf') return FileText;
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return FileArchive;
    if (mimetype.includes('word') || mimetype.includes('excel') || mimetype === 'text/plain') return FileText;
    return File;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format upload date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Handle file download/view
  const handleView = async (file) => {
    try {
      // For now, we'll implement a basic download
      // In a full implementation, you'd call the backend view endpoint
      window.open(`${backendUrl}/file/view/${file.fileId}`, '_blank');
    } catch (error) {
      console.error('Error viewing file:', error);
    }
  };

  // Handle file deletion
  const handleDelete = async (file) => {
    if (!confirm(`Are you sure you want to delete "${file.originalName}"?`)) {
      return;
    }

    try {
      setDeletingFile(file.id);
      
      // Note: You'd need to implement a delete endpoint in the backend
      // await axios.delete(`${backendUrl}/file/${file.id}`, { withCredentials: true });
      
      onFileDeleted && onFileDeleted(file.id);
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setDeletingFile(null);
    }
  };

  if (!files || files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <File size={48} className="mx-auto text-gray-600 mb-3" />
        <p className="text-gray-400">No files attached</p>
        <p className="text-sm text-gray-600 mt-1">Upload files to get started</p>
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file) => {
        const IconComponent = getFileIcon(file.mimetype);
        const isDeleting = deletingFile === file.id;
        
        return (
          <div
            key={file.id || file._id}
            className={`
              flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-700
              hover:bg-gray-800/70 transition-colors duration-200
              ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            {/* File Info */}
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <IconComponent size={20} className="text-blue-400" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {file.originalName}
                </p>
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    <Calendar size={12} />
                    <span>{formatDate(file.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleView(file)}
                className="p-1.5 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-colors"
                title="View file"
              >
                <Eye size={16} />
              </button>
              
              <button
                onClick={() => handleView(file)}
                className="p-1.5 text-gray-400 hover:text-green-400 hover:bg-green-500/10 rounded transition-colors"
                title="Download file"
              >
                <Download size={16} />
              </button>
              
              <button
                onClick={() => handleDelete(file)}
                disabled={isDeleting}
                className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors disabled:opacity-50"
                title="Delete file"
              >
                {isDeleting ? (
                  <div className="animate-spin w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FileList;