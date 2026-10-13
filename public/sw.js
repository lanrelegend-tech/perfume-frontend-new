
const CACHE_NAME = "orentemist-v2";
const CACHE_PREFIX = "orentemist-";

/**
 * INSTALL
 * Activate the updated Service Worker promptly.
 */
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

/**
 * ACTIVATE
 * Remove older ORENTEMIST caches without deleting
 * the current cache or caches belonging to other apps.
 */
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();

      await Promise.all(
        cacheNames
          .filter(
            (name) =>
              name.startsWith(CACHE_PREFIX) &&
              name !== CACHE_NAME
          )
          .map((name) => caches.delete(name))
      );

      await self.clients.claim();
    })()
  );
});

/**
 * FETCH
 *
 * Intentionally omitted.
 * Let the browser handle requests normally.
 * This avoids the old fetch handler returning
 * an undefined response when the cache is empty.
 */

/**
 * PUSH NOTIFICATIONS
 */
self.addEventListener("push", (event) => {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
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

  const title = data.title || "ORENTEMIST";

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-192x192.png",
    data: {
      url: data.url || "/admin",
    },
    tag: data.tag || "orentemist-admin",
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
          "[ORENTEMIST PUSH] Notification failed:",
          error
        );

        // Retry without optional image assets.
        const fallbackOptions = { ...options };
        delete fallbackOptions.icon;
        delete fallbackOptions.badge;

        try {
          await self.registration.showNotification(
            title,
            fallbackOptions
          );
        } catch (fallbackError) {
          console.error(
            "[ORENTEMIST PUSH] Fallback notification failed:",
            fallbackError
          );
        }
      }
    })()
  );
});

/**
 * NOTIFICATION CLICK
 * Only navigate to URLs on this website.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  let targetUrl;

  try {
    targetUrl = new URL(
      event.notification.data?.url || "/admin",
      self.location.origin
    );
  } catch (error) {
    targetUrl = new URL("/admin", self.location.origin);
  }

  if (targetUrl.origin !== self.location.origin) {
    targetUrl = new URL("/admin", self.location.origin);
  }

  event.waitUntil(
    (async () => {
      const windowClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      for (const client of windowClients) {
        if ("focus" in client && "navigate" in client) {
          try {
            await client.navigate(targetUrl.href);
            return await client.focus();
          } catch (error) {
            console.error(
              "[ORENTEMIST PUSH] Window navigation failed:",
              error
            );
          }
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl.href);
      }
    })()
  );
});
