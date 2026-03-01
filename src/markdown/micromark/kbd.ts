import { codes } from "micromark-util-symbol";
import {
  type Code,
  consumeChar,
  consumeLiteral,
  consumeSingleLineBody,
  type Effects,
  type FromMarkdownContext,
  type State,
} from "./shared";

const KBD_RE = /^\{\{kbd:([^}\r\n]+)\}\}$/;

type TextNode = { type: "text"; value: string };
type KbdNode = { type: "kbd"; children: TextNode[] };
type ParentNode = { children?: Array<KbdNode | TextNode | unknown> };
type KbdStackNode = KbdNode | ParentNode;
type KbdContext = FromMarkdownContext<KbdStackNode>;

function tokenizeKbd(effects: Effects, ok: State, nok: State): State {
  const bodyStart = consumeSingleLineBody(effects, nok, {
    closingCode: codes.rightCurlyBrace,
    invalidStart: (code) => code === codes.rightCurlyBrace,
    onClosed: closeSecond,
  });

  return start;

  function start(code: Code): State | void {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.enter("rvlKbd");
    effects.consume(code);
    return consumeChar(effects, codes.leftCurlyBrace, keywordStart, nok);
  }

  function keywordStart(code: Code): State | void {
    return consumeLiteral(effects, "kbd", colon, nok)(code);
  }

  function colon(code: Code): State | void {
    return consumeChar(effects, codes.colon, bodyStart, nok)(code);
  }

  function closeSecond(code: Code): State | void {
    if (code !== codes.rightCurlyBrace) return nok(code);
    effects.consume(code);
    effects.exit("rvlKbd");
    return ok;
  }
}

const kbdConstruct = { name: "rvlKbd", tokenize: tokenizeKbd };

export function kbdSyntax() {
  return {
    text: {
      [codes.leftCurlyBrace]: [kbdConstruct],
    },
  };
}

export function kbdFromMarkdown() {
  return {
    enter: {
      rvlKbd(this: KbdContext, token: unknown) {
        this.enter({ type: "kbd", children: [] }, token);
      },
    },
    exit: {
      rvlKbd(this: KbdContext, token: unknown) {
        const raw = this.sliceSerialize(token);
        const match = KBD_RE.exec(raw);
        const content = (match?.[1] || "").trim();
        const compact = content.replace(/\s+/g, "");
        const keys = compact
          .split("+")
          .map((item) => item.trim())
          .filter(Boolean);

        const node = this.stack[this.stack.length - 1] as KbdNode;
        if (keys.length === 1) {
          node.children = [{ type: "text", value: keys[0] }];
          this.exit(token);
          return;
        }

        if (keys.length > 1) {
          node.children = [{ type: "text", value: keys.join("+") }];
          this.exit(token);

          const parent = this.stack[this.stack.length - 1] as ParentNode | undefined;
          if (!parent || !Array.isArray(parent.children) || parent.children.length === 0) {
            return;
          }

          const lastIndex = parent.children.length - 1;
          const last = parent.children[lastIndex] as KbdNode | TextNode | undefined;
          if (!last || (last as KbdNode).type !== "kbd") {
            return;
          }

          const nodes: Array<KbdNode | TextNode> = [];
          keys.forEach((key, index) => {
            nodes.push({
              type: "kbd",
              children: [{ type: "text", value: key }],
            });
            if (index < keys.length - 1) {
              nodes.push({ type: "text", value: "+" });
            }
          });
          parent.children.splice(lastIndex, 1, ...nodes);
          return;
        }

        this.exit(token);
      },
    },
  };
}
