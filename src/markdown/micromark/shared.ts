import { codes } from "micromark-util-symbol";

export type Code = number;
export type State = (code: Code) => State | void;

export interface Effects {
  enter: (type: string) => void;
  exit: (type: string) => void;
  consume: (code: Code) => void;
}

export interface FromMarkdownContext<Node = unknown> {
  enter: (node: Node, token: unknown) => void;
  exit: (token: unknown) => void;
  sliceSerialize: (token: unknown) => string;
  stack: Node[];
}

export const isLineEndingOrEof = (code: Code): boolean =>
  code === codes.eof || code === codes.lineFeed || code === codes.carriageReturn;

export const isSpaceOrTab = (code: Code): boolean =>
  code === codes.space || code === codes.horizontalTab;

export const consumeChar = (
  effects: Effects,
  expected: Code,
  next: State,
  nok: State
): State => {
  return (code) => {
    if (code !== expected) return nok(code);
    effects.consume(code);
    return next;
  };
};

export const consumeLiteral = (
  effects: Effects,
  literal: string,
  next: State,
  nok: State
): State => {
  const chars = Array.from(literal, (ch) => ch.charCodeAt(0));
  let index = 0;

  return function literalState(code: Code): State | void {
    if (index >= chars.length) {
      return next(code);
    }

    if (code !== chars[index]) {
      return nok(code);
    }

    effects.consume(code);
    index += 1;

    if (index === chars.length) {
      return next;
    }

    return literalState;
  };
};

export interface SingleLineBodyOptions {
  closingCode: Code;
  invalidStart?: (code: Code) => boolean;
  onClosed: State;
}

export const consumeSingleLineBody = (
  effects: Effects,
  nok: State,
  options: SingleLineBodyOptions
): State => {
  const { closingCode, invalidStart, onClosed } = options;

  function start(code: Code): State | void {
    if (isLineEndingOrEof(code)) return nok(code);
    if (invalidStart?.(code)) return nok(code);
    effects.consume(code);
    return body;
  }

  function body(code: Code): State | void {
    if (isLineEndingOrEof(code)) return nok(code);
    if (code === closingCode) {
      effects.consume(code);
      return onClosed;
    }
    effects.consume(code);
    return body;
  }

  return start;
};
