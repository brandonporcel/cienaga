"use client";

import { toast } from "sonner";

const config = {
  duration: 3000,
};

export const showCatchError = (error: unknown) => {
  if (typeof error === "string") {
    console.error(`String error: ${error}`);
  } else if (error instanceof Error) {
    console.error(`Error object: ${error.message}`);
  } else {
    console.error("An unknown error occurred.");
  }
};

export const showCatchErrorToast = (error: unknown) => {
  if (typeof error === "string") {
    toast.error(error, config);
  } else if (error instanceof Error) {
    toast.error(error.message, config);
  } else {
    toast.error("An unknown error occurred.", config);
  }
  showCatchError(error);
};
