"use client";

import type React from "react";
import { useState } from "react";
import { Upload } from "lucide-react";

interface FileUploadAreaProps {
  onFilesSelected: (files: FileList) => void;
  accept?: string;
  multiple?: boolean;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
  maxSize?: number; // in MB
  allowedTypes?: string[];
}

export function FileUploadArea({
  onFilesSelected,
  accept = "*",
  multiple = false,
  className = "",
  disabled = false,
  placeholder = "Arrastra tus archivos aquí o haz click para seleccionarlos",
  maxSize,
  allowedTypes,
}: FileUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = (files: FileList): boolean => {
    if (maxSize) {
      for (const file of Array.from(files)) {
        if (file.size > maxSize * 1024 * 1024) {
          setError(
            `El archivo ${file.name} excede el tamaño máximo de ${maxSize}MB`,
          );
          return false;
        }
      }
    }

    if (allowedTypes) {
      for (const file of Array.from(files)) {
        const fileExtension = file.name.split(".").pop()?.toLowerCase();
        if (fileExtension && !allowedTypes.includes(fileExtension)) {
          setError(`Tipo de archivo no permitido: ${fileExtension}`);
          return false;
        }
      }
    }

    setError(null);
    return true;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || disabled) return;

    if (validateFiles(files)) {
      onFilesSelected(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;

    setIsDragOver(false);
    const files = e.dataTransfer.files;
    handleFiles(files);
  };

  const handleClick = () => {
    if (disabled) return;
    document.getElementById("file-upload-input")?.click();
    setError(null);
  };

  return (
    <div className="space-y-2">
      <div
        className={`border border-dashed rounded-lg p-6 text-center space-y-2 transition-colors ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
        } ${isDragOver && !disabled ? "bg-muted/50 border-primary" : "hover:bg-muted/30"} ${className}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <Upload
          className={`mx-auto h-6 w-6 ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}
        />
        <p
          className={`text-sm ${disabled ? "text-muted-foreground/50" : "text-muted-foreground"}`}
        >
          {placeholder}
        </p>
        <input
          id="file-upload-input"
          type="file"
          accept={accept}
          multiple={multiple}
          disabled={disabled}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>
      {error && <p className="text-sm text-red-500 text-center">{error}</p>}
    </div>
  );
}
