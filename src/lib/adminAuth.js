export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api"
).replace(/\/$/, "");

export function getAdminLoginUrl() {
  if (typeof window === "undefined") {
    return "/admin/login";
  }

  return `/admin/login?next=${encodeURIComponent(
    window.location.pathname + window.location.search
  )}`;
}

export function redirectToAdminLogin() {
  if (typeof window !== "undefined") {
    window.location.replace(getAdminLoginUrl());
  }
}

export async function getCsrfToken() {
  const response = await fetch(`${API_URL}/auth/csrf/`, {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.csrfToken) {
    throw new Error("Unable to get security token.");
  }

  return data.csrfToken;
}

export async function refreshAdminSession() {
  const csrfToken = await getCsrfToken();

  const response = await fetch(`${API_URL}/auth/refresh/`, {
    method: "POST",
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": csrfToken,
    },
  });

  return response.ok;
}

export async function fetchWithAdminAuth(url, options = {}) {
  const requestOptions = {
    ...options,
    credentials: "include",
    cache: options.cache || "no-store",
  };

  let response = await fetch(url, requestOptions);

  if (response.status !== 401 && response.status !== 403) {
    return response;
  }

  try {
    const refreshed = await refreshAdminSession();

    if (!refreshed) {
      redirectToAdminLogin();
      return null;
    }

    response = await fetch(url, requestOptions);

    if (response.status === 401 || response.status === 403) {
      redirectToAdminLogin();
      return null;
    }

    return response;
  } catch (error) {
    console.error("Authentication refresh failed:", error);
    redirectToAdminLogin();
    return null;
  }
}
