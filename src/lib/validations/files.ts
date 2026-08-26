import { z } from "zod";

export const FilesSchema = z
  .object({
    watched: z.instanceof(File).optional(),
    ratings: z.instanceof(File).optional(),
  })
  .refine((data) => data.watched || data.ratings, {
    path: ["_global"],
    message: "Necesitás subir al menos un archivo (watched.csv, ratings.csv o el .zip de Letterboxd)",
  });
export type FilesSchemaType = z.infer<typeof FilesSchema>;
