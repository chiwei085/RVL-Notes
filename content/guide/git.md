---
title: Git 入門筆記
summary: 理解 Git ，一個分散式的內容定址資料庫
category: guide
tags: [beginner]
---

## 什麼是 Git

Git 是一個分散式版本控制系統 (DVCS, Distributed Version Control System)   
它同時也是一個內容定址 (content-addressed) 的物件資料庫：每個版本不是靠檔名或路徑辨識，而是靠內容的雜湊 (hash) 辨識

重要觀念：

> [!note]
> Git 不是同步資料夾  
> 它同步的是 **物件 (objects)** 與 **參照 (ref)**

## Linus 與開源社群的奇蹟

Git 的誕生背景很單純。Linux kernel 的協作需要一個工具，能同時滿足：

- **速度**：大量檔案、頻繁提交、仍要快
- **可擴充**：上千人貢獻、分散式協作
- **完整性 (integrity)**：內容不能被悄悄竄改
- **可離線**：每個人本機都要完整做版本管理，不依賴中央伺服器

因此 Git 走向一個核心設計哲學：

- 把版本做成不可變 (immutable) 的物件
- 用 hash 讓物件彼此串起來形成歷史
- 把分支做成可移動的參照，而不是昂貴的拷貝

## Git 的資料模型

你只要搞懂 Git 其實只有兩樣東西：

1. 物件 (objects)：內容本體 (不可變)
2. 參照 (ref)：指向某個物件的名字 (可變、可移動)

### Git 物件類型

Git 內部主要有四種物件：

- blob：檔案內容 (只看內容，不管檔名)
- tree：目錄 (把 **檔名 -> blob/tree** 的對應存起來)
- commit：一次提交 (指向一個 tree，並指向 parent commit，外加作者/時間/訊息)
- tag (annotated)：可簽章的標記 (常用來標版本)

直覺結構像這樣：

```txt
commit ──> tree ──> (tree / blob ...)
│
└──> parent commit ──> ...
```

因此一個 commit 等於：**某一瞬間的整棵檔案樹快照 (snapshot) + 連到上一個 commit 的鏈結**。  
概念上是 snapshot，但儲存實作會做 delta 壓縮 (packfile)。

## Hash 與完整性

每個 Git 物件都有一個雜湊 ID (傳統上稱 SHA-1；新版 Git 也支援 SHA-256)。  
這個 ID 是由物件內容計算而來，因此：

- 內容變了 -> hash 就變
- commit object 的內容包含對 tree 與 parent 的 object id 參照  
  -> 因此形成 hash chain，歷史鏈結會一起變

這帶來兩個效果：

1. 內容定址 (content-addressing)：以 hash 找內容
2. 完整性 (integrity)：任何竄改都會破壞 hash 鏈結

## Working Tree, Index, Repository

Git 的日常操作可以用三個區域理解：

1. Working Tree (工作目錄)：你看到的檔案
2. Index / Staging Area (暫存區)：你準備要提交的快照
3. Repository (.git 物件庫)：真正的 commits/trees/blobs

對應指令：

- `git add`：Working Tree -> Index
- `git commit`：Index -> Repository (生成 commit)
- `git restore` / `git checkout`：把內容從某個 commit/tree 還原到工作目錄/暫存區

> [!note]
> commit 不是把現在資料夾打包；commit 是把 **Index 裡的內容** 固化成新 commit。

## 分支 (branch) 其實只是參照

很多人以為分支是一份拷貝。其實不是。

- **branch = 參照 (ref, reference)**
- 參照只是一個名字，指向某個 commit hash

因此：

- 建分支幾乎是 O(1)
- 切分支是把 HEAD 指到另一個參照

### HEAD 是什麼

- `HEAD`：你目前站在哪裡的參照
- 常見狀態：
  - `HEAD -> main` (正常：HEAD 指向一個分支參照)
  - `detached HEAD` (你直接 checkout 到某個 commit，HEAD 不指向分支)

## merge & rebase

### Merge：保留分歧歷史，用一個 merge commit 合流

- 優點：歷史忠實呈現
- 缺點：圖可能變複雜

### Rebase：重寫你的分支從哪裡長出來

- 做法：把你的一串 commits 重新套到另一個 base 上
- 優點：線性、乾淨
- 缺點：**會改 commit hash (因為 parent 改了)**

使用準則：

- PR 合併到 main：用 merge 或 squash (依團隊規範)
- 同步上游：本地分支用 rebase 保持線性 (但不要重寫 shared history)

因此 rebase 的鐵則：

**不要 rebase 已經推上去、別人可能基於它工作的 shared history**  
(除非你知道自己在做什麼，而且團隊規範允許 force push)

## remote

Git 是分散式：你的本機 repo 本來就完整。  
所謂 remote，只是你替另一個 repo 取的名字 (例如 `origin`)

```bash
git remote -v
```

你可能看到：

- SSH：`git@github.com:owner/repo.git`
- HTTPS：`https://github.com/owner/repo.git`

remote 不是 GitHub 專用，任何能提供 Git 傳輸協議的地方都能當 remote。  
看到 `git@github.com` 時，表示 remote 使用 SSH transport

更多請參考 [[ssh]]

## fetch, pull, push

Git 交換的不是檔案同步，而是：

- 物件 (commits/trees/blobs)
- 參照 (branch/tag)

### fetch

從遠端抓回你本機沒有的物件  
更新你的 remote-tracking 參照 (例如 `origin/main`)  
不會改你的工作目錄

### pull

pull = fetch + integrate  
integrate 可能是 merge 或 rebase (看你的設定)  
會影響你的當前分支

### push

把你本機有、遠端沒有的物件送上去  
更新遠端的參照 (例如把遠端 main 指到新 commit)

## GitHub 

GitHub 的核心價值不是讓你能用 Git  
(你不用 GitHub 也能用 Git)，而是提供：

- Pull Request / code review
- Issues / Projects
- Actions (CI/CD)
- 權限控管、分支保護、審核流程

GitHub = hosting + collaboration workflow (PR / CI / permissions)  
Git = data model + local history manipulation  

## 操作與指令

操作型教學與指令整理放在 [[git-cheatsheet]]

## 常見迷思

### Git 會把整個資料夾複製一份

commit 是快照概念 (snapshot)，Git 用物件與 delta 壓縮存

### branch 很重  

branch 只是參照

### rebase 只是換個排序  

rebase 會重寫 commit (hash 變)，影響 shared history

### GitHub 等於 Git

GitHub 是協作平台；Git 是工具與資料模型  
除了 GitHub 還有其他平台

## 參考資料

- [Pro Git 書](https://git-scm.com/book/en/v2)
- [Git Reference](https://git-scm.com/docs)
- [gitrevisions](https://git-scm.com/docs/gitrevisions)
- [gitattributes](https://git-scm.com/docs/gitattributes)
- [GitHub: About SSH](https://docs.github.com/en/authentication/connecting-to-github-with-ssh/about-ssh)
