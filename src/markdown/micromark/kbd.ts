// @ts-nocheck
import { codes } from "micromark-util-symbol";

const KBD_RE = /^\{\{kbd:([^}\r\n]+)\}\}$/;

const K_CODE = "k".charCodeAt(0);
const B_CODE = "b".charCodeAt(0);
const D_CODE = "d".charCodeAt(0);

function tokenizeKbd(effects, ok, nok) {
  let hasBody = false;

  return start;

  function start(code) {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.enter("rvlKbd");
    effects.consume(code);
    return openSecond;
  }

  function openSecond(code) {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.consume(code);
    return k;
  }

  function k(code) {
    if (code !== K_CODE) return nok(code);
    effects.consume(code);
    return b;
  }

  function b(code) {
    if (code !== B_CODE) return nok(code);
    effects.consume(code);
    return d;
  }

  function d(code) {
    if (code !== D_CODE) return nok(code);
    effects.consume(code);
    return colon;
  }

  function colon(code) {
    if (code !== codes.colon) return nok(code);
    effects.consume(code);
    return bodyStart;
  }

  function bodyStart(code) {
    if (
      code === codes.eof ||
      code === codes.lineFeed ||
      code === codes.carriageReturn ||
      code === codes.rightCurlyBrace
    ) {
      return nok(code);
    }
    hasBody = true;
    effects.consume(code);
    return body;
  }

  function body(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (code === codes.rightCurlyBrace) {
      effects.consume(code);
      return closeSecond;
    }
    effects.consume(code);
    return body;
  }

  function closeSecond(code) {
    if (code !== codes.rightCurlyBrace || !hasBody) return nok(code);
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
      rvlKbd(token) {
        this.enter({ type: "kbd", children: [] }, token);
      },
    },
    exit: {
      rvlKbd(token) {
        const raw = this.sliceSerialize(token);
        const match = KBD_RE.exec(raw);
        const content = (match?.[1] || "").trim();
        const compact = content.replace(/\s+/g, "");
        const keys = compact
          .split("+")
          .map((item) => item.trim())
          .filter(Boolean);
        const node = this.stack[this.stack.length - 1];
        if (keys.length === 1) {
          node.children = [{ type: "text", value: keys[0] }];
          this.exit(token);
          return;
        }
        if (keys.length > 1) {
          node.children = [{ type: "text", value: keys.join("+") }];
          this.exit(token);
          const parent = this.stack[this.stack.length - 1];
          if (parent && Array.isArray(parent.children) && parent.children.length > 0) {
            const lastIndex = parent.children.length - 1;
            const last = parent.children[lastIndex];
            if (last && last.type === "kbd") {
              const nodes = [];
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
            }
          }
          return;
        }
        this.exit(token);
      },
    },
  };
}
