---
title: RustDesk 安裝筆記
summary: 記錄 RustDesk 在 Windows 與 Ubuntu 的安裝與 systemd 設定。
category: guide
tags: [install, windows, ubuntu]
---

## RustDesk 簡介

RustDesk 是一套開源的遠端桌面工具

## 系統需求

- 作業系統：Windows 10/11、Ubuntu 建議 20.04+
- 硬體要求：一般電腦即可
- 其他依賴項目：無

## 安裝步驟

### Windows

這邊舉例幾個安裝方法
#### 方法 1: `winget` (推薦)

使用系統管理員權限開啟 PowerShell (or cmd)

```powershell
winget install -e --id RustDesk.RustDesk
```

#### 方法 2: 去 Github 下載

1. 打開 RustDesk 的 [Github Releases Page](https://github.com/rustdesk/rustdesk/releases)
2. 下載 Windows 安裝檔 (MSI) 之後安裝即可

### Ubuntu

#### 方法 1: 去 Github 下載

1. 去 Github 下載符合電腦架構的最新 deb ，可以打開瀏覽器下載或是參考以下指令

```bash
cd /tmp # (optional, you can choose own prefer dir, e.g. ~/Downloads)

ARCH="$(dpkg --print-architecture)"

URL="$(
  curl -fsSL https://api.github.com/repos/rustdesk/rustdesk/releases/latest \
  | grep -Eo 'https://[^"]+\.deb' \
  | grep -E "${ARCH}\.deb$" \
  | head -n 1
)"

curl -fL -o rustdesk-latest.deb "$URL"
```

2. 安裝

```bash
sudo dpkg -i ./rustdesk-latest.deb
```

3. 補依賴

若 dpkg 報依賴錯誤，執行 FAQ 的 `apt --fix-broken install` 修復

#### 方法 2: Build from source (不推薦)

> 不推薦原因：需要一推編譯依賴，耗時且容器踩版本相依問題
> RustDesk 桌面版 GUI 有 Flutter(主流) 與 Sciter (較舊、文件完整)；官方文件目前主要提供 Sciter 的 build 步驟，Flutter 版請參考 CI

##### 方案 A：Sciter 版

1. 安裝依賴

```bash
sudo apt update
sudo apt install -y \
  build-essential git curl wget unzip zip \
  nasm yasm cmake clang \
  libgtk-3-dev \
  libxcb-randr0-dev libxcb-shape0-dev libxcb-xfixes0-dev \
  libxdo-dev libxfixes-dev \
  libasound2-dev libpulse-dev
```

2. 安裝 Rust 工具鏈

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

3. 安裝 vcpkg (拉依賴)

```bash
cd ~
git clone --recurse-submodules https://github.com/microsoft/vcpkg
cd vcpkg
git checkout 2023.10.19
cd ..
~/vcpkg/bootstrap-vcpkg.sh
export VCPKG_ROOT="$HOME/vcpkg"
"$VCPKG_ROOT/vcpkg" install --x-install-root="$VCPKG_ROOT/installed"
```

4. Clone rustdesk + 放 Sciter 動態庫

```bash
cd ~
git clone --recurse-submodules https://github.com/rustdesk/rustdesk
cd rustdesk

mkdir -p target/debug
wget https://raw.githubusercontent.com/c-smile/sciter-sdk/master/bin.lnx/x64/libsciter-gtk.so
mv libsciter-gtk.so target/debug/
```

5. 編譯並執行

```bash
cargo run
```

6. 如果找不到 libsciter-gtk.so , 需要你把檔案放到它期待的位置

##### 方案 B：Flutter 版

1. 安裝依賴

```bash
sudo apt update
sudo apt install -y \
  build-essential git curl wget unzip zip \
  python3 python3-pip pkg-config \
  clang cmake ninja-build libclang-dev \
  libgtk-3-dev \
  libpam0g-dev libunwind-dev \
  libasound2-dev libpulse-dev \
  libgstreamer1.0-dev libgstreamer-plugins-base1.0-dev \
  libva-dev libvdpau-dev \
  libxcb-randr0-dev libxcb-shape0-dev libxcb-xfixes0-dev \
  libxdo-dev libxfixes-dev \
  nasm yasm
```

2. 安裝 Rust (建議用 rustup，並切到 CI 常用版本)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"

# 建議跟 CI：1.75
rustup toolchain install 1.75.0
rustup default 1.75.0
rustup component add rustfmt
```

3. 安裝 Flutter (建議固定 CI 用的版本)

```bash
# 你也可以放其他位置
mkdir -p ~/sdk && cd ~/sdk

wget -O flutter.tar.xz "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_3.24.5-stable.tar.xz"

tar -xf flutter.tar.xz
echo 'export PATH="$HOME/sdk/flutter/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

flutter --disable-analytics
dart --disable-analytics
flutter doctor -v
```

4. 安裝 vcpkg

```bash
cd ~
git clone --recurse-submodules https://github.com/microsoft/vcpkg
cd vcpkg
git checkout 120deac3062162151622ca4860575a33844ba10b
cd ..
~/vcpkg/bootstrap-vcpkg.sh

export VCPKG_ROOT="$HOME/vcpkg"
echo 'export VCPKG_ROOT="$HOME/vcpkg"' >> ~/.bashrc
source ~/.bashrc

# 讓 vcpkg 依 vcpkg.json 安裝
"$VCPKG_ROOT/vcpkg" install --x-install-root="$VCPKG_ROOT/installed"
```

5. Clone rustdesk

```bash
cd ~
git clone --recurse-submodules https://github.com/rustdesk/rustdesk
cd rustdesk
```

6. flutter_rust_bridge

CI 的 bridge 流程包含：

- 安裝 `flutter_rust_bridge_codegen` (版本 1.80.1)
- `flutter pub get` 前對 `pubspec.yaml` 做一個小 patch
- 產生 `generated_bridge.dart` 等檔案

```bash
cargo install cargo-expand --version 1.0.95 --locked
cargo install flutter_rust_bridge_codegen --version "1.80.1" --features "uuid" --locked

# Flutter dependencies
pushd flutter
sed -i -e 's/extended_text: 14.0.0/extended_text: 13.0.0/g' pubspec.yaml
flutter pub get
popd

~/.cargo/bin/flutter_rust_bridge_codegen \
  --rust-input ./src/flutter_ffi.rs \
  --dart-output ./flutter/lib/generated_bridge.dart \
  --c-output ./flutter/macos/Runner/bridge_generated.h
```

7. build

```bash
python3 build.py --flutter --release
```

若你要硬體編解碼 (通常跟編碼能力有關)，可加：  

`python3 build.py --flutter --release --hwcodec`

## 背景常駐

以下提供在 Ubuntu 如何將 RustDesk 開機自動背景常駐，不怕誤關視窗導致斷線

通常使用上述方式下載 `.deb` 並安裝，會一起裝好 systemd service

1. 確認服務是否存在

```bash
systemctl status rustdesk.service --no-pager
```

2. 加入服務

```bash
sudo systemctl enable --now rustdesk.service
```

3. 驗證

```bash
systemctl status rustdesk.service
```

如此一來

- 開機便會啟動服務
- 即便關閉 RustDesk 視窗，甚至沒開 GUI ，也不影響背景服務

### 如果前面選擇 build from source

不管 Sciter 或 Flutter，建議先把可執行檔與 runtime 需要的檔案整理到固定路徑，讓 systemd 好管理。

1. 把 build 產物放到固定位置 (e.g. `/opt/rustdesk`)

```bash
sudo mkdir -p /opt/rustdesk  
```

2. 建立 systemd service

建立 `/etc/systemd/system/rustdesk.service`：

```txt
[Unit]
Description=RustDesk (source build)
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
# 依你實際安裝的位置調整
WorkingDirectory=/opt/rustdesk
ExecStart=/opt/rustdesk/rustdesk
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

套用並啟動：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now rustdesk.service
systemctl status rustdesk.service --no-pager
```

3. 方案 A 與方案 B 的差異

Sciter 版常見狀況是 runtime 需要 `libsciter-gtk.so`，而且程式會在某些路徑找它

建議做法：

1. 把你 build 出來的 `rustdesk` 可執行檔複製到 `/opt/rustdesk/`
2. 把 `libsciter-gtk.so` 也放在同一個目錄 `/opt/rustdesk/`

```bash
# 假設你 cargo build --release 後 binary 在 target/release/rustdesk
sudo cp -f ~/rustdesk/target/release/rustdesk /opt/rustdesk/rustdesk
sudo cp -f ~/rustdesk/target/release/libsciter-gtk.so /opt/rustdesk/ 2>/dev/null || true
sudo cp -f ~/rustdesk/target/debug/libsciter-gtk.so /opt/rustdesk/ 2>/dev/null || true
```

然後把 service 那塊多加一行環境變數，確保能找到動態庫：

```txt
Environment=LD_LIBRARY_PATH=/opt/rustdesk
```

---

Flutter desktop 的產物通常是一個 bundle 目錄 (裡面包含可執行檔、`lib/`、資料檔等)
這種情況最常踩的坑是：**你如果只複製單一可執行檔**，它可能找不到旁邊的資源或動態庫

建議做法：

1. 把整個 release bundle 目錄原封不動複製到 `/opt/rustdesk/`
2. `WorkingDirectory` 一定要指到 bundle 目錄    

範例：

```bash
sudo rm -rf /opt/rustdesk/*
sudo cp -a ~/rustdesk/flutter/build/linux/x64/release/bundle/* /opt/rustdesk/
```

Flutter 版的 service 那塊建議長這樣：

```txt
[Service]
WorkingDirectory=/opt/rustdesk
ExecStart=/opt/rustdesk/rustdesk
Restart=always
RestartSec=3
```
## 常見問題

- dpkg 報錯缺套件屬於正常現象，執行指令補上即可完成安裝

```bash
sudo apt --fix-broken install
```

- Ubuntu 版本建議以 20.04 LTS 以上。Ubuntu 18.04 雖然可能可用，但比較容易遇到依賴或音訊、pipewire 相關問題
## 參考資料

- [RustDesk Docs — Client](https://rustdesk.com/docs/en/client/)    
- [RustDesk Docs — Dev: Build on Linux](https://rustdesk.com/docs/en/dev/build/linux/)
- [rustdesk/rustdesk — CLAUDE.md](https://github.com/rustdesk/rustdesk/blob/master/CLAUDE.md)
- [rustdesk/rustdesk workflow](https://github.com/rustdesk/rustdesk/tree/master/.github/workflows)
- [Flutter 官方文件](https://docs.flutter.dev/install/manual)
