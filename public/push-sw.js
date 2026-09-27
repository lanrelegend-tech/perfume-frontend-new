self.addEventListener("push", (event) => {
  console.log("[ORENTEMIST PUSH] Push event received");

  let data = {};

  try {
    data = event.data ? event.data.json() : {};

    console.log("[ORENTEMIST PUSH] Payload:", data);
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
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    data: {
      url: data.url || "/admin",
    },
    tag: data.tag || "orentemist-admin",
    renotify: true,
  };

  console.log(
    "[ORENTEMIST PUSH] Showing notification:",
    title,
    options
  );

  event.waitUntil(
    self.registration.showNotification(
      title,
      options
    )
  );
});


self.addEventListener(
  "notificationclick",
  (event) => {
    console.log(
      "[ORENTEMIST PUSH] Notification clicked"
    );

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