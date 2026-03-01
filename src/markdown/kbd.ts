import type { Plugin } from "unified";

// Replaced by micromark syntax extension.
export function createKbdPlugin(): Plugin<[], any> {
  return () => {
    return;
  };
}
