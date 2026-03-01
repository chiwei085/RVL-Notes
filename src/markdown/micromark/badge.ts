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

const BADGE_RE = /^\{\{badge:([^}\r\n]+)\}\}$/;

type TextNode = { type: "text"; value: string };
type BadgeNode = { type: "badge"; children: TextNode[] };
type BadgeContext = FromMarkdownContext<BadgeNode>;

function tokenizeBadge(effects: Effects, ok: State, nok: State): State {
  const bodyStart = consumeSingleLineBody(effects, nok, {
    closingCode: codes.rightCurlyBrace,
    invalidStart: (code) => code === codes.rightCurlyBrace,
    onClosed: closeSecond,
  });

  return start;

  function start(code: Code): State | void {
    if (code !== codes.leftCurlyBrace) return nok(code);
    effects.enter("rvlBadge");
    effects.consume(code);
    return consumeChar(effects, codes.leftCurlyBrace, keywordStart, nok);
  }

  function keywordStart(code: Code): State | void {
    return consumeLiteral(effects, "badge", colon, nok)(code);
  }

  function colon(code: Code): State | void {
    return consumeChar(effects, codes.colon, bodyStart, nok)(code);
  }

  function closeSecond(code: Code): State | void {
    if (code !== codes.rightCurlyBrace) return nok(code);
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
      rvlBadge(this: BadgeContext, token: unknown) {
        this.enter({ type: "badge", children: [] }, token);
      },
    },
    exit: {
      rvlBadge(this: BadgeContext, token: unknown) {
        const raw = this.sliceSerialize(token);
        const match = BADGE_RE.exec(raw);
        const content = (match?.[1] || "").trim();
        const node = this.stack[this.stack.length - 1] as BadgeNode;
        if (content) {
          node.children = [{ type: "text", value: content }];
        }
        this.exit(token);
      },
    },
  };
}
