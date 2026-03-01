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
        const content = (match?.[1] || "").replace(/\s+/g, "");
        const node = this.stack[this.stack.length - 1];
        if (content) {
          node.children = [{ type: "text", value: content }];
        }
        this.exit(token);
      },
    },
  };
}
