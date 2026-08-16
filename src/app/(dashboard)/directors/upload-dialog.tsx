"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Download } from "lucide-react";
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
  const isSubmitting = formState.isSubmitting;

  const handleFilesSelected = (files: FileList) => {
    Array.from(files).forEach((file) => {
      if (file.name.includes("watched")) setValue("watched", file);
      if (file.name.includes("ratings")) setValue("ratings", file);
    });
  };

  const handleOpenChange = (open: boolean) => {
    if (!open && isSubmitting) {
      // Si se intenta cerrar mientras se procesan los archivos, pedir confirmación
      setConfirmAbort(true);
      return;
    }
    setIsOpen(open);
    if (!open) reset();
  };

  // Click fuera, Escape o drag fuera durante la subida: no cerrar, preguntar
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
  };

  const onSubmit = async (values: FilesSchemaType) => {
    try {
      const movies = await LetterboxdService.getMovies(values);
      await saveMoviesAction(movies);
      toast.success(
        "Películas importadas. En unas horas verás tus directores favoritos.",
      );
      reset();
      setIsOpen(false);
    } catch (error) {
      showCatchErrorToast(error);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
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
            accept=".csv"
            multiple
            maxSize={10}
            allowedTypes={["csv"]}
          />

          <div className="space-y-1">
            {watchedFile && (
              <p className="text-xs text-green-500">✅ {watchedFile.name}</p>
            )}
            {ratingsFile && (
              <p className="text-xs text-green-500">✅ {ratingsFile.name}</p>
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
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Cargando..." : "Procesar archivos"}
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
              aunque cierres esta ventana. Podés esperar a que termine o salir
              — no se pierde nada.
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
    </>
  );
}
