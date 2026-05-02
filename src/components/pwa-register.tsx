"use client";
import { useEffect } from "react";

const CURRENT_SW = "/sw.js";

export function PwaRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.getRegistrations().then((regs) => {
      const stale = regs.filter(
        (r) => r.active?.scriptURL && !r.active.scriptURL.endsWith(CURRENT_SW)
      );
      return Promise.all(stale.map((r) => r.unregister()));
    }).then(() => {
      navigator.serviceWorker.register(CURRENT_SW).catch(() => {});
    }).catch(() => {});
  }, []);

  return null;
}
