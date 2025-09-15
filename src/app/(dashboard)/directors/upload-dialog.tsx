"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { z } from "zod";

import { FileUploadArea } from "@/components/file-upload-area";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// 1️⃣ Schema de validación
const FilesSchema = z.object({
  watched: z.instanceof(File, { message: "Falta watched.csv" }),
  ratings: z.instanceof(File, { message: "Falta ratings.csv" }),
});

export function UploadDialog() {
  const [watchedFile, setWatchedFile] = useState<File | null>(null);
  const [ratingsFile, setRatingsFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.name.includes("watched")) setWatchedFile(file);
      if (file.name.includes("ratings")) setRatingsFile(file);
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setWatchedFile(null);
      setRatingsFile(null);
    }
  };

  const onSubmit = () => {
    const result = FilesSchema.safeParse({
      watched: watchedFile,
      ratings: ratingsFile,
    });

    if (!result.success) {
      const zodError = JSON.parse(result.error.message);
      setError(zodError[0].message);
      return;
    }

    console.log("Procesando:", watchedFile, ratingsFile);
    setError(null);
    // TODO: subir archivos a Supabase o API
  };

  return (
    <Dialog onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Importar
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Importar datos de Letterboxd</DialogTitle>
          <DialogDescription>
            Sube los archivos para detectar tus directores favoritos.
          </DialogDescription>
        </DialogHeader>

        <FileUploadArea
          onFilesSelected={handleFilesSelected}
          accept=".csv"
          multiple
          maxSize={10}
          allowedTypes={["csv"]}
        />

        {/* File status indicators */}
        <div className="space-y-1">
          {watchedFile && (
            <p className="text-xs text-green-500">✅ {watchedFile.name}</p>
          )}
          {ratingsFile && (
            <p className="text-xs text-green-500">✅ {ratingsFile.name}</p>
          )}
        </div>

        {/* Instrucciones */}
        <div className="space-y-1 text-sm text-muted-foreground mt-3">
          <p>
            1. Descarga tus datos desde{" "}
            <a
              href="https://letterboxd.com/settings/data"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              letterboxd.com/settings/data
            </a>
            .
          </p>
          <p>
            2. Sube los archivos:{" "}
            <code className="text-[#94f27f]">watched.csv</code> y{" "}
            <code className="text-[#94f27f]">ratings.csv</code>.
          </p>
          <p>3. Procesa y revisa la lista de directores.</p>
        </div>

        {error && (
          <p className="text-sm text-red-500 text-center mt-2">{error}</p>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={onSubmit}>Procesar archivos</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
