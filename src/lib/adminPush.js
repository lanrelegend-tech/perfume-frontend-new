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

  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  const rawData =
    window.atob(base64);

  return Uint8Array.from(
    [...rawData].map(
      (char) => char.charCodeAt(0)
    )
  );
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

  const token =
    localStorage.getItem(
      "access_token"
    );

  if (!token) {
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

  const response =
    await fetch(
      `${API_URL}/notifications/admin/push/subscribe/`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
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

  if (!response.ok) {
    throw new Error(
      data.detail ||
        "Unable to save push subscription."
    );
  }

  return subscription;
}


export async function disableAdminPush() {
  const registration =
    await navigator.serviceWorker.ready;

  const subscription =
    await registration.pushManager.getSubscription();

  if (!subscription) {
    return;
  }

  const token =
    localStorage.getItem(
      "access_token"
    );

  if (token) {
    await fetch(
      `${API_URL}/notifications/admin/push/subscribe/`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          endpoint:
            subscription.endpoint,
        }),
      }
    );
  }

  await subscription.unsubscribe();
}