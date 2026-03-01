// @ts-nocheck
import { codes } from "micromark-util-symbol";

const BADGE_RE = /^\{\{badge\s*[: ]\s*([^}]+)\}\}$/s;

function isWhitespace(code) {
  return code === codes.space || code === codes.horizontalTab;
}

function tokenizeBadge(effects, ok, nok) {
  return effects.attempt({ tokenize: tokenizeBadgeAttempt }, ok, nok);
}

function tokenizeBadgeAttempt(effects, ok, nok) {
  let hasContent = false;

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
    if (code !== 98) return nok(code);
    effects.consume(code);
    return a;
  }

  function a(code) {
    if (code !== 97) return nok(code);
    effects.consume(code);
    return d;
  }

  function d(code) {
    if (code !== 100) return nok(code);
    effects.consume(code);
    return g;
  }

  function g(code) {
    if (code !== 103) return nok(code);
    effects.consume(code);
    return e;
  }

  function e(code) {
    if (code !== 101) return nok(code);
    effects.consume(code);
    return beforeSep;
  }

  function beforeSep(code) {
    if (code === codes.lineFeed || code === codes.carriageReturn) return nok(code);
    if (isWhitespace(code)) {
      effects.consume(code);
      return beforeSep;
    }
    if (code === codes.colon || code === codes.space) {
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
