import type { Plugin } from "unified";

// Replaced by micromark syntax extension.
export function createBadgePlugin(): Plugin<[], any> {
  return () => {
    return;
  };
}
