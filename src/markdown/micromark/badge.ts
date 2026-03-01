// @ts-nocheck
import { codes } from "micromark-util-symbol";

const BADGE_RE = /^\{\{badge:([^}\r\n]+)\}\}$/;

const B_CODE = "b".charCodeAt(0);
const A_CODE = "a".charCodeAt(0);
const D_CODE = "d".charCodeAt(0);
const G_CODE = "g".charCodeAt(0);
const E_CODE = "e".charCodeAt(0);

function tokenizeBadge(effects, ok, nok) {
  let hasBody = false;

  return start;

  function start(code) {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.enter("rvlBadge");
    effects.consume(code);
    return openSecond;
  }

  function openSecond(code) {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.consume(code);
    return b1;
  }

  function b1(code) {
    if (code !== B_CODE) return nok(code);
    effects.consume(code);
    return a;
  }

  function a(code) {
    if (code !== A_CODE) return nok(code);
    effects.consume(code);
    return d;
  }

  function d(code) {
    if (code !== D_CODE) return nok(code);
    effects.consume(code);
    return g;
  }

  function g(code) {
    if (code !== G_CODE) return nok(code);
    effects.consume(code);
    return e;
  }

  function e(code) {
    if (code !== E_CODE) return nok(code);
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
    effects.exit("rvlBadge");
    return ok;
  }
}

const badgeConstruct = { name: "rvlBadge", tokenize: tokenizeBadge };

export function badgeSyntax() {
  return {
    text: {
      [codes.leftCurlyBrace]: [badgeConstruct],
    },
  };
}

export function badgeFromMarkdown() {
  return {
    enter: {
      rvlBadge(token) {
        this.enter({ type: "badge", children: [] }, token);
      },
    },
    exit: {
      rvlBadge(token) {
        const raw = this.sliceSerialize(token);
        const match = BADGE_RE.exec(raw);
        const content = (match?.[1] || "").trim();
        const node = this.stack[this.stack.length - 1];
        if (content) {
          node.children = [{ type: "text", value: content }];
        }
        this.exit(token);
      },
    },
  };
}
