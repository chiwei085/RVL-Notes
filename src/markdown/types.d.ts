import type {} from "react";

declare module "mdast" {
  interface RootContentMap {
    embed: {
      type: "embed";
      provider: "youtube" | "bilibili";
      id: string;
    };
  }
}

declare module "hast" {
  interface ElementData {
    provider?: string;
    id?: string;
  }
}

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "rvl-embed": any;
    }
  }
}
