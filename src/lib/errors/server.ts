"use server";

type SupabaseError = {
  message: string;
  code: string;
};

const errorMessages: Record<string, string> = {
  PGRST205: "Error interno al acceder a la base de datos.",
  23505: "Ese registro ya existe.",
};

function parseSupabaseErrorMessage(raw: string): SupabaseError | null {
  try {
    return JSON.parse(raw) as SupabaseError;
  } catch {
    return null;
  }
}

function isSupabaseError(err: unknown): err is SupabaseError {
  return (
    typeof err === "object" && err !== null && "message" in err && "code" in err
  );
}

export default async function handleServerError({
  error,
  message,
}: {
  error: unknown;
  message?: string;
}): Promise<never> {
  console.error(error);

  let userMessage = "Algo salió mal, intenta de nuevo más tarde.";

  if (typeof error === "string") {
    userMessage = error;
  } else if (error instanceof Error) {
    const parsed = parseSupabaseErrorMessage(error.message);
    if (parsed) {
      console.warn("Supabase error:", parsed.message);
      if (parsed.code in errorMessages) {
        userMessage = errorMessages[parsed.code];
      }
    } else {
      console.warn("Error no parseable:", error.message);
    }
  } else if (isSupabaseError(error)) {
    console.warn("Supabase error:", error.message);
    if (error.code in errorMessages) {
      userMessage = errorMessages[error.code];
    }
  } else {
    console.warn("Error no parseable:", error);
  }

  if (message) {
    userMessage = message;
  }

  throw new Error(userMessage);
}
