import type {} from "react";
import type { RootContent } from "mdast";

type EmbedAspect = "16:9" | "4:3" | "1:1";
type CalloutKind =
  | "note"
  | "info"
  | "tip"
  | "success"
  | "warning"
  | "danger"
  | "error";

declare module "mdast" {
  interface RootContentMap {
    callout: {
      type: "callout";
      kind: CalloutKind;
      title?: string;
      children: unknown[];
    };
    fold: {
      type: "fold";
      title?: string;
      children: RootContent[];
    };
  }

  interface BlockContentMap {
    callout: {
      type: "callout";
      kind: CalloutKind;
      title?: string;
      children: unknown[];
    };
    fold: {
      type: "fold";
      title?: string;
      children: RootContent[];
    };
  }

  interface PhrasingContentMap {
    embed: {
      type: "embed";
      provider: "youtube" | "bilibili";
      id: string;
      width?: number;
      aspect?: EmbedAspect;
    };
    highlight: {
      type: "highlight";
      children: unknown[];
    };
    kbd: {
      type: "kbd";
      children: unknown[];
    };
    badge: {
      type: "badge";
      children: unknown[];
    };
  }
}

declare module "hast" {
  interface ElementData {
    provider?: string;
    id?: string;
    width?: number;
    aspect?: EmbedAspect;
    kind?: string;
    title?: string;
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "rvl-embed": any;
      "rvl-callout": any;
      "rvl-fold": any;
    }
  }
}
