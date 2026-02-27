---
title: SSH 入門筆記
summary: 理解 SSH：它是安全通道，不只是遠端 Shell
category: guide
tags: [beginner]
---

## 什麼是 SSH

SSH 全稱是 Secure Shell ，是一條安全通道，讓你可以在網路上做以下事情：

- 遠端登入執行指令
- 傳送檔案
- 建立隧道
- 讓其他協議走 SSH 通道

SSH 不只是登入主機

## SSH 基本

你會常常到的形式：

```bash
ssh ubuntu@10.0.0.5
ssh user@example.com
```

- `user`: 遠端主機上的使用者
- `host`: IP or 網域
- 預設 port 是 `22`

指定 port ：

```bash
ssh -p 2222 user@host
```

SSH 大致流程是這樣：

1. 用 SSH 客戶端發起連線 (終端機、PuTTY ......)  
2. 伺服器提供 **host public key (主機公鑰)**，client 會用它做主機身分驗證 (對應 `known_hosts` 的指紋)，並在握手期間透過金鑰交換 (key exchange, KEX，例如 ECDH) 協商出 session keys 來加密後續通訊  
3. 驗證身份 (輸入密碼或使用金鑰)  
4. 驗證成功後，就像坐在遠端主機前面一樣執行指令

## SSH 常見的驗證方式

SSH 常見兩種驗證方式，大家多半會推金鑰。

### 密碼登入 (password authentication)

連線後輸入遠端帳號密碼即可登入

原理上密碼是走 SSH 已建立的加密通道送出，伺服器端用它來比對帳號密碼是否正確

缺點：

- 容易被爆破
- 不方便自動化

### 金鑰登入 (public key authentication)

你本機有私鑰 (private key)，遠端主機有公鑰 (public key) 放在 `~/.ssh/authorized_keys`

連線時伺服器會發出一段隨機挑戰 (challenge)，你用私鑰簽名回去而伺服器用公鑰驗證簽名

重點是**私鑰不會離開本機**，只送出簽名結果，密碼也不需要傳

好處：

- 更安全
- 自動化 / CI / 遠端開發更順

## SSH Key

SSH Key 來自**非對稱加密**，一組 key 會有兩把：

- 公鑰 (public key)：放在遠端主機
- 私鑰 (private key)：留在本機，絕對不能外流

這套機制的安全性不是來自「公鑰 → 私鑰」的可逆性，而是來自計算複雜度假設 (computational hardness assumptions)： 

在目前已知的最佳攻擊下，想從公鑰推導私鑰等同於解某些計算上不可行 (computationally infeasible)的困難問題

- RSA：對應到大數質因數分解的困難性  
- Ed25519 / ECDSA（橢圓曲線）：對應到橢圓曲線離散對數問題的困難性

因此只要私鑰不外洩，攻擊者即使完全知道公鑰，也無法在可行時間內偽造你的簽章  
更形式化地說，簽章系統希望滿足 **EUF-CMA**（Existential Unforgeability under Chosen-Message Attack）

為了降低風險，建議每個用途或服務都用不同的 key  
例如工作 / 私人 / 部署用分開

### SSH Key 種類

- `rsa`：相容性高，但要足夠長度才安全
- `dsa`：已淘汰，別用
- `ecdsa`：比 RSA 小又快，基於橢圓曲線
- `ed25519`：新、快、安全，推薦
- `ecdsa-sk` / `ed25519-sk`：搭配硬體金鑰 (FIDO/U2F)

### 生成 SSH Key

Linux or macOS：

```bash
ssh-keygen -t ed25519 -C "your_email@example.com"
```

預設會產生：

- 私鑰：`~/.ssh/id_ed25519`
- 公鑰：`~/.ssh/id_ed25519.pub`

Windows (PowerShell)：

```powershell
ssh-keygen -t ed25519 -C "your_email@example.com"
type $env:USERPROFILE\.ssh\id_ed25519.pub
```

建議設定 passphrase 來保護私鑰

## 自訂檔名與命名規則

同一台機器可能會有多把 key，建議用清楚的命名

```bash
ssh-keygen -t ed25519 -f ~/.ssh/id_work_github -C "your-email@example.com id_work_github"
```

- `-t`：指定 key 類型
- `-f`：指定檔名
- `-C`：寫 comment (建議寫用途)

命名規則建議：

`id_<purpose>[_<service>]_<scope|hostname>[_<username>]`

例子：

- `id_work_github`
- `id_deploy_webserver_root`

## 把公鑰放到遠端主機

方法 1：`ssh-copy-id`（Linux 最方便）

```bash
ssh-copy-id user@host
```

方法 2：手動追加到 `~/.ssh/authorized_keys`

```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
nano ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

把 `id_ed25519.pub` 那一整行貼進去
權限很重要，錯了會被 SSH 拒絕用 key

### 指紋驗證

有些平台只顯示公鑰指紋，你可以用這個比對

```bash
ssh-keygen -lf <public-key>
```

### ssh-agent

如果私鑰有 passphrase，`ssh-agent` 可以暫存解鎖狀態
它會幫你完成簽名，私鑰不需要直接給 `ssh` 指令

```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/id_ed25519
```

查看目前載入的 key：

```bash
ssh-add -l
```

### 公鑰驗證流程

假設你執行：

```bash
ssh hyperoot@192.168.x.x
```

大致流程：

1. Client 告訴 Server：「我要用某把公鑰驗證」
2. Server 檢查公鑰是否在 `authorized_keys`
3. Server 送出一次性挑戰 (nonce)
4. Client 用私鑰簽名回去
5. Server 用公鑰驗證簽名，成功就登入

這就是數位簽章的概念：私鑰只用來簽名，不會被送出去

## ~/.ssh/config

把連線參數變成一個名字

```sshconfig
Host g700-ros2
  HostName 10.70.195.143
  User ubuntu
  IdentityFile ~/.ssh/id_ed25519_G700_ROS2
  IdentitiesOnly yes
  ServerAliveInterval 30
  ServerAliveCountMax 3
```

常用選項：

- `Host`：你自己取的別名
- `HostName`：真實 IP / 網域
- `User`：遠端使用者
- `IdentityFile`：指定私鑰檔
- `IdentitiesOnly yes`：只用指定的 key，避免嘗試一堆 key 被拒
- `ServerAliveInterval` / `ServerAliveCountMax`：連線更穩

## Port Forward

Local Forward（遠端服務搬到本機）：

```bash
ssh -L 3000:localhost:3000 user@host
```

Remote Forward（本機服務開給遠端）：

```bash
ssh -R 8000:localhost:8000 user@host
```

SOCKS Proxy（把 SSH 當安全代理）：

```bash
ssh -D 1080 user@host
```

## 疑難排解

### 查看使用的 key

```bash
ssh -v user@host
```

如果嘗試一堆 key 失敗，通常要在 `~/.ssh/config` 加：

```sshconfig
IdentitiesOnly yes
IdentityFile ~/.ssh/你的key
```

GitHub 連線自檢：

```bash
ssh -T git@github.com
```

DNS 問題常見症狀：

- `Could not resolve hostname ...`
- 連線卡住或 timeout

檢查順序：

1. `ping github.com` 或 `nslookup github.com`
2. 校網擋 22 port：改用 HTTPS remote 或走 VPN / ZeroTier
3. 容器 / WSL2：確認 DNS / 代理設定一致

## 安全提醒

- 私鑰不要外流（`id_ed25519` 絕不能貼到網路或進 repo）
- 私鑰權限建議 `chmod 600 ~/.ssh/id_ed25519`
- 公鑰可以公開（廢話）
- 第一次連線會問你要不要信任 host key，別無腦 `yes`
