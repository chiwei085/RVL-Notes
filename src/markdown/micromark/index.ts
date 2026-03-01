import type { Plugin } from "unified";
import { badgeFromMarkdown, badgeSyntax } from "./badge";
import { embedFromMarkdown, embedSyntax } from "./embed";
import { kbdFromMarkdown, kbdSyntax } from "./kbd";

export function createMicromarkSyntaxPlugin(): Plugin<[], any> {
  return function attacher(this: any) {
    const data = this.data();

    const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
    micromarkExtensions.push(kbdSyntax(), badgeSyntax(), embedSyntax());

    const fromMarkdownExtensions =
      data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
    fromMarkdownExtensions.push(kbdFromMarkdown(), badgeFromMarkdown(), embedFromMarkdown());
  };
}
