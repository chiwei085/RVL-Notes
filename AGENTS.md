# Agent Notes

* 本文件供 AI 使用
* 目標：維持最小改動、最少輸出、避免新增套件

## 常用命令

```bash
bun run dev
bun run build
bun run lint
bun run new-note <type> <slug>
bun run gen-updated
```

## 新建筆記規則

* 檔案路徑：`content/<type>/<slug>.md`（`subpage` 也是 `content/subpage/<slug>.md`）
* `type -> category`：guide/note/project/research 直接作為 category
* `subpage`：不寫 category，寫 `status: subpage`
* `slug` 全站唯一（比對 `content/**/*.md` basename）
* `updated` 由 git 產生（不要手寫）

## 修改原則

* 最小改動、避免新增套件
* 保持 HashRouter/TOC/內鏈 行為不變
* 若需新增規則，優先補充 `AGENTS.md`

## Commit 規則

* commit message 格式：`[type] 做了什麼`

  * 常用 type：`feat` 新功能、`fix` 修 bug、`refactor` 重構不改行為、`docs` 文檔、`chore` 雜項與工具
* 一個 commit 只做一件事，避免把不相關改動混在一起
* 盡量分主題分批 commit，需要時用 `git add -p` 精準分段
* commit 前先確認：`git status`、`git diff --stat`
* 重要變更完成後至少跑一次：`bun run build`
* push 前可快速檢查：`git log --oneline -n 20`
