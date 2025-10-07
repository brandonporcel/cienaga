export function validateEnvironmentVariables(): {
  baseUrl: string;
  secretKey: string;
} {
  const baseUrl = process.env.APP_URL || "http://localhost:3000";
  const secretKey = process.env.CRON_SECRET_KEY;

  if (!baseUrl || !secretKey) {
    throw new Error(
      "Missing required environment variables: APP_URL, CRON_SECRET_KEY",
    );
  }

  return { baseUrl, secretKey };
}

export function cleanDirectorName(director: string | null): string | null {
  if (!director) return null;

  const cleaned = director.trim().replace(/\s+/g, " ");

  // Validar longitud
  if (cleaned.length < 2 || cleaned.length > 100) {
    return null;
  }

  // Filtrar nombres obviamente inválidos
  if (cleaned.match(/^[^a-zA-Z]+$/)) {
    return null;
  }

  return cleaned;
}

export function parseYear(yearString: string | undefined): number | null {
  if (!yearString) return null;

  const year = parseInt(yearString);

  // Validar que sea un año razonable para películas
  if (isNaN(year) || year < 1888 || year > new Date().getFullYear() + 5) {
    return null;
  }

  return year;
}
