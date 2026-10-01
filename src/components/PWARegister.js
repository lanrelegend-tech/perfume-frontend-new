"use client";

import { useEffect } from "react";

export default function PWARegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
          
          })
          .catch((error) => {
            console.error(
              "ORENTEMIST PWA service worker registration failed:",
              error
            );
          });
      });
    }
  }, []);

  return null;
}