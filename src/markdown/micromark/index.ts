import type { Plugin } from "unified";
import { badgeFromMarkdown, badgeSyntax } from "./badge";
import { embedFromMarkdown, embedSyntax } from "./embed";
import { kbdFromMarkdown, kbdSyntax } from "./kbd";

interface MicromarkPluginData {
  micromarkExtensions?: unknown[];
  fromMarkdownExtensions?: unknown[];
}

interface ProcessorWithData {
  data: () => MicromarkPluginData;
}

export function createMicromarkSyntaxPlugin(): Plugin<[], any> {
  return function attacher(this: ProcessorWithData) {
    const data = this.data();

    const micromarkExtensions = data.micromarkExtensions || (data.micromarkExtensions = []);
    micromarkExtensions.push(kbdSyntax(), badgeSyntax(), embedSyntax());

    const fromMarkdownExtensions =
      data.fromMarkdownExtensions || (data.fromMarkdownExtensions = []);
    fromMarkdownExtensions.push(kbdFromMarkdown(), badgeFromMarkdown(), embedFromMarkdown());
  };
}
