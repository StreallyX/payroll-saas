/**
 * Extracts a user-friendly error message from various error types
 * Works with tRPC errors, standard errors, and unknown error objects
 */
export function getErrorMessage(error: unknown): string {
  // Handle null/undefined
  if (!error) {
    return "An unknown error occurred"
  }

  // Handle string errors
  if (typeof error === "string") {
    return error
  }

  // Handle Error objects and tRPC errors
  if (typeof error === "object") {
    const err = error as Record<string, unknown>

    // tRPC error structure: error.message
    if (typeof err.message === "string" && err.message) {
      return err.message
    }

    // Some APIs return error.data.message
    if (err.data && typeof err.data === "object") {
      const data = err.data as Record<string, unknown>
      if (typeof data.message === "string" && data.message) {
        return data.message
      }
    }

    // Axios-style errors: error.response.data.message
    if (err.response && typeof err.response === "object") {
      const response = err.response as Record<string, unknown>
      if (response.data && typeof response.data === "object") {
        const data = response.data as Record<string, unknown>
        if (typeof data.message === "string" && data.message) {
          return data.message
        }
      }
    }

    // Try to stringify if nothing else works
    try {
      const str = JSON.stringify(error)
      if (str !== "{}") {
        return str
      }
    } catch {
      // Ignore stringify errors
    }
  }

  return "An unexpected error occurred"
}
