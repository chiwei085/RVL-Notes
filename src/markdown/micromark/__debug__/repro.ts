import { fromMarkdown } from "mdast-util-from-markdown";
import { badgeFromMarkdown, badgeSyntax } from "../badge";
import { embedFromMarkdown, embedSyntax } from "../embed";
import { kbdFromMarkdown, kbdSyntax } from "../kbd";

declare const process: { exitCode?: number };

type Case = { name: string; input: string };

const cases: Case[] = [
  { name: "kbd simple", input: "{{kbd:K}}" },
  { name: "kbd combo", input: "{{kbd:Ctrl+Shift+P}}" },
  { name: "kbd inline", input: "x {{kbd:K}} y" },
  { name: "badge simple", input: "{{badge:WIP}}" },
  { name: "badge inline", input: "x {{badge:WIP}} y" },
  { name: "embed basic", input: "![[youtube:J7Xzgcu6vVk]]" },
  {
    name: "embed params",
    input: "![[youtube:J7Xzgcu6vVk width=720 aspect=16:9]]",
  },
];

let failed = false;

for (const testCase of cases) {
  try {
    fromMarkdown(testCase.input, {
      extensions: [kbdSyntax(), badgeSyntax(), embedSyntax()],
      mdastExtensions: [kbdFromMarkdown(), badgeFromMarkdown(), embedFromMarkdown()],
    });
    console.log(`[OK] ${testCase.name}`);
  } catch (error) {
    failed = true;
    console.error(`[FAIL] ${testCase.name}`);
    console.error(error instanceof Error ? error.stack ?? error.message : error);
  }
}

if (failed) {
  process.exitCode = 1;
}
