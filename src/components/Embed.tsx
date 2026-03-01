import { useMemo } from "react";

export type EmbedProvider = "youtube" | "bilibili";

export type EmbedProps = {
  provider: EmbedProvider;
  id: string;
  title?: string;
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

export default function Embed({ provider, id, title }: EmbedProps) {
  const src = useMemo(() => {
    if (provider === "youtube") return youtubeSrc(id);
    return bilibiliSrc(id);
  }, [provider, id]);

  const safeTitle =
    title || (provider === "youtube" ? "YouTube video player" : "BiliBili player");

  return (
    <div className={`embed embed-${provider}`}>
      <div className="embed-frame">
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
