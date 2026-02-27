---
title: Git 操作速查
summary: 常用指令與基本流程
status: subpage
tags: [beginner]
---

概念與模型請先看 [[git]]。

## 實用的指令

| 用途                         | 指令                                         |
| ---------------------------- | -------------------------------------------- |
| 看目前分支與狀態             | `git status -sb`                             |
| 看提交圖 (分支/合流一眼看懂) | `git log --oneline --decorate --graph -n 20` |
| 看有哪些參照 (本地/遠端)     | `git branch -vv`                             |
| 看 remote 設定               | `git remote -v`                              |
| 看某個 commit / tag 改了什麼 | `git show <參照>`                            |
| 看工作目錄與暫存區差異       | `git diff`                                   |
| 看暫存區與最後一次提交差異   | `git diff --staged`                          |

## 基本設定

以下會全域設定：

```bash
git config --global user.name "Your Name"
git config --global user.email you@yourdomain.example.com
```

如果想個別 working tree 一份設定，在路徑上使用不加 `--global` 的指令。

需要看指令說明：

```bash
man git-log
# or
git help log
```

## 一個最小流程：init -> add -> commit

```bash
git init
git add .
git commit
```

重點：`git add` 是把內容快照放進 Index，不是只給新檔案用。  
`git commit -a` 會自動加入已追蹤檔案的修改 (不含新檔)。

## 分支切換與合併

```bash
git branch <branch>
git switch <branch>
```

回到主分支 (main 或 master)：

```bash
git switch main
```

改名分支，例如把 master 改成 main：

```bash
git branch -m main
```

合併分支：

```bash
git merge <branch>
```

刪除分支：

```bash
git branch -d <branch>
```
