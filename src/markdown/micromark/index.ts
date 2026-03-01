import type { Plugin } from "unified";
import { badgeFromMarkdown, badgeSyntax } from "./badge";
import { embedFromMarkdown, embedSyntax } from "./embed";
import { kbdFromMarkdown, kbdSyntax } from "./kbd";

// Temporary switches for binary-searching tokenizer crashes.
// Set one to false to isolate the failing syntax extension.
const ENABLE_KBD = true;
const ENABLE_BADGE = true;
const ENABLE_EMBED = true;

export function createMicromarkSyntaxPlugin(): Plugin<[], any> {
  return function attacher(this: any) {
    if (!ENABLE_KBD && !ENABLE_BADGE && !ENABLE_EMBED) {
      return;
    }

    const data = this.data();

    const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
    if (ENABLE_KBD) {
      const syntax = kbdSyntax();
      if (syntax && typeof syntax === "object") {
        micromarkExtensions.push(syntax);
      }
    }
    if (ENABLE_BADGE) {
      const syntax = badgeSyntax();
      if (syntax && typeof syntax === "object") {
        micromarkExtensions.push(syntax);
      }
    }
    if (ENABLE_EMBED) {
      const syntax = embedSyntax();
      if (syntax && typeof syntax === "object") {
        micromarkExtensions.push(syntax);
      }
    }

    const fromMarkdownExtensions =
      data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
    if (ENABLE_KBD) {
      const ext = kbdFromMarkdown();
      if (ext && typeof ext === "object") {
        fromMarkdownExtensions.push(ext);
      }
    }
    if (ENABLE_BADGE) {
      const ext = badgeFromMarkdown();
      if (ext && typeof ext === "object") {
        fromMarkdownExtensions.push(ext);
      }
    }
    if (ENABLE_EMBED) {
      const ext = embedFromMarkdown();
      if (ext && typeof ext === "object") {
        fromMarkdownExtensions.push(ext);
      }
    }
  };
}
