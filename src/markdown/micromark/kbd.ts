// @ts-nocheck
import { codes } from "micromark-util-symbol";

const KBD_RE = /^\{\{kbd\s*[:+ ]\s*([^}]+)\}\}$/s;

function isWhitespace(code) {
  return code === codes.space || code === codes.horizontalTab;
}

function tokenizeKbd(effects, ok, nok) {
  return effects.attempt({ tokenize: tokenizeKbdAttempt }, ok, nok);
}

function tokenizeKbdAttempt(effects, ok, nok) {
  let hasContent = false;

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
    if (code !== 107) return nok(code);
    effects.consume(code);
    return b;
  }

  function b(code) {
    if (code !== 98) return nok(code);
    effects.consume(code);
    return d;
  }

  function d(code) {
    if (code !== 100) return nok(code);
    effects.consume(code);
    return beforeSep;
  }

  function beforeSep(code) {
    if (code === codes.lineFeed || code === codes.carriageReturn) return nok(code);
    if (isWhitespace(code)) {
      effects.consume(code);
      return beforeSep;
    }
    if (code === codes.colon || code === codes.plusSign || code === codes.space) {
      effects.consume(code);
      return afterSep;
    }
    return nok(code);
  }

  function afterSep(code) {
    if (code === codes.lineFeed || code === codes.carriageReturn) return nok(code);
    if (isWhitespace(code)) {
      effects.consume(code);
      return afterSep;
    }
    if (code === codes.eof || code === codes.rightCurlyBrace) return nok(code);
    hasContent = true;
    effects.consume(code);
    return content;
  }

  function content(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (code === codes.rightCurlyBrace) return maybeClose;
    if (!isWhitespace(code)) hasContent = true;
    effects.consume(code);
    return content;
  }

  function maybeClose(code) {
    if (code !== codes.rightCurlyBrace) {
      if (!isWhitespace(code)) hasContent = true;
      effects.consume(code);
      return content;
    }

    effects.consume(code);
    return close;
  }

  function close(code) {
    if (code !== codes.rightCurlyBrace || !hasContent) return nok(code);
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
