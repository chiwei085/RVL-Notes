// @ts-nocheck
import { codes } from "micromark-util-symbol";

const EMBED_RE = /^!\[\[(youtube|bilibili):([^\]\s\r\n]+)(?:\s+([^\]\r\n]*))?\]\]$/;
const Y_CODE = "y".charCodeAt(0);
const O_CODE = "o".charCodeAt(0);
const U_CODE = "u".charCodeAt(0);
const T_CODE = "t".charCodeAt(0);
const B_CODE = "b".charCodeAt(0);
const E_CODE = "e".charCodeAt(0);
const I_CODE = "i".charCodeAt(0);
const L_CODE = "l".charCodeAt(0);

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
    return providerStart;
  }

  function providerStart(code) {
    if (code === Y_CODE) {
      effects.consume(code);
      return pYou1;
    }
    if (code === B_CODE) {
      effects.consume(code);
      return pBi1;
    }
    return nok(code);
  }

  function pYou1(code) {
    if (code !== O_CODE) return nok(code);
    effects.consume(code);
    return pYou2;
  }

  function pYou2(code) {
    if (code !== U_CODE) return nok(code);
    effects.consume(code);
    return pYou3;
  }

  function pYou3(code) {
    if (code !== T_CODE) return nok(code);
    effects.consume(code);
    return pYou4;
  }

  function pYou4(code) {
    if (code !== U_CODE) return nok(code);
    effects.consume(code);
    return pYou5;
  }

  function pYou5(code) {
    if (code !== B_CODE) return nok(code);
    effects.consume(code);
    return pYou6;
  }

  function pYou6(code) {
    if (code !== E_CODE) return nok(code);
    effects.consume(code);
    return providerDone;
  }

  function pBi1(code) {
    if (code !== I_CODE) return nok(code);
    effects.consume(code);
    return pBi2;
  }

  function pBi2(code) {
    if (code !== L_CODE) return nok(code);
    effects.consume(code);
    return pBi3;
  }

  function pBi3(code) {
    if (code !== I_CODE) return nok(code);
    effects.consume(code);
    return pBi4;
  }

  function pBi4(code) {
    if (code !== B_CODE) return nok(code);
    effects.consume(code);
    return pBi5;
  }

  function pBi5(code) {
    if (code !== I_CODE) return nok(code);
    effects.consume(code);
    return pBi6;
  }

  function pBi6(code) {
    if (code !== L_CODE) return nok(code);
    effects.consume(code);
    return pBi7;
  }

  function pBi7(code) {
    if (code !== I_CODE) return nok(code);
    effects.consume(code);
    return providerDone;
  }

  function providerDone(code) {
    if (code !== codes.colon) return nok(code);
    effects.consume(code);
    return idStart;
  }

  function idStart(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (isWhitespace(code) || code === codes.rightSquareBracket) return nok(code);
    hasId = true;
    effects.consume(code);
    return body;
  }

  function body(code) {
    if (code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn) {
      return nok(code);
    }
    if (code === codes.rightSquareBracket) {
      effects.consume(code);
      return close;
    }
    effects.consume(code);
    return body;
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
