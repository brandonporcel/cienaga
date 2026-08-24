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

/**
 * Genera un slug legible a partir del título y año de una película.
 * Ej: "Never Look Away" + 2018 → "never-look-away-2018"
 */
export function movieSlug(title: string, year?: number): string {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return year ? `${base}-${year}` : base;
}
