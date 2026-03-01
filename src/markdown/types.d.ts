import type { Element } from "hast";
import type { Root } from "mdast";
import type { ComponentType } from "react";

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

declare module "react-markdown" {
  interface Components {
    "rvl-embed"?: ComponentType<any>;
  }
}
