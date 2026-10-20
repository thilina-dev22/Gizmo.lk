import { useLoadingStore } from "@/store/useLoadingStore";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface ApiFetchOptions extends Omit<RequestInit, "body"> {
  /** Plain objects are sent as JSON; FormData is sent as-is. */
  body?: unknown;
  /** Skip the global top progress bar (e.g. for background polling). */
  silent?: boolean;
}

function defaultErrorMessage(status: number): string {
  if (status === 401) return "Your session has expired. Please log in again.";
  if (status === 404) return "The requested item could not be found.";
  if (status === 429) return "Too many requests. Please wait a moment and try again.";
  if (status === 413) return "The uploaded file is too large.";
  return "Something went wrong. Please try again.";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

/**
 * Thin fetch wrapper: JSON encoding/decoding, consistent error messages from the API's
 * `{ error }` payloads, and global loading tracking for the top progress bar.
 */
export async function apiFetch<T = any>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, silent, headers, ...init } = options;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  const hasJsonBody = body !== undefined && !isFormData;

  const { beginRequest, endRequest } = useLoadingStore.getState();
  if (!silent) beginRequest();

  try {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...init,
      headers: {
        Accept: "application/json",
        ...(hasJsonBody ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body === undefined ? undefined : hasJsonBody ? JSON.stringify(body) : (body as BodyInit),
    });

    const isJson = (response.headers.get("content-type") || "").includes("application/json");
    const data = isJson ? await response.json().catch(() => null) : null;

    if (!response.ok) {
      throw new ApiError(data?.error || defaultErrorMessage(response.status), response.status);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError || isAbortError(error)) throw error;
    throw new ApiError("Network error — please check your internet connection and try again.", 0);
  } finally {
    if (!silent) endRequest();
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
