import { z } from "zod";

export const FilesSchema = z
  .object({
    watched: z.instanceof(File).optional(),
    ratings: z.instanceof(File).optional(),
  })
  .refine((data) => data.watched || data.ratings, {
    path: ["_global"],
    message: "Necesitas subir al menos un archivo (watched.csv o ratings.csv)",
  });
export type FilesSchemaType = z.infer<typeof FilesSchema>;
