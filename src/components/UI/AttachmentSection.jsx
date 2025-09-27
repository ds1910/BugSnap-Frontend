import React, { useState, useRef } from "react";
import {
  UploadCloud,
  FileIcon,
  FileArchive,
  FileType,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
} from "lucide-react";
import { Description as DescriptionIcon } from "@mui/icons-material";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

// Helper: format file size
const formatBytes = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024,
    sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const AttachmentSection = ({
  allAttachments,
  updateBug,
  handleFileUpload,
  imageAttachments,
  previewImageIndex,
  setPreviewImageIndex,
  imageIndexMap,
}) => {
  const audioRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({}); // track per file upload %

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
    if (!result.destination) return;
    const reordered = Array.from(allAttachments);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    updateBug({ attachments: reordered });
  };

  return (
    <motion.div layout>
      {/* ===================================== */}
      {/* 🔹 File Upload */}
      <div className="mt-6">
        <p className="text-gray-400 text-sm font-semibold mb-2">Attachments</p>
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

      {/* 🔹 File Previews */}
      {allAttachments.length > 0 && (
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
                    icon = <DescriptionIcon className="w-10 h-10" />;
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
                            <img
                              src={file.url}
                              alt={file.name}
                              onClick={() => {
                                const imgIndex = imageIndexMap.get(idx);
                                if (imgIndex !== undefined) setPreviewImageIndex(imgIndex);
                              }}
                              className="w-full h-28 object-cover rounded-xl cursor-pointer hover:scale-105 transition-all shadow"
                              title={file.name}
                            />
                          ) : (
                            <div
                              className={`flex flex-col items-center justify-center h-28 rounded-xl p-3 shadow cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all ${colorClass}`}
                              onClick={() => window.open(file.url, "_blank")}
                              title={file.name}
                            >
                              {icon}
                              <p className="truncate text-xs mt-1 w-full text-center px-1">
                                {file.name}
                              </p>
                              <span className="text-[10px] opacity-75">{fileSize}</span>
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

                          {/* Download Button */}
                          <a
                            href={file.url}
                            download={file.name}
                            className="absolute bottom-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-indigo-600 opacity-0 group-hover:opacity-100 transition"
                            title="Download"
                          >
                            <Download size={12} />
                          </a>

                          {/* Remove Button */}
                          <button
                            onClick={() => {
                              const newAttachments = allAttachments.filter((_, i) => i !== idx);
                              updateBug({ attachments: newAttachments });
                              if (isImage && previewImageIndex !== null) {
                                setPreviewImageIndex(null);
                              }
                            }}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                            title="Remove"
                          >
                            <X size={12} />
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

      {/* 🔹 Image Preview Modal (images only) */}
      {previewImageIndex !== null && imageAttachments.length > 0 && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-[60]"
          onClick={() => setPreviewImageIndex(null)}
        >
          <button
            className="absolute top-4 right-4 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex(null);
            }}
            aria-label="Close preview"
            title="Close"
          >
            <X size={28} />
          </button>

          <button
            className="absolute left-6 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex(
                (previewImageIndex - 1 + imageAttachments.length) %
                  imageAttachments.length
              );
            }}
            aria-label="Previous image"
            title="Previous"
          >
            <ChevronLeft size={40} />
          </button>

          <img
            src={imageAttachments[previewImageIndex]?.url}
            alt={imageAttachments[previewImageIndex]?.name || "preview"}
            className="max-h-[90%] max-w-[90%] rounded-lg shadow-lg"
            onClick={(e) => e.stopPropagation()}
          />

          <button
            className="absolute right-6 text-white"
            onClick={(e) => {
              e.stopPropagation();
              setPreviewImageIndex((previewImageIndex + 1) % imageAttachments.length);
            }}
            aria-label="Next image"
            title="Next"
          >
            <ChevronRight size={40} />
          </button>
        </div>
      )}

      {/* Warning Sound */}
     
    </motion.div>
  );
};

export default AttachmentSection;
