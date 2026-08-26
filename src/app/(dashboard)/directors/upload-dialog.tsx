"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import JSZip from "jszip";
import { Download, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { showCatchErrorToast } from "@/lib/errors/client";
import LetterboxdService from "@/lib/services/letterboxd";
import { FilesSchema, FilesSchemaType } from "@/lib/validations/files";
import UploadInstructions from "@/components/directors/upload-instructions";
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
import { saveMoviesAction } from "@/app/actions/movies";

type SubmitStep = "idle" | "parsing" | "saving" | "done";

export function UploadDialog() {
  const { handleSubmit, setValue, reset, formState, watch } =
    useForm<FilesSchemaType>({
      resolver: zodResolver(FilesSchema),
      defaultValues: { watched: undefined, ratings: undefined },
    });
  const watchedFile = watch("watched");
  const ratingsFile = watch("ratings");
  const [isOpen, setIsOpen] = useState(false);
  const [confirmAbort, setConfirmAbort] = useState(false);
  const [detectedCount, setDetectedCount] = useState<number | null>(null);
  const [submitStep, setSubmitStep] = useState<SubmitStep>("idle");
  const isSubmitting = formState.isSubmitting;

  const extractCsvsFromZip = async (
    zipFile: File,
  ): Promise<{ watched?: File; ratings?: File }> => {
    const zip = await JSZip.loadAsync(zipFile);
    const result: { watched?: File; ratings?: File } = {};

    for (const [path, entry] of Object.entries(zip.files)) {
      if (entry.dir) continue;
      const fileName = path.split("/").pop()?.toLowerCase() ?? "";
      if (fileName === "watched.csv" && !result.watched) {
        const blob = await entry.async("blob");
        result.watched = new File([blob], "watched.csv", {
          type: "text/csv",
        });
      }
      if (fileName === "ratings.csv" && !result.ratings) {
        const blob = await entry.async("blob");
        result.ratings = new File([blob], "ratings.csv", {
          type: "text/csv",
        });
      }
    }

    return result;
  };

  const handleFilesSelected = async (files: FileList) => {
    let watchedFile: File | undefined;
    let ratingsFile: File | undefined;

    for (const file of Array.from(files)) {
      if (file.name.endsWith(".zip")) {
        const extracted = await extractCsvsFromZip(file);
        if (extracted.watched) watchedFile = extracted.watched;
        if (extracted.ratings) ratingsFile = extracted.ratings;
      } else {
        if (file.name.includes("watched")) watchedFile = file;
        if (file.name.includes("ratings")) ratingsFile = file;
      }
    }

    if (watchedFile) setValue("watched", watchedFile);
    if (ratingsFile) setValue("ratings", ratingsFile);

    // Parsear CSVs inmediatamente para mostrar cantidad detectada
    try {
      const fileMap: FilesSchemaType = {
        watched: watchedFile,
        ratings: ratingsFile,
      };

      const movies = await LetterboxdService.getMovies(fileMap);
      setDetectedCount(movies.length);
    } catch {
      // Silenciar errores de parsing aquí — se mostrarán al submit
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      setConfirmAbort(true);
      return;
    }
    setIsOpen(open);
    if (!open) {
      reset();
      setDetectedCount(null);
      setSubmitStep("idle");
    }
  };

  const blockCloseWhileSubmitting = (event: Event) => {
    if (isSubmitting) {
      event.preventDefault();
      setConfirmAbort(true);
    }
  };

  const handleAbortImport = () => {
    setConfirmAbort(false);
    reset();
    setIsOpen(false);
    setDetectedCount(null);
    setSubmitStep("idle");
  };

  const onSubmit = async (values: FilesSchemaType) => {
    try {
      setSubmitStep("parsing");
      const movies = await LetterboxdService.getMovies(values);

      setSubmitStep("saving");
      await saveMoviesAction(movies);

      setSubmitStep("done");
      toast.success(
        `¡${movies.length} película${movies.length !== 1 ? "s" : ""} importada${movies.length !== 1 ? "s" : ""}! Los directores se detectan ahora y los perfiles se actualizan diariamente.`,
      );
      reset();
      setIsOpen(false);
      setDetectedCount(null);
      setSubmitStep("idle");
    } catch (error) {
      showCatchErrorToast(error);
    } finally {
      setSubmitStep("idle");
    }
  };

  const stepLabel =
    submitStep === "parsing"
      ? "Analizando archivos..."
      : submitStep === "saving"
        ? "Guardando películas..."
        : submitStep === "done"
          ? "¡Listo!"
          : "Procesar archivos";

  const hasFiles = !!(watchedFile || ratingsFile);
  const buttonDisabled = isSubmitting || !hasFiles;

  return (
    <div className="contents">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Actualizar Datos
          </Button>
        </DialogTrigger>

        <DialogContent
          className="sm:max-w-[500px]"
          onInteractOutside={blockCloseWhileSubmitting}
          onEscapeKeyDown={blockCloseWhileSubmitting}
        >
          <DialogHeader>
            <DialogTitle>Importar datos de Letterboxd</DialogTitle>
            <DialogDescription>
              Sube los archivos para detectar tus directores favoritos.
            </DialogDescription>
          </DialogHeader>

          <FileUploadArea
            onFilesSelected={handleFilesSelected}
            accept=".csv,.zip"
            multiple
            maxSize={50}
            allowedTypes={["csv", "zip"]}
          />

          <div className="space-y-1">
            {watchedFile && (
              <p className="text-xs text-green-500">✅ {watchedFile.name}</p>
            )}
            {ratingsFile && (
              <p className="text-xs text-green-500">✅ {ratingsFile.name}</p>
            )}
            {detectedCount !== null && (
              <p className="text-sm font-medium text-muted-foreground mt-2">
                Se detectaron{" "}
                <span className="text-foreground font-semibold">
                  {detectedCount}
                </span>{" "}
                película{detectedCount !== 1 ? "s" : ""}
              </p>
            )}
          </div>

          <UploadInstructions />

          {/* @ts-expect-error _global viene de Zod refine con path */}
          {formState.errors["_global"] && (
            <p className="text-sm text-red-500 m-0">
              {/* @ts-expect-error _global viene de Zod refine con path */}
              {formState.errors["_global"].message}
            </p>
          )}

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isSubmitting}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleSubmit(onSubmit)} disabled={buttonDisabled}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {stepLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Aviso de cierre mientras se procesa */}
      <Dialog open={confirmAbort} onOpenChange={setConfirmAbort}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>La importación continúa en segundo plano</DialogTitle>
            <DialogDescription>
              Los datos se están procesando en el servidor y terminan solos
              aunque cierres esta ventana. Podés esperar a que termine o salir —
              no se pierde nada.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Seguir esperando</Button>
            </DialogClose>
            <Button variant="destructive" onClick={handleAbortImport}>
              Salir de todas formas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
