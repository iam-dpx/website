/*
  main.ts
  Dead Pixel — personal profile site
  Written by Dead Pixel (iamreal.dpx@gmail.com)
*/

/**
 * Detects whether the current browser is a mobile browser or a desktop/web
 * browser and tags <body> with a class accordingly, so CSS (and future
 * scripts) can branch on device type without duplicating the whole page.
 */
function detectDeviceMode(): "mobile" | "desktop" {
  const ua = navigator.userAgent || "";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Windows Phone/i.test(ua);
  return isMobile ? "mobile" : "desktop";
}

function applyDeviceClass(): void {
  const mode = detectDeviceMode();
  document.body.classList.add(mode === "mobile" ? "is-mobile" : "is-desktop");
}

/**
 * Plays the hero glitch animation once per page load. Kept as a single
 * triggered moment rather than a constant/looping effect.
 */
function triggerHeroGlitch(): void {
  const title = document.getElementById("glitchTitle");
  if (!title) return;
  title.classList.add("glitch");
}

function init(): void {
  applyDeviceClass();
  triggerHeroGlitch();
}

document.addEventListener("DOMContentLoaded", init);
