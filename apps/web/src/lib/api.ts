export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

interface ApiRequestOptions extends RequestInit {
  retryOnUnauthorized?: boolean;
}

async function parseJson(response: Response) {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return response.json();
  }

  return null;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { retryOnUnauthorized = true, headers, ...init } = options;

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });

  if (response.status === 401 && retryOnUnauthorized) {
    const refreshResponse = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    if (refreshResponse.ok) {
      return apiFetch<T>(path, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  if (!response.ok) {
    const payload = await parseJson(response);
    const message =
      typeof payload === "object" &&
      payload !== null &&
        "message" in payload &&
      (typeof payload.message === "string" ||
        (Array.isArray(payload.message) &&
          payload.message.every((item: string) => typeof item === "string")))
        ? typeof payload.message === "string"
          ? payload.message
          : payload.message.join(", ")
        : "Request failed.";
    throw new ApiError(message, response.status, payload);
  }

  return (await parseJson(response)) as T;
}

export function postJson<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function patchJson<T>(path: string, body: unknown) {
  return apiFetch<T>(path, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteJson<T>(path: string) {
  return apiFetch<T>(path, {
    method: "DELETE",
  });
}
