// @ts-nocheck
import { codes } from "micromark-util-symbol";

const EMBED_RE = /^!\[\[(youtube|bilibili):([^\]\s]+)([^\]]*)\]\]$/s;

function isWhitespace(code) {
  return code === codes.space || code === codes.horizontalTab;
}

function parseParams(spec) {
  const parts = spec.trim().split(/\s+/).filter(Boolean);
  const params = {};

  const normalizeAspect = (value) => {
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
      if (Number.isFinite(width) && width > 0) params.width = Math.round(width);
    }

    if (key === "aspect") {
      const aspect = normalizeAspect(rawValue);
      if (aspect) params.aspect = aspect;
    }
  }

  return params;
}

function isValidId(provider, id) {
  if (provider === "youtube") {
    return /^[a-zA-Z0-9_-]{6,20}$/.test(id);
  }
  return /^BV[a-zA-Z0-9]{10}$/.test(id) || /^av\d{1,12}$/.test(id);
}

function tokenizeEmbed(effects, ok, nok) {
  return effects.attempt({ tokenize: tokenizeEmbedAttempt }, ok, nok);
}

function tokenizeEmbedAttempt(effects, ok, nok) {
  let hasId = false;

  return start;

  function start(code) {
    if (code !== codes.exclamationMark) return nok(code);
    effects.enter("rvlEmbed");
    effects.consume(code);
    return open1;
  }

  function open1(code) {
    if (code !== codes.leftSquareBracket) return nok(code);
    effects.consume(code);
    return open2;
  }

  function open2(code) {
    if (code !== codes.leftSquareBracket) return nok(code);
    effects.consume(code);
    return provider;
  }

  function provider(code) {
    if (code === codes.eof || isWhitespace(code) || code === codes.rightSquareBracket) {
      return nok(code);
    }
    if (code === codes.colon) {
      effects.consume(code);
      return id;
    }
    effects.consume(code);
    return provider;
  }

  function id(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) return maybeClose;
    if (!isWhitespace(code)) hasId = true;
    effects.consume(code);
    return after;
  }

  function after(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) return maybeClose;
    effects.consume(code);
    return after;
  }

  function maybeClose(code) {
    if (code !== codes.rightSquareBracket) {
      effects.consume(code);
      return after;
    }

    effects.consume(code);
    return close;
  }

  function close(code) {
    if (code !== codes.rightSquareBracket || !hasId) return nok(code);
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
      rvlEmbed(token) {
        this.enter({ type: "embed", provider: "youtube", id: "" }, token);
      },
    },
    exit: {
      rvlEmbed(token) {
        const raw = this.sliceSerialize(token);
        const match = EMBED_RE.exec(raw);
        const node = this.stack[this.stack.length - 1];

        if (match) {
          const provider = match[1];
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
