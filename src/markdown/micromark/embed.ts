import { codes } from "micromark-util-symbol";
import {
  type Code,
  consumeChar,
  consumeLiteral,
  consumeSingleLineBody,
  isSpaceOrTab,
  type Effects,
  type FromMarkdownContext,
  type State,
} from "./shared";

const EMBED_RE = /^!\[\[(youtube|bilibili):([^\]\s\r\n]+)(?:\s+([^\]\r\n]*))?\]\]$/;

type EmbedProvider = "youtube" | "bilibili";
type EmbedAspect = "16:9" | "4:3" | "1:1";
type EmbedNode = {
  type: "embed";
  provider: EmbedProvider;
  id: string;
  width?: number;
  aspect?: EmbedAspect;
};
type EmbedContext = FromMarkdownContext<EmbedNode>;

function parseParams(spec: string): { width?: number; aspect?: EmbedAspect } {
  const parts = spec.trim().split(/\s+/).filter(Boolean);
  const params: { width?: number; aspect?: EmbedAspect } = {};

  const normalizeAspect = (value: string): EmbedAspect | undefined => {
    if (value === "16:9" || value === "4:3" || value === "1:1") return value;
    if (value === "16") return "16:9";
    if (value === "4") return "4:3";
    if (value === "1") return "1:1";
    return undefined;
  };

  for (const token of parts) {
    const [key, ...rest] = token.split("=");
    const rawValue = rest.join("=");
    if (!key || rawValue == null) continue;

    if (key === "width") {
      const width = Number(rawValue);
      if (Number.isFinite(width) && width > 0) {
        params.width = Math.round(width);
      }
      continue;
    }

    if (key === "aspect") {
      const aspect = normalizeAspect(rawValue);
      if (aspect) {
        params.aspect = aspect;
      }
    }
  }

  return params;
}

function isValidId(provider: EmbedProvider, id: string): boolean {
  if (provider === "youtube") {
    return /^[a-zA-Z0-9_-]{6,20}$/.test(id);
  }
  return /^BV[a-zA-Z0-9]{10}$/.test(id) || /^av\d{1,12}$/.test(id);
}

function tokenizeEmbed(effects: Effects, ok: State, nok: State): State {
  const idStart = consumeSingleLineBody(effects, nok, {
    closingCode: codes.rightSquareBracket,
    invalidStart: (code) => isSpaceOrTab(code) || code === codes.rightSquareBracket,
    onClosed: closeSecond,
  });

  return start;

  function start(code: Code): State | void {
    if (code !== codes.exclamationMark) return nok(code);
    effects.enter("rvlEmbed");
    effects.consume(code);
    return consumeChar(effects, codes.leftSquareBracket, open2, nok);
  }

  function open2(code: Code): State | void {
    return consumeChar(effects, codes.leftSquareBracket, providerStart, nok)(code);
  }

  function providerStart(code: Code): State | void {
    if (code === "y".charCodeAt(0)) {
      effects.consume(code);
      return consumeLiteral(effects, "outube", providerDone, nok);
    }
    if (code === "b".charCodeAt(0)) {
      effects.consume(code);
      return consumeLiteral(effects, "ilibili", providerDone, nok);
    }
    return nok(code);
  }

  function providerDone(code: Code): State | void {
    return consumeChar(effects, codes.colon, idStart, nok)(code);
  }

  function closeSecond(code: Code): State | void {
    if (code !== codes.rightSquareBracket) return nok(code);
    effects.consume(code);
    effects.exit("rvlEmbed");
    return ok;
  }
}

const embedConstruct = { name: "rvlEmbed", tokenize: tokenizeEmbed };

export function embedSyntax() {
  return {
    text: {
      [codes.exclamationMark]: [embedConstruct],
    },
  };
}

export function embedFromMarkdown() {
  return {
    enter: {
      rvlEmbed(this: EmbedContext, token: unknown) {
        this.enter({ type: "embed", provider: "youtube", id: "" }, token);
      },
    },
    exit: {
      rvlEmbed(this: EmbedContext, token: unknown) {
        const raw = this.sliceSerialize(token);
        const match = EMBED_RE.exec(raw);
        const node = this.stack[this.stack.length - 1] as EmbedNode;

        if (match) {
          const provider = match[1] as EmbedProvider;
          const id = match[2];
          const paramsSpec = match[3] || "";

          if (isValidId(provider, id)) {
            const parsed = parseParams(paramsSpec);
            node.provider = provider;
            node.id = id;
            node.width = parsed.width;
            node.aspect = parsed.aspect;
          }
        }

        this.exit(token);
      },
    },
  };
}
