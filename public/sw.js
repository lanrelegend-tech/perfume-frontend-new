const CACHE_NAME = "orentemist-v1";

const STATIC_ASSETS = [
  "/",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const responseClone = response.clone();

        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});

self.addEventListener("push", (event) => {


  let data = {};

  try {
    data = event.data
      ? event.data.json()
      : {};

  } catch (error) {
    console.error(
      "[ORENTEMIST PUSH] JSON parsing failed:",
      error
    );

    data = {
      title: "ORENTEMIST",
      body: event.data
        ? event.data.text()
        : "You have a new notification.",
    };
  }

  const title =
    data.title || "ORENTEMIST";

  const options = {
    body: data.body || "",

    icon:
      data.icon ||
      "/icons/icon-192x192.png",

    badge:
      data.badge ||
      "/icons/icon-192x192.png",

    data: {
      url:
        data.url ||
        "/admin",
    },

    tag:
      data.tag ||
      "orentemist-admin",

    renotify: true,
  };

  event.waitUntil(
    (async () => {
      try {
        await self.registration.showNotification(
          title,
          options
        );
      } catch (error) {
        console.error(
          "[ORENTEMIST PUSH] showNotification failed:",
          error
        );

        const fallbackOptions = {
          ...options,
        };

        delete fallbackOptions.icon;
        delete fallbackOptions.badge;

        try {
          await self.registration.showNotification(
            title,
            fallbackOptions
          );
        } catch (fallbackError) {
          console.error(
            "[ORENTEMIST PUSH] fallback notification failed:",
            fallbackError
          );
        }
      }
    })()
  );
});


self.addEventListener(
  "notificationclick",
  (event) => {
   

    event.notification.close();

    const url =
      event.notification?.data?.url ||
      "/admin";

    event.waitUntil(
      clients
        .matchAll({
          type: "window",
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (const client of clientList) {
            if (
              "focus" in client &&
              "navigate" in client
            ) {
              client.navigate(url);

              return client.focus();
            }
          }

          if (clients.openWindow) {
            return clients.openWindow(url);
          }
        })
    );
  }
);