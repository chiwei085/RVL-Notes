import type { Plugin } from "unified";

// Replaced by micromark syntax extension.
export function createEmbedPlugin(): Plugin<[], any> {
  return () => {
    return;
  };
}
