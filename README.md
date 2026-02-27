# RVL-Notes

![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-enabled-2ea44f)
![Built with Bun](https://img.shields.io/badge/Built%20with-bun-f9f1e1)
![Vite](https://img.shields.io/badge/Vite-7.x-646cff)
![React](https://img.shields.io/badge/React-19-61dafb)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6)
![License](https://img.shields.io/badge/License-MIT-informational)

RVL-Notes 是一個筆記知識庫網站，使用 GitHub Pages 發佈。內容以 Markdown 為主，並提供例如標籤與分類篩選、站內搜尋、目錄導覽與段落分享連結。

## Features

- GitHub Pages 靜態部署
- Markdown 渲染，支援 GFM
- Obsidian 風格內部連結 `[[slug]]`

## Getting Started

### Prerequisites

- Bun

安裝 Bun 的方式請參考官方文件: [https://bun.sh](https://bun.sh)

### Clone

```bash
git clone https://github.com/chiwei085/RVL-Notes.git
cd RVL-Notes
```

### Install dependencies

```bash
bun install
```

### Run dev server

```bash
bun run dev
```

啟動後在瀏覽器開啟終端機輸出的網址。

### Build

```bash
bun run build
```

build 之前會自動執行 `gen-updated`，用 git 記錄生成 `updated` 時間。

## Writing Notes

筆記放在 `content/` 下，使用 Markdown 檔案。slug 由檔名決定。

```text
content/
  guide/
  note/
  project/
  research/
  subpage/
```

### 內部連結語法

- `[[rustdesk]]` 會連到 `/#/note/rustdesk`

### 段落分享連結

- 文章內標題 hover 會出現 🔗，可複製 `/#/note/<slug>?section=<headingId>`

## Scripts

- `bun run dev` 開發模式
- `bun run build` 建置
- `bun run lint` 靜態檢查
- `bun run gen-updated` 生成 `updated` 對照表
- `bun run new-note <type> <slug>` 建立新筆記模板

## Contributing

歡迎提交 PR。

### Workflow

- fork repo
- 建立分支
- 修改內容
- 確認能跑起來
- 提交 PR

建議在提交前跑一次

```bash
bun run lint
bun run build
```

### Notes contribution rules

- 新增筆記放在 `content/<type>/` 下
- slug 使用小寫與 `-` 或 `_`
- slug 需全站唯一
- 避免手寫 `updated`
- 若是延伸頁，使用 `status: subpage`，並放在 `content/subpage/`

## License

MIT. See `LICENSE`.
