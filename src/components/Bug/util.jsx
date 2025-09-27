import { useEffect } from "react";

export function useLocalStorageListener(key, callback) {
  useEffect(() => {
    // ✅ Fire callback when localStorage changes in another tab
    const handleStorage = (event) => {
      if (event.key === key) {
        callback(event.newValue, event.oldValue);
      }
    };

    // ✅ Fire callback when we manually dispatch an update in this tab
    const handleCustomEvent = () => {
      const newValue = localStorage.getItem(key);
      callback(newValue, null);
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("localStorageUpdated", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("localStorageUpdated", handleCustomEvent);
    };
  }, [key, callback]);
}

// 🔧 Wrap setItem so it also triggers our custom event
export function setLocalStorage(key, value) {
  localStorage.setItem(key, value);
  window.dispatchEvent(new Event("localStorageUpdated"));
}
