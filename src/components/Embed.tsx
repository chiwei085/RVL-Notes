import { useMemo } from "react";

export type EmbedProvider = "youtube" | "bilibili";

export type EmbedProps = {
  provider: EmbedProvider;
  id: string;
  title?: string;
  width?: number;
  aspect?: "16:9" | "4:3" | "1:1";
};

function youtubeSrc(id: string) {
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`;
}

function bilibiliSrc(id: string) {
  if (id.startsWith("BV")) {
    return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}`;
  }
  if (id.startsWith("av")) {
    return `https://player.bilibili.com/player.html?aid=${encodeURIComponent(id.slice(2))}`;
  }
  return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(id)}`;
}

export default function Embed({ provider, id, title, width, aspect }: EmbedProps) {
  const src = useMemo(() => {
    if (provider === "youtube") return youtubeSrc(id);
    return bilibiliSrc(id);
  }, [provider, id]);

  const safeTitle =
    title || (provider === "youtube" ? "YouTube video player" : "BiliBili player");
  const containerStyle = width ? { maxWidth: `${width}px` } : undefined;
  const paddingTop =
    aspect === "4:3" ? "75%" : aspect === "1:1" ? "100%" : "56.25%";

  return (
    <div className={`embed embed-${provider}`} style={containerStyle}>
      <div className="embed-frame" style={{ paddingTop }}>
        <iframe
          src={src}
          title={safeTitle}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </div>
  );
}
