import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Crear en utils o en el mismo archivo
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres Unicode
    .replace(/[\u0300-\u036f]/g, "") // Remover acentos
    .replace(/[.,\-_:;()]/g, "") // Remover puntuación
    .replace(/\s+/g, " ") // Normalizar espacios
    .trim();
}
