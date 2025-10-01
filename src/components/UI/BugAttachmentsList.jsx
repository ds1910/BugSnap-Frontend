import React, { useState, useEffect } from "react";
import { Download, Eye, File, Image, FileText, Archive, X, AlertCircle, Trash2, Loader2 } from "lucide-react";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Add CSS animations
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from { 
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to { 
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
  
  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }
  
  .file-item-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

const BugAttachmentsList = ({ bugId, refreshTrigger, className = "" }) => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    if (bugId) {
      fetchAttachments();
    }
  }, [bugId, refreshTrigger]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${backendUrl}/media/bug/${bugId}/attachments`,
        {
          withCredentials: true // Use cookies for authentication
        }
      );

      setAttachments(response.data.attachments || []);
    } catch (err) {
      console.error("Error fetching attachments:", err);
      if (err.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        setError(err.response?.data?.message || "Failed to load attachments");
      }
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (mimetype) => {
    if (!mimetype) return <File className="w-5 h-5 text-gray-400" />;

    if (mimetype.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-400" />;
    }
    if (mimetype.includes('pdf')) {
      return <FileText className="w-5 h-5 text-red-400" />;
    }
    if (mimetype.includes('word') || mimetype.includes('document')) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimetype.includes('excel') || mimetype.includes('sheet')) {
      return <FileText className="w-5 h-5 text-green-600" />;
    }
    if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) {
      return <Archive className="w-5 h-5 text-yellow-500" />;
    }
    return <File className="w-5 h-5 text-gray-400" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handlePreview = (attachment) => {
    const fileUrl = attachment.signedUrl || attachment.url;
    if (attachment.mimetype?.startsWith('image/') && fileUrl) {
      setPreviewFile(attachment);
      setPreviewUrl(fileUrl);
    }
  };

  const handleDownload = async (attachment) => {
    const fileUrl = attachment.signedUrl || attachment.url;
    if (!fileUrl) {
      if (window.showToast) {
        window.showToast('File URL not available', 'warning');
      }
      return;
    }

    const attachmentId = attachment.id;
    setDownloadingIds(prev => new Set([...prev, attachmentId]));

    try {
      // Use fetch for better control over the download process
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }

      // Get the blob and create download URL
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Create and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = attachment.originalName || 'download';
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      window.URL.revokeObjectURL(downloadUrl);
      
      // Show success message briefly
      setTimeout(() => {
        // Could add a toast notification here
      }, 1000);
      
    } catch (error) {
      console.error('Download failed:', error);
      if (window.showToast) {
        window.showToast(
          `Failed to download "${attachment.originalName}": ${error.message}`, 
          'error'
        );
      }
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
    }
  };

  const handleDeleteClick = (attachment) => {
    setDeleteConfirm(attachment);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    const attachmentId = deleteConfirm.id;
    setDeletingIds(prev => new Set([...prev, attachmentId]));
    
    try {
      const response = await axios.delete(
        `${backendUrl}/media/attachment/${attachmentId}`,
        {
          withCredentials: true // Use cookies for authentication
        }
      );
      
      if (response.status === 200) {
        // Remove from local state
        setAttachments(prev => prev.filter(att => att.id !== attachmentId));
        
        // Close preview if this file was being previewed
        if (previewFile && previewFile.id === attachmentId) {
          closePreview();
        }
        
        // Show success message
        if (window.showToast) {
          window.showToast(`"${deleteConfirm.originalName}" deleted successfully`, 'success');
        }
      }
    } catch (error) {
      console.error('Delete failed:', error);
      if (window.showToast) {
        window.showToast(
          `Failed to delete "${deleteConfirm.originalName}": ${error.response?.data?.message || error.message}`, 
          'error'
        );
      }
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(attachmentId);
        return newSet;
      });
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const closePreview = () => {
    setPreviewUrl(null);
    setPreviewFile(null);
  };

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-400">Loading attachments...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="p-4 bg-red-900/20 border border-red-600 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={fetchAttachments}
            className="ml-auto px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!attachments || attachments.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center p-6 text-gray-500">
          <File className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No attachments found for this bug</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="space-y-3">
        {attachments.map((attachment, index) => (
          <div
            key={attachment.id}
            className="file-item-hover bg-gray-800/50 border border-gray-700 rounded-lg p-4 hover:bg-gray-800/70 transition-all duration-300 animate-slideIn"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                {getFileIcon(attachment.mimetype)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate">
                    {attachment.originalName}
                  </p>
                  <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                    <span>{formatFileSize(attachment.size)}</span>
                    <span>Uploaded by {attachment.uploadedBy}</span>
                    <span>{formatDate(attachment.uploadedAt)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {attachment.mimetype?.startsWith('image/') && (attachment.signedUrl || attachment.url) && (
                  <button
                    onClick={() => handlePreview(attachment)}
                    className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-all duration-200 hover:scale-110"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                
                {(attachment.signedUrl || attachment.url) && (
                  <button
                    onClick={() => handleDownload(attachment)}
                    disabled={downloadingIds.has(attachment.id)}
                    className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    title="Download"
                  >
                    {downloadingIds.has(attachment.id) ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </button>
                )}
                
                <button
                  onClick={() => handleDeleteClick(attachment)}
                  disabled={deletingIds.has(attachment.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-all duration-200 hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  title="Delete"
                >
                  {deletingIds.has(attachment.id) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Image Preview Modal (AttachmentSection style) */}
      {previewUrl && previewFile && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50"
          onClick={closePreview}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={(e) => {
              e.stopPropagation();
              closePreview();
            }}
            aria-label="Close preview"
            title="Close"
          >
            <X size={28} />
          </button>

          <img
            src={previewUrl}
            alt={previewFile.originalName || "preview"}
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Enhanced Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl transform animate-slideUp border border-gray-700">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-red-900/50 rounded-full flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Delete File</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">Are you sure you want to delete this file?</p>
              <div className="p-4 bg-gray-700/50 rounded-lg border border-gray-600">
                <div className="flex items-center gap-3">
                  <div className="text-gray-400 flex-shrink-0">
                    {deleteConfirm.mimetype?.startsWith('image/') ? (
                      <Image className="w-6 h-6" />
                    ) : (
                      <File className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{deleteConfirm.originalName}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                      <span>{formatFileSize(deleteConfirm.size)}</span>
                      <span>•</span>
                      <span>Uploaded {formatDate(deleteConfirm.uploadedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleDeleteCancel}
                className="px-6 py-2.5 text-gray-300 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletingIds.has(deleteConfirm.id)}
                className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {deletingIds.has(deleteConfirm.id) ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete File
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BugAttachmentsList;