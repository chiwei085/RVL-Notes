---
title: Office 安裝(ODT)與 NTUT 校內 KMS 啟用筆記
summary: 使用 Office Deployment Tool (ODT) 重新安裝 Office，並在校內網或 VPN 環境下以 NTUT 校園授權的 KMS 腳本完成啟用。
category: guide
tags: [install,windows]
---

## 事前準備

保險起見，請先確保你的電腦能連到學校內網資源：

- 連線 **NTUT 校園 Wi-Fi**，或
- 先連上 **學校 VPN**

> KMS 啟用通常需要在校內網環境下才能成功。

## 先把舊 Office 清掉

如果你的電腦上已經有其他版本(例如 Microsoft 365，或 Office 2016 / 2019 / 2021)，建議先解除安裝，避免殘留元件造成安裝或啟用衝突。

## 下載 Office Deployment Tool (ODT)

到官方網頁下載 ODT：
- https://www.microsoft.com/en-us/download/details.aspx?id=49117

下載後你會拿到一個類似 `officedeploymenttool_19426-20170.exe` 的檔案。

接著準備一個資料夾，例如：
- `C:\ODT`

雙擊 `officedeploymenttool_19426-20170.exe`，它會要求你選擇解壓縮位置：
- 請選 `C:\ODT`

解壓完成後，你應該會在 `C:\ODT` 看到：
- `setup.exe`
- 一份範例 `.xml` 設定檔

## 建立 config.xml

在 `C:\ODT` 新增(或修改)為以下內容，並命名為 `config.xml`：

```xml
<Configuration>
  <Add OfficeClientEdition="64" Channel="PerpetualVL2021">
    <Product ID="ProPlus2021Volume">
      <Language ID="zh-tw" />
    </Product>
  </Add>

  <!-- 如果你之前裝過 MSI 型的 Office，這行可以避免殘留衝突 -->
  <RemoveMSI />

  <!-- 安裝後嘗試自動啟用(仍需要校內網/VPN + KMS) -->
  <Property Name="AUTOACTIVATE" Value="1" />

  <Display Level="Full" AcceptEULA="TRUE" />
</Configuration>
```

## 下載安裝檔 (ODT 下載階段)

用 系統管理員 權限開啟 PowerShell (或 CMD)，切換到 ODT 目錄：

```powershell
cd C:\ODT
```

檢查是否有 `setup.exe` 與 `config.xml`：

```powershell
ls
```

執行下載：

```powershell
.\setup.exe /download .\config.xml
```

這一步可能需要一些時間。完成後，`C:\ODT` 會多出一個 Office 資料夾，代表安裝檔已下載完成。

## 開始安裝

下載完成後，執行安裝：

```powershell
.\setup.exe /configure .\config.xml
```

## 下載並執行 NTUT KMS 啟用

到 NTUT 校園授權軟體的「軟體說明與操作手冊」下載 KMS 啟用工具：

https://csw.ntut.edu.tw/manual

例如下載並解壓縮：

`office_LTSC2024_kms_64bit.zip`

解壓後執行其中的 `.bat` 檔，依指示完成授權/啟用。

## 常見問題

Q: 一定要在校內網路嗎？校外可以嗎？
A: KMS 啟用通常需要連到校內的 KMS 服務。校外請先連學校 VPN ，再執行啟用腳本。

Q: 之前可以啟用, 最近突然跳授權到期或啟用失敗？  
A: 可能是校內 KMS 伺服器或域名有更新，請重新到校園授權軟體網站下載最新的 KMS 認證設定與手冊再操作一次。

Q: 執行啟用出現 "No KMS could be contacted" 或錯誤碼 `0xC004F074`？  
A: 代表用戶端連不到 KMS 服務，通常是網路環境不在校內或未連 VPN, DNS 或防火牆阻擋，或服務不可達。先確認已連校內網或 VPN, 再依 NTUT 手冊重做。

Q: 為什麼建議先移除舊版 Office?  
A: 不同安裝型態 (例如舊的 MSI 型 Office) 可能造成殘留衝突。

## 參考來源

- [Microsoft: Office Deployment Tool 下載頁](https://www.microsoft.com/en-us/download/details.aspx?id=49117)
- [Microsoft Learn: ODT 設定檔](https://learn.microsoft.com/en-us/deployoffice/office-deployment-tool-configuration-options)
- [NTUT 校園授權軟體: 軟體說明與操作手冊](https://csw.ntut.edu.tw/manual)
- [Microsoft Learn: 0xC004F074](https://learn.microsoft.com/en-us/troubleshoot/windows-server/licensing-and-activation/error-0xc004f074-activate-windows)
