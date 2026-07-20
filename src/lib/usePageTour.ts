import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { TOURS, tourStorageKey } from "./tours";

// Launch a page's tour. Skips if already seen (unless `force`). Only shows steps
// whose anchor is currently in the DOM. Marks the page seen when finished OR skipped.
export function startTour(pageKey: string, force = false) {
  const steps = TOURS[pageKey];
  if (!steps?.length) return;
  const key = tourStorageKey(pageKey);
  if (!force) {
    try { if (localStorage.getItem(key)) return; } catch { /* ignore */ }
  }
  const present = steps.filter((s) => !s.element || document.querySelector(s.element as string));
  if (!present.length) return;

  // Mark seen as soon as we show it — finishing or skipping shouldn't matter, and this
  // avoids depending on driver.js destroy-callback timing.
  try { localStorage.setItem(key, "1"); } catch { /* ignore */ }

  let driverObj: ReturnType<typeof driver> | null = null;
  driverObj = driver({
    showProgress: true,
    allowClose: true,
    overlayColor: "rgba(15,23,42,0.55)",
    nextBtnText: "Next",
    prevBtnText: "Back",
    doneBtnText: "Done",
    steps: present,
    onPopoverRender: (popover) => {
      // Explicit "Skip" button alongside the × close, in every popover.
      const skip = document.createElement("button");
      skip.textContent = "Skip";
      skip.style.cssText = "margin-right:auto;background:transparent;border:none;color:#94a3b8;font-size:13px;font-weight:600;cursor:pointer;padding:0 4px;";
      skip.addEventListener("click", () => driverObj?.destroy());
      popover.footerButtons.prepend(skip);
    },
  });
  driverObj.drive();
}

// Runs the first-visit tour for `pageKey` once its anchors are mounted.
export function usePageTour(pageKey: string | null, ready = true) {
  useEffect(() => {
    if (!pageKey || !ready) return;
    const t = window.setTimeout(() => startTour(pageKey), 500);
    return () => window.clearTimeout(t);
  }, [pageKey, ready]);
}

// Clear all tour flags so every page's tutorial runs again.
export function resetAllTours() {
  try {
    Object.keys(TOURS).forEach((k) => localStorage.removeItem(tourStorageKey(k)));
  } catch { /* ignore */ }
}
