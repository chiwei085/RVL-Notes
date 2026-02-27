---
title: WSL2 安裝筆記
summary: 在 Windows 10/11 上啟用並安裝 WSL2 (Ubuntu)
category: guide
tags: [install, windows, ubuntu]
---

## 系統需求

- **作業系統**
  - Windows 11 或 Windows 10 (建議 21H2 以上)
- 硬體
  - 64-bit CPU
- BIOS/UEFI
  - 必須啟用虛擬化（Intel VT-x / AMD-V）
- Windows 需要啟用
  - Windows Subsystem for Linux
  - Virtual Machine Platform

## 安裝步驟

1. 先啟用 Windows Subsystem for Linux

用系統管理員開 PowerShell，執行：

```powershell
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
```

2. 確認 WSL2 的系統需求

- Windows 11 或 Windows 10
  - x64：1903 以上，Build 18362.1049 以上
  - ARM64：2004 以上，Build 19041 以上

檢查版本：按 `Win + R`，輸入 `winver`。版本太舊請先用 Windows Update 升級。

> Build < 18362 不支援 WSL2  
> Windows 10 1903/1909 需要 Build 18362.1049+ / 18363.1049+

3. 啟用 Virtual Machine Platform

用系統管理員開 PowerShell，執行：

```powershell
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
```

完成後重開機。

4. 用系統管理員開 PowerShell

```powershell
wsl --install
```

第一次啟動 Ubuntu 會讓你設定 Linux 的使用者名稱與密碼。

> 如果想要指定發行版，例如說 Ubuntu 22.04  
> 使用 `wsl --install -d Ubuntu-22.04` ，安裝其他 distro 同理

1. 確認 WSL 版本與發行狀態

```powershell
wsl --status
wsl -l -v
```
6. 設定預設為 WSL2

```powershel
wsl --set-default-version 2
```

7. 進入 WSL

```powershell
wsl
```

或指定發行版：

```powershell
wsl -d Ubuntu-22.04
```

## 常見問題

### `wsl --install` 顯示不支援

Windows 版本太舊了

### WSL 網路怪怪的、DNS 解析失敗 (apt update 失敗)

常見解法：

1. 先重啟 WSL：

```bash
wsl --shutdown
```

2. 進入 Ubuntu 後測試 DNS：

```bash
ping -c 1 google.com
```

3. 若仍失敗，可嘗試關閉自動生成 resolv.conf，改成手動 DNS：

```bash
sudo tee /etc/wsl.conf >/dev/null <<'EOF'
[network]
generateResolvConf=false
EOF

sudo rm -f /etc/resolv.conf
sudo tee /etc/resolv.conf >/dev/null <<'EOF'
nameserver 1.1.1.1
nameserver 8.8.8.8
EOF
```

然後在 Windows：

```powershel
wsl --shutdown
```

### 想重設 or 移除某個發行版

列出發行版

```powershell
wsl -l
```

解除安裝 (會刪除該發行版所有資料)

```powershel
wsl --unregister Ubuntu-22.04
```

## 參考資料

- [WSL 官方文件](https://learn.microsoft.com/en-us/windows/wsl/install-manual)
