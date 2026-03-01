---
title: Docker 安裝與使用筆記
summary: 在 Ubuntu 上安裝 Docker 提供研究用的常見操作、GPU (NVIDIA) 加速容器與疑難排解。
category: guide
tags: [install, ubuntu]
---

## 系統需求

本文僅介紹在 Ubuntu 上安裝並使用 Docker ，以便用於研究

### 支援的 Ubuntu 版本與架構

- Ubuntu LTS：22.04+ (其他版本也可能可用，但以官方支援為準)
- 64-bit CPU：x86_64 (amd64) 或 arm64 等 (Docker 官方有列支援架構)
- 權限：需要 `sudo` 權限來安裝套件與設定服務
- 網路：可連到 Docker 的 apt repository

## 安裝路線選擇

Docker 在 Ubuntu 常見有兩種路線：

1. Docker Engine
   - 乾淨、可控、適合 CLI 與自動化
2. Docker Desktop  
   - 有 GUI、整合較多，但對純研究用途通常不必

本文主軸： Docker Engine + Compose plugin (官方推薦的 Linux Compose 安裝方式)

## 安裝 Docker Engine

1. 移除可能衝突的舊套件

Ubuntu 可能曾經裝過 `docker.io`或容易和 Docker 衝突的套件

```bash
sudo apt update
sudo apt remove -y \
  docker.io docker-compose docker-compose-v2 docker-doc podman-docker \
  containerd runc
```

2. 設定 Docker 官方 apt repository

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg
```

3. 建立 keyrings 目錄

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

4. 匯入 Docker GPG key

```bash
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
  sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
```

5. 加入 apt repository

```bash
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo ${VERSION_CODENAME}) stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
```

6. 安裝 Docker Engine 與常用元件

```bash
sudo apt install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin
```


7. 啟用並檢查服務

```bash
sudo systemctl enable --now docker
systemctl status docker --no-pager
```

8. 驗證安裝成功

```bash
sudo docker run --rm hello-world
```

如果能看到 hello-world 的輸出，代表 engine 正常


## 安裝 Docker Compose plugin

現在官方建議使用 docker compose ... (注意沒有破折號)，而不是舊的 docker-compose

```bash
sudo apt install -y docker-compose-plugin
docker compose version
```

## 讓 Docker 不用每次都用 sudo 指令

1. 加入 docker 群組

```bash
sudo groupadd docker 2>/dev/null || true
sudo usermod -aG docker $USER
```

2. 接著登出再登入 (或重開機) ，讓群組生效

3. 驗證

```bash
docker run --rm hello-world
```

這一步會移除剛剛拉下來的 hello-world ，如果沒報錯便表示設定成功

安全提醒：

> [!warning]
> `docker` 群組基本上等同於 root 級權限  
> 如果你的環境是多使用者共用，請慎用

## 常見 Docker 操作速查

### 基本概念

- Image (映像檔)：環境快照
- Container (容器)：image 跑起來的實例
- Volume (卷)：容器資料持久化 (資料不隨容器刪除而消失)

### 常用指令

| 用途                    | 指令                                      |
| ----------------------- | ----------------------------------------- |
| 看版本                  | `docker version`                          |
| 拉 image                | `docker pull <image>:<tag>`               |
| 跑一個互動 shell        | `docker run --rm -it <image>:<tag> <cmd>` |
| 列出正在跑的容器        | `docker ps`                               |
| 列出所有容器 (含已停止) | `docker ps -a`                            |
| 停止容器                | `docker stop <container>`                 |
| 刪除容器                | `docker rm <container>`                   |
| 列出 images             | `docker images`                           |
| 刪除 image              | `docker rmi <image>`                      |
| 查看 logs               | `docker logs -f <container>`              |

### 把目前專案目錄掛進容器

```bash
docker run --rm -it \
  -v "$PWD:/work" -w /work \
  <image>:<tag> <cmd>
```

你可以在容器內安裝依賴、跑程式；程式碼與輸出仍在主機的 `$PWD`。

### Dockerfile

Dockerfile 是建立 image 的配方    
當把系統套件、依賴與啟動方式寫進去後，便可用 `docker build` 產生可重現的 image

最小範例：

```dockerfile
# build stage
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# runtime stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

nginx:alpine 已內建預設啟動指令，因此此範例不需要額外寫 CMD。

基本流程：

```bash
docker build -t myapp:dev .
docker run --rm -p 8000:80 myapp:dev
# 然後用 http://localhost:8000
```

`.dockerignore` (避免把不必要的東西塞進 image):

```
.git/
node_modules/
dist/
target/
*.log
.env
```

`dist/`、`target/` 是否忽略看你情境：若 build 都在容器內做，建議忽略它們，避免把本機產物塞進 image。

> [!note]
> - 依賴先 COPY 再安裝，可提高快取命中
> - 用 `WORKDIR` 固定工作目錄，避免在指令內到處 cd
> - 開發中若要即時更新程式碼，通常搭配 bind mount

### Docker Compose 

Compose 的核心目標：用一份 YAML 描述**多容器系統**，並且用簡單指令啟動、停止、重建、查看 logs

你會用到的 3 個關鍵概念

- service：一個服務 (通常對應一個 container)
- network：服務之間通訊用的虛擬網路
- volume：需要持久化的資料

Compose 預設就會

- 建一個專用 network
- 讓 service 名稱可以當作 DNS (e.g. db:2486)

範例： `compose.yml`

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://postgres:example@db:2486/postgres
    depends_on:
      - db
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  pgdata:
```

#### 常用指令

| 用途                                        | 指令                             |
| ------------------------------------------- | -------------------------------- |
| 啟動 (前景模式)                             | `docker compose up`              |
| 啟動 (背景模式)                             | `docker compose up -d`           |
| 停止並刪除 containers/network (保留 volume) | `docker compose down`            |
| 連同 volumes 一起刪掉 (資料庫資料會消失！)  | `docker compose down -v`         |
| 查看各服務狀態                              | `docker compose ps`              |
| 看 logs (整個專案)                          | `docker compose logs -f`         |
| 只看某服務 logs                             | `docker compose logs -f db`      |
| 進入某個 service 的 shell                   | `docker compose exec backend sh` |
| 重建 image (Dockerfile 有改時常用)          | `docker compose build`           |
| 重建並重啟 (常用)                           | `docker compose up -d --build`   |
| 停止某個 service                            | `docker compose stop backend`    |
| 重新啟動某個 service                        | `docker compose restart backend` |

#### 完整小專案範例

專案結構：

```
.
├── compose.yml
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── bun.lockb
│   └── ...(前端程式碼)
└── backend/
    ├── Dockerfile
    ├── Cargo.toml
    ├── Cargo.lock
    └── src/
```

frontend/Dockerfile：

```dockerfile
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

backend/Dockerfile (最小 multi-stage)：

注意：binary 名稱要跟你的 crate 名稱一致 (這裡先用 server 當例子)

```dockerfile
FROM rust:1-bookworm AS build
WORKDIR /app

COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo build --release

FROM debian:bookworm-slim
WORKDIR /app
COPY --from=build /app/target/release/server /app/server
EXPOSE 8080
CMD ["/app/server"]
```

compose.yml (三服務最小可跑)：

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://postgres:example@db:2486/postgres
    depends_on:
      - db
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"

volumes:
  pgdata:
```

啟動：

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f
```

#### 檔名與專案名稱

Compose 會預設找 `compose.yaml` / `compose.yml` / `docker-compose.yml`  
專案名稱預設是**資料夾名稱**

你可以用 `-p` 指定專案名稱：

```bash
docker compose -p myproj up -d
docker compose -p myproj down
```

#### Compose 內部如何互連

以前面的範例來說：

在 backend 容器內，DB 主機名不是 localhost，而是 `db`  
也就是說 backend 連線字串應該是：`postgres://postgres:example@db:2486/postgres` (依你的帳密而定)

Postgres image 預設 user/db 都是 postgres，所以連線字串最後那段也是 postgres。

#### `depends_on` 的真相

它只保證**啟動順序**不保證**服務已 ready**    
很多人以為 `depends_on` 會等 DB ready，實際上不會

depends_on 只管啟動順序。如果你的後端啟動時會立刻連 DB、且沒有 retry，才需要 healthcheck / wait。

如果你的 backend 需要等 DB 起來，你通常要加：

- DB 健康檢查
- app 端等待策略

範例 (Postgres healthcheck)：

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 3s
      retries: 20
```

#### 常見開發模式：Dockerfile + build

當你的研究專案需要一堆依賴，你通常會寫 `Dockerfile`

`compose.yml`：

```yaml
services:
  backend:
    build: ./backend
    volumes:
      - ./backend:/work
    working_dir: /work
    command: ["bash", "-lc", "sleep infinity"]
```

這樣你可以：
- `docker compose build` 重建依賴環境
- `docker compose exec backend bash` 進容器做事
- 專案碼依然用 bind mount 保持即時更新

#### Ports vs expose

`ports`：把容器埠映射到主機 (讓你用 `localhost:xxxx` 存取)  
`expose`：只在 Compose 內部可見 (不映射到主機)

例如：

```yaml
services:
  api:
    expose:
      - "8000"      # 只有其他 services 能打到
  web:
    ports:
      - "8080:80"   # 你可用主機 http://localhost:8080 進來
```

#### volumes 的兩種：Named volume vs Bind mount

1. Bind mount

把主機資料夾掛進去 (開發最方便)

```yaml
volumes:
  - ./:/work
```

2. Named volume (資料庫、cache、長期資料建議)  

由 Docker 管理位置，避免你不小心刪掉或改權限

```yaml
volumes:
  - pgdata:/var/lib/postgresql/data
```

查看 volume：

```bash
docker volume ls
docker volume inspect pgdata
```

#### profiles：用一份 compose 檔控制 **可選服務**

profiles 讓你在同一份 `compose.yml` 裡把服務分成 **預設會啟動** 與 **需要時才啟動** 兩類

常見用途：

- dev：本機開發才需要的服務
- gpu：只有在有 GPU 的機器才啟動的服務
- ci：CI 才需要的服務

沒有寫 profiles 的 service：預設就會被 `docker compose up` 啟動  
有寫 profiles 的 service：只有在你指定該 profile 時才會啟動

範例：同一份 `compose.yml`，依情境選擇要不要帶工具 or GPU

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_PASSWORD: example
    volumes:
      - pgdata:/var/lib/postgresql/data

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgres://postgres:example@db:5432/postgres
    depends_on:
      - db
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    depends_on:
      - backend
    ports:
      - "3000:80"

  jupyter:
    image: jupyter/minimal-notebook
    profiles: ["dev"]
    ports:
      - "8888:8888"

  gpu_worker:
    build: ./worker
    profiles: ["gpu"]
    # GPU 相關設定依你的環境而異，這裡先示範用 profile 管理是否啟動
    # 真正要用 GPU，請配合 NVIDIA Container Toolkit 與對應 compose 設定

volumes:
  pgdata:
```

使用方式 (最常用的幾種)

1. 預設啟動 (不含任何 profile 服務)

```bash
docker compose up -d
```

2. 啟動時加上 dev profile (會額外啟動 jupyter)

```bash
docker compose --profile dev up -d
```

3. 同時啟動多個 profiles

```bash
docker compose --profile dev --profile gpu up -d
```

4. 只啟動某個 profile 的服務 (不想動到其他服務時)

```bash
docker compose --profile dev up -d jupyter
```

5. 看目前啟動組合有哪些服務

```bash
docker compose ps
```

> [!note]
> profiles 不會改變相依性，只控制要不要啟動那個 service   
> 例如 jupyter 如果需要 db，你可以在 jupyter 的 service 裡寫 `depends_on: [db]`  
> 但 profiles 不會幫你自動推斷因為你開了 dev，所以 db 也要開；要靠 depends_on 或你啟動指令帶上對應服務

#### 多個 compose 檔疊加

常見做法：
- compose.yml：共用定義
- compose.override.yml：本機開發 override (Compose 會自動讀)
- 或你自己指定 `-f`

```bash
docker compose -f compose.yml -f compose.gpu.yml up -d
```

#### .env：把密碼、路徑、版本抽成變數

`compose.yml`:

```yaml
services:
  db:
    image: postgres:${POSTGRES_VERSION}
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

`.env`:

```txt
POSTGRES_VERSION=16
POSTGRES_PASSWORD=example
```

> 注意！`.env` 不要 commit 密碼到 git

#### 進階：自動重啟與資源限制

restart policy (服務掛掉自動拉起)

```yaml
services:
  worker:
    restart: unless-stopped
```


#### 進階：資源限制

mem_limit 在不同 compose 實作/模式可能支援度不同；遇到不支援以官方 compose-file 文件為準。

```yaml
services:
  app:
    mem_limit: 4g
```

### NVIDIA GPU：容器內使用顯卡

如果你要在容器內跑 CUDA / PyTorch / TensorRT，通常會需要 NVIDIA Container Toolkit。

1. 前置條件

主機已安裝 NVIDIA 驅動，且 `nvidia-smi` 在主機可正常執行

2. 安裝 NVIDIA Container Toolkit

NVIDIA 這塊更新頻繁，請以[官方最新文件](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)為準

安裝完成後，驗證

```bash
docker run --rm --gpus all nvidia/cuda:12.3.2-base-ubuntu22.04 nvidia-smi
```

## 常見問題

### docker: permission denied

用 `sudo docker ...` 先確認 engine 正常

再按上面**加入 docker 群組**設定並重新登入


### apt 裝到 Ubuntu 的 docker.io(版本舊、與官方套件混裝)

先移除衝突套件，再照本文走 Docker 官方 repository 安裝

### Compose 指令找不到

新版是 docker compose

確保安裝 docker-compose-plugin

## 參考資料

- [Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
- [Docker Linux 安裝後設定](https://docs.docker.com/engine/install/linux-postinstall/)
- [Docker Compose plugin(Linux)](https://docs.docker.com/compose/install/linux/)
- [Compose 安裝總覽](https://docs.docker.com/compose/install/)
- [Compose 文件總覽](https://docs.docker.com/compose/)
- [Compose CLI(docker compose 指令)](https://docs.docker.com/reference/cli/docker/compose/)
- [Compose file 規格(services/build/ports/volumes/healthcheck…)](https://docs.docker.com/reference/compose-file/)
- [Compose networking(service name 當 hostname)](https://docs.docker.com/compose/how-tos/networking/)
- [NVIDIA Container Toolkit](https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html)
- [Bun Docker(oven/bun image)](https://bun.sh/docs/installation#docker)
- [Rust 官方 image](https://hub.docker.com/_/rust)
