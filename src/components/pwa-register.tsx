"use client";
import { useEffect } from "react";

const CURRENT_SW = "/sw.js";

declare global {
  interface Window {
    __pwaPrompt: BeforeInstallPromptEvent | null;
  }
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    window.__pwaPrompt = null;

    const installPromptHandler = (event: Event) => {
      event.preventDefault();
      window.__pwaPrompt = event as BeforeInstallPromptEvent;
    };

    window.addEventListener("beforeinstallprompt", installPromptHandler);

    if ("caches" in window) {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (k !== "baseeta-v3") {
            caches.delete(k).catch(() => {});
          }
        });
      }).catch(() => {});
    }

    if (!("serviceWorker" in navigator)) {
      return () => {
        window.removeEventListener("beforeinstallprompt", installPromptHandler);
      };
    }

    navigator.serviceWorker.getRegistrations().then((regs) => {
      const stale = regs.filter(
        (r) => r.active?.scriptURL && !r.active.scriptURL.endsWith(CURRENT_SW)
      );
      return Promise.all(stale.map((r) => r.unregister()));
    }).then(() => {
      navigator.serviceWorker.register(CURRENT_SW).catch(() => {});
    }).catch(() => {});

    return () => {
      window.removeEventListener("beforeinstallprompt", installPromptHandler);
    };
  }, []);

  return null;
}
