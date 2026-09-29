const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://perfume-backend-sbvd.onrender.com/api";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
}

async function getCsrfToken() {
  const response = await fetch(
    `${API_URL}/auth/csrf/`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  const data = await response.json();

  if (!response.ok || !data.csrfToken) {
    throw new Error(
      "Unable to get security token."
    );
  }

  return data.csrfToken;
}

async function checkAuthentication() {
  const response = await fetch(
    `${API_URL}/users/me/`,
    {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    }
  );

  if (response.status === 401 || response.status === 403) {
    return false;
  }

  if (!response.ok) {
    throw new Error(
      "Unable to verify your login session."
    );
  }

  return true;
}

export async function enableAdminPush() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    throw new Error(
      "Push notifications are not supported on this device."
    );
  }

  if (!("Notification" in window)) {
    throw new Error(
      "This browser does not support notifications."
    );
  }

  if (!VAPID_PUBLIC_KEY) {
    throw new Error(
      "VAPID public key is missing."
    );
  }

  const isAuthenticated =
    await checkAuthentication();

  if (!isAuthenticated) {
    throw new Error(
      "You are not logged in."
    );
  }

  const permission =
    await Notification.requestPermission();

  if (permission !== "granted") {
    throw new Error(
      "Notification permission was not granted."
    );
  }

  const registration =
    await navigator.serviceWorker.register(
      "/sw.js",
      {
        scope: "/",
      }
    );

  await navigator.serviceWorker.ready;

  if (!("pushManager" in registration)) {
    throw new Error(
      "Web Push is not available here. On iPhone, open the installed Admin app from your Home Screen."
    );
  }

  let subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          urlBase64ToUint8Array(
            VAPID_PUBLIC_KEY
          ),
      });
  }

  const csrfToken =
    await getCsrfToken();

  const response =
    await fetch(
      `${API_URL}/notifications/admin/push/subscribe/`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type":
            "application/json",
          "X-CSRFToken":
            csrfToken,
        },
        body: JSON.stringify(
          subscription.toJSON()
        ),
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    throw new Error(
      "Your login session has expired. Please log in again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Unable to save push subscription."
    );
  }

  return subscription;
}

export async function disableAdminPush() {
  if (
    typeof window === "undefined" ||
    !("serviceWorker" in navigator)
  ) {
    return;
  }

  const registration =
    await navigator.serviceWorker.ready;

  if (!("pushManager" in registration)) {
    return;
  }

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const isAuthenticated =
    await checkAuthentication();

  if (isAuthenticated) {
    try {
      const csrfToken =
        await getCsrfToken();

      await fetch(
        `${API_URL}/notifications/admin/push/subscribe/`,
        {
          method: "DELETE",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
            "X-CSRFToken":
              csrfToken,
          },
          body: JSON.stringify({
            endpoint:
              subscription.endpoint,
          }),
        }
      );
    } catch (error) {
      console.error(
        "Unable to remove push subscription from server:",
        error
      );
    }
  }

  await subscription.unsubscribe();
}
