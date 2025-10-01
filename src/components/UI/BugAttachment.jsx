import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileIcon,
  FileArchive,
  FileType,
  FileText,
  FileImage,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  Trash2,
  AlertTriangle,
  Eye,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper: format file size
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024,
    sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Helper: download file properly
const downloadFile = async (url, filename) => {
  try {
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include' // Use cookies for authentication
    });
    
    if (!response.ok) {
      throw new Error('Download failed');
    }
    
    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Download error:', error);
    // Fallback to simple download
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

const AttachmentSection = ({
  allAttachments = [],
  updateBug,
  handleFileUpload,
  imageAttachments = [],
  previewImageIndex,
  setPreviewImageIndex,
  imageIndexMap = new Map(),
}) => {
  const audioRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({}); // track per file upload %
  const [galleryMode, setGalleryMode] = useState(false); // New state for gallery mode
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation modal
  const [fileToDelete, setFileToDelete] = useState(null); // File being deleted
  const [deletingFileId, setDeletingFileId] = useState(null); // Track deletion in progress
  const [quickPreview, setQuickPreview] = useState(null); // Quick preview on hover

  // Simulated upload progress (replace with real API)
  const simulateUpload = (file) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 15;
      setUploadProgress((prev) => ({ ...prev, [file.name]: Math.min(progress, 100) }));
      if (progress >= 100) clearInterval(interval);
    }, 300);
  };

  // Handle reorder
  const handleDragEnd = (result) => {
    if (!result.destination || !allAttachments || allAttachments.length === 0) return;
    const reordered = Array.from(allAttachments);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    updateBug({ attachments: reordered });
  };

  // Handle file download
  const handleDownload = (file) => {
    downloadFile(file.url, file.name);
  };

  // Handle delete confirmation
  const handleDeleteClick = (file) => {
    setFileToDelete(file);
    setShowDeleteConfirm(true);
  };

  // Handle actual deletion
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    try {
      setDeletingFileId(fileToDelete.id);
      setShowDeleteConfirm(false);

      // Call backend API to delete the file
      const response = await axios.delete(
        `${backendUrl}/media/attachment/${fileToDelete.id}`,
        {
          withCredentials: true // Use cookies for authentication
        }
      );

      if (response.status === 200) {
        // Remove file from local state
        if (allAttachments && allAttachments.length > 0) {
          const newAttachments = allAttachments.filter(
            (_, index) => index !== allAttachments.findIndex(f => f.id === fileToDelete.id)
          );
          updateBug({ attachments: newAttachments });
        }
        
        // If it was an image being previewed, close the preview
        if (previewImageIndex !== null && imageAttachments && imageAttachments.length > 0) {
          const deletedImageIndex = imageAttachments.findIndex(img => img.id === fileToDelete.id);
          if (deletedImageIndex === previewImageIndex) {
            setPreviewImageIndex(null);
          } else if (deletedImageIndex < previewImageIndex) {
            setPreviewImageIndex(previewImageIndex - 1);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    } finally {
      setDeletingFileId(null);
      setFileToDelete(null);
    }
  };

  // Handle cancel deletion
  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setFileToDelete(null);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (previewImageIndex === null || !imageAttachments || imageAttachments.length === 0) return;
    
    if (e.key === 'ArrowLeft' && imageAttachments.length > 1) {
      e.preventDefault();
      setPreviewImageIndex(
        (previewImageIndex - 1 + imageAttachments.length) % imageAttachments.length
      );
    } else if (e.key === 'ArrowRight' && imageAttachments.length > 1) {
      e.preventDefault();
      setPreviewImageIndex((previewImageIndex + 1) % imageAttachments.length);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setPreviewImageIndex(null);
    }
  };

  // Effect for keyboard navigation
  React.useEffect(() => {
    if (previewImageIndex !== null && imageAttachments && imageAttachments.length > 0) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [previewImageIndex, imageAttachments?.length]);

  return (
    <motion.div layout>
      {/* ===================================== */}
      {/* 🔹 File Upload */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-4">
            <p className="text-gray-400 text-sm font-semibold">Attachments</p>
            {allAttachments && allAttachments.length > 0 && (
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>{allAttachments.length} files</span>
                {imageAttachments && imageAttachments.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Eye size={12} />
                    {imageAttachments.length} images
                  </span>
                )}
              </div>
            )}
          </div>
          {imageAttachments && imageAttachments.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setGalleryMode(!galleryMode)}
                className="text-indigo-400 hover:text-indigo-300 text-sm flex items-center gap-1 transition"
              >
                <ZoomIn size={14} />
                {galleryMode ? 'Grid View' : 'Gallery View'}
              </button>
            </div>
          )}
        </div>
        
        {/* Quick actions panel for attachments */}
        {allAttachments && allAttachments.length > 0 && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-300">Quick Actions:</span>
                <button
                  onClick={() => {
                    allAttachments.forEach(file => {
                      if (file.type?.startsWith('image/')) {
                        handleDownload(file);
                      }
                    });
                  }}
                  className="flex items-center gap-1 text-green-400 hover:text-green-300 transition"
                  disabled={!imageAttachments || imageAttachments.length === 0}
                >
                  <Download size={12} />
                  Download All Images
                </button>
                <button
                  onClick={() => {
                    allAttachments.forEach(file => handleDownload(file));
                  }}
                  className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition"
                >
                  <Download size={12} />
                  Download All
                </button>
              </div>
              <div className="text-gray-500 text-xs">
                Hover over files for quick preview • Click for full view
              </div>
            </div>
          </div>
        )}
        
        <div
          onDrop={(e) => {
            e.preventDefault();
            handleFileUpload(e.dataTransfer.files);
            Array.from(e.dataTransfer.files).forEach(simulateUpload);
          }}
          onDragOver={(e) => e.preventDefault()}
          className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-600 rounded-xl text-gray-400 hover:border-indigo-500 hover:text-indigo-400 transition cursor-pointer"
        >
          <UploadCloud className="w-6 h-6 mb-2" />
          <p className="text-sm">Drag & drop files here, or click to upload</p>

          <input
            type="file"
            multiple
            className="hidden"
            id="fileUploadInput"
            onChange={(e) => {
              handleFileUpload(e.target.files);
              Array.from(e.target.files).forEach(simulateUpload);
            }}
          />

          <label
            htmlFor="fileUploadInput"
            className="mt-2 px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg cursor-pointer hover:bg-indigo-700 transition"
          >
            Browse Files
          </label>
        </div>
      </div>

      {/* 🔹 Gallery Mode Toggle for Images Only */}
      {galleryMode && imageAttachments && imageAttachments.length > 0 && (
        <div className="mt-4 p-4 bg-gray-800 rounded-xl">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-white font-semibold">Image Gallery ({imageAttachments.length})</h3>
            <button
              onClick={() => setGalleryMode(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {imageAttachments.map((image, idx) => (
              <div key={image.id || idx} className="relative group bg-gray-900 rounded-lg overflow-hidden">
                <img
                  src={image.url}
                  alt={image.name}
                  onClick={() => setPreviewImageIndex(idx)}
                  className="w-full h-32 object-cover cursor-pointer hover:scale-110 transition-all duration-300 shadow-lg"
                  title={image.name}
                />
                
                {/* Overlay with buttons */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
                  {/* Preview button */}
                  <button
                    onClick={() => setPreviewImageIndex(idx)}
                    className="absolute top-2 left-2 bg-indigo-600/90 text-white rounded-full p-2 hover:bg-indigo-700 transition-all shadow-lg"
                    title="Preview image"
                  >
                    <Eye size={16} />
                  </button>
                  
                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(image);
                    }}
                    className="absolute top-2 right-2 bg-green-600/90 text-white rounded-full p-2 hover:bg-green-700 transition-all shadow-lg"
                    title="Download image"
                  >
                    <Download size={16} />
                  </button>
                  
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(image);
                    }}
                    className="absolute bottom-2 right-2 bg-red-600/90 text-white rounded-full p-2 hover:bg-red-700 transition-all shadow-lg"
                    title="Delete image"
                    disabled={deletingFileId === image.id}
                  >
                    {deletingFileId === image.id ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                  
                  {/* Image info overlay */}
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-xs max-w-[80%]">
                    <p className="truncate font-medium">{image.name}</p>
                    {image.size && (
                      <p className="text-gray-300 text-[10px]">{formatBytes(image.size)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 🔹 File Previews */}
      {allAttachments && allAttachments.length > 0 && !galleryMode && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="attachments" direction="horizontal">
            {(provided) => (
              <div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4"
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {allAttachments.map((file, idx) => {
                  const isImage = file.type?.startsWith("image/");
                  const ext = (file.name?.split(".").pop() || "").toLowerCase();
                  const fileSize = file.size ? formatBytes(file.size) : "";

                  let icon = <FileIcon className="w-10 h-10" />;
                  let colorClass = "bg-gray-700 text-gray-200";

                  if (ext === "pdf") {
                    icon = <FileArchive className="w-10 h-10" />;
                    colorClass = "bg-red-600 text-white";
                  } else if (["doc", "docx"].includes(ext)) {
                    icon = <FileText className="w-10 h-10" />;
                    colorClass = "bg-blue-600 text-white";
                  } else if (["txt", "md"].includes(ext)) {
                    icon = <FileType className="w-10 h-10" />;
                    colorClass = "bg-gray-600 text-white";
                  }

                  return (
                    <Draggable key={file.id || idx} draggableId={file.id?.toString() || idx.toString()} index={idx}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="relative group"
                        >
                          {isImage ? (
                            <div className="relative group">
                              <img
                                src={file.url}
                                alt={file.name}
                                className="w-full h-28 object-cover rounded-xl cursor-pointer hover:scale-105 transition-all shadow"
                                title={file.name}
                              />
                              
                              {/* Image overlay with action buttons */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all rounded-xl flex items-center justify-center">
                                {/* Preview button */}
                                <button
                                  onClick={() => {
                                    const imgIndex = imageIndexMap.get(idx);
                                    if (imgIndex !== undefined) setPreviewImageIndex(imgIndex);
                                  }}
                                  className="bg-indigo-600/90 text-white rounded-full p-3 mx-1 hover:bg-indigo-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg transform scale-75 group-hover:scale-100"
                                  title="Preview image"
                                >
                                  <Eye size={18} />
                                </button>
                                
                                {/* Download button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                  }}
                                  className="bg-green-600/90 text-white rounded-full p-3 mx-1 hover:bg-green-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg transform scale-75 group-hover:scale-100"
                                  title="Download image"
                                >
                                  <Download size={18} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="relative group">
                              <div
                                className={`flex flex-col items-center justify-center h-28 rounded-xl p-3 shadow cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all ${colorClass}`}
                                title={file.name}
                              >
                                {icon}
                                <p className="truncate text-xs mt-1 w-full text-center px-1">
                                  {file.name}
                                </p>
                                <span className="text-[10px] opacity-75">{fileSize}</span>
                              </div>
                              
                              {/* File action buttons overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all rounded-xl flex items-center justify-center">
                                {/* Preview/Open button */}
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="bg-indigo-600/90 text-white rounded-full p-2 mx-1 hover:bg-indigo-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                  title="Open file"
                                >
                                  <ExternalLink size={14} />
                                </button>
                                
                                {/* Download button */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownload(file);
                                  }}
                                  className="bg-green-600/90 text-white rounded-full p-2 mx-1 hover:bg-green-700 transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                                  title="Download file"
                                >
                                  <Download size={14} />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Upload Progress */}
                          {uploadProgress[file.name] !== undefined &&
                            uploadProgress[file.name] < 100 && (
                              <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700 rounded-b-lg overflow-hidden">
                                <div
                                  className="h-full bg-indigo-500 transition-all"
                                  style={{ width: `${uploadProgress[file.name]}%` }}
                                />
                              </div>
                            )}

                          {/* Remove Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(file);
                            }}
                            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1.5 text-xs hover:bg-red-700 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                            title="Delete"
                            disabled={deletingFileId === file.id}
                          >
                            {deletingFileId === file.id ? (
                              <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 size={12} />
                            )}
                          </button>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      {/* ===================================== */}

      {/* 🔹 Enhanced Image Preview Modal (images only) */}
      {previewImageIndex !== null && imageAttachments && imageAttachments.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 flex items-center justify-center z-[60]"
          onClick={() => setPreviewImageIndex(null)}
        >
          {/* Header with image info and controls */}
          <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/90 to-transparent p-6 z-10">
            <div className="flex justify-between items-center text-white">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-xl font-semibold">
                    {imageAttachments[previewImageIndex]?.name || "Image"}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-sm text-gray-300">
                      {previewImageIndex + 1} of {imageAttachments?.length || 0}
                    </span>
                    {imageAttachments[previewImageIndex]?.size && (
                      <span className="text-sm text-gray-400">
                        {formatBytes(imageAttachments[previewImageIndex].size)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Open in new tab */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentImage = imageAttachments?.[previewImageIndex];
                    if (currentImage) {
                      window.open(currentImage.url, '_blank');
                    }
                  }}
                  className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all shadow-lg"
                  title="Open in new tab"
                >
                  <ExternalLink size={20} />
                </button>
                
                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const currentImage = imageAttachments?.[previewImageIndex];
                    if (currentImage) {
                      handleDownload(currentImage);
                    }
                  }}
                  className="p-3 bg-green-600/80 rounded-full hover:bg-green-600 transition-all shadow-lg"
                  title="Download image"
                >
                  <Download size={20} />
                </button>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setPreviewImageIndex(null);
                  }}
                  className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-all shadow-lg"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* Navigation buttons */}
          {imageAttachments && imageAttachments.length > 1 && (
            <>
              <button
                className="absolute left-6 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (imageAttachments && imageAttachments.length > 0) {
                    setPreviewImageIndex(
                      (previewImageIndex - 1 + imageAttachments.length) %
                        imageAttachments.length
                    );
                  }
                }}
                aria-label="Previous image"
                title="Previous"
              >
                <ChevronLeft size={24} />
              </button>

              <button
                className="absolute right-6 text-white bg-black/50 rounded-full p-3 hover:bg-black/70 transition z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  if (imageAttachments && imageAttachments.length > 0) {
                    setPreviewImageIndex((previewImageIndex + 1) % imageAttachments.length);
                  }
                }}
                aria-label="Next image"
                title="Next"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          {/* Main image */}
          <div className="relative max-h-[85%] max-w-[90%] flex items-center justify-center">
            <img
              src={imageAttachments[previewImageIndex]?.url}
              alt={imageAttachments[previewImageIndex]?.name || "preview"}
              className="max-h-full max-w-full rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Bottom info bar with image thumbnails and actions */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6">
            {/* Action buttons */}
            <div className="flex justify-center gap-4 mb-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentImage = imageAttachments?.[previewImageIndex];
                  if (currentImage) {
                    window.open(currentImage.url, '_blank');
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600/80 text-white rounded-lg hover:bg-indigo-600 transition-all shadow-lg"
              >
                <ExternalLink size={16} />
                Open Original
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentImage = imageAttachments?.[previewImageIndex];
                  if (currentImage) {
                    handleDownload(currentImage);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-green-600/80 text-white rounded-lg hover:bg-green-600 transition-all shadow-lg"
              >
                <Download size={16} />
                Download
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const currentImage = imageAttachments?.[previewImageIndex];
                  if (currentImage) {
                    handleDeleteClick(currentImage);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-red-600/80 text-white rounded-lg hover:bg-red-600 transition-all shadow-lg"
                disabled={deletingFileId === imageAttachments?.[previewImageIndex]?.id}
              >
                {deletingFileId === imageAttachments?.[previewImageIndex]?.id ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete
              </button>
            </div>
            
            {/* Thumbnail navigation */}
            <div className="flex justify-center">
              <div className="flex gap-2 max-w-4xl overflow-x-auto pb-2">
                {imageAttachments.map((image, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewImageIndex(idx);
                    }}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 transition-all ${
                      idx === previewImageIndex 
                        ? 'border-white shadow-lg' 
                        : 'border-white/40 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.name}
                      className="w-full h-full object-cover rounded-md"
                    />
                  </button>
                ))}
              </div>
            </div>
            
            {/* Keyboard navigation hint */}
            {imageAttachments && imageAttachments.length > 1 && (
              <div className="text-center mt-3 text-white/60 text-sm">
                Use ← → arrow keys to navigate • ESC to close • Click thumbnails to jump
              </div>
            )}
          </div>
        </div>
      )}

      {/* 🔹 Delete Confirmation Modal */}
      {showDeleteConfirm && fileToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70]">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-600/20 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete File</h3>
                <p className="text-sm text-gray-400">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete this file?
              </p>
              <div className="bg-gray-700 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  {fileToDelete.type?.startsWith('image/') ? (
                    <FileImage className="w-4 h-4 text-blue-400" />
                  ) : (
                    <FileIcon className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-sm font-medium text-white truncate">
                    {fileToDelete.name}
                  </span>
                </div>
                {fileToDelete.size && (
                  <p className="text-xs text-gray-400 mt-1">
                    {formatBytes(fileToDelete.size)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={handleCancelDelete}
                className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:border-gray-500 transition"
                disabled={deletingFileId === fileToDelete.id}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition flex items-center gap-2"
                disabled={deletingFileId === fileToDelete.id}
              >
                {deletingFileId === fileToDelete.id ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default AttachmentSection;