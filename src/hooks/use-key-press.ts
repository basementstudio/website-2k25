import { useEffect } from "react";

export const useKeyPress = (
  key: string,
  callback: (event: KeyboardEvent) => void,
  event: "keydown" | "keyup" = "keydown",
) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === key) callback(event);
    };

    window.addEventListener(event, handler);

    return () => window.removeEventListener(event, handler);
  }, [key, callback, event]);
};
