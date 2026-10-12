export function isAppleTouch() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isPhone() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches;
}

export function isDesktopPointer() {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(pointer: fine) and (hover: hover)").matches;
}
