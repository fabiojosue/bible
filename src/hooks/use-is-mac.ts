import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** Whether to show ⌘ instead of Ctrl in shortcut hints. False on the server. */
export function useIsMac(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => /Mac|iPhone|iPad/.test(navigator.userAgent),
    () => false,
  );
}
