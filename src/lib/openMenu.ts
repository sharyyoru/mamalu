// Utility to open the fullscreen menu from anywhere in the app
export function openMenu() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("openMamaluMenu"));
  }
}
