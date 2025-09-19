export const MESSAGES = {
  errors: {
    noSession: "No hay sesión activa",
    saveMovies: "Error al guardar los datos de Letterboxd",
    updateUser: "Error al actualizar el usuario",
    gettingDirectors: "Error al obtener los directores",
  },
  success: {
    moviesImported: "Películas importadas con éxito.",
  },
} as const;

export type MessageKey =
  | keyof typeof MESSAGES.errors
  | keyof typeof MESSAGES.success;
