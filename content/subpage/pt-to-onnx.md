---
title: 從 PT 轉成 ONNX
summary: 整理為什麼部署前常需要先把 Ultralytics 的 PT 模型轉成 ONNX，並簡介 YOLO-CPP 相關的轉換工具脈絡
status: subpage
tags: [onnx, ultralytics, deployment]
---

前一頁提到 `YOLO-CPP` 主要吃的是 `.onnx`。  
但很多人手上真正拿到的第一個模型，通常是 Ultralytics 生態裡的 `.pt`。

因此部署前常會多一個步驟：先把 `.pt` 轉成 `.onnx`。

## 為什麼不是直接吃 PT

原因很單純，因為 `YOLO-CPP` 的定位不是訓練框架的延伸，而是部署用的 C++ runtime。

它的工作是：

- 載入可部署的模型
- 建立推論 session
- 把影像送進去
- 解析模型輸出

所以和它對接的模型格式，自然會偏向部署友善的 ONNX，而不是框架內部更常見的 `.pt`。

## 這個 repo 提到的合作庫

在 `YOLO-CPP` 的 `docs/README.md` 中，有特別提到一個 companion repo：

- `yolo_models_repo`

它的定位就是補上模型轉換這段工作，讓 YOLO 訓練產物可以進一步整理成部署時可使用的 ONNX 資產。

可以把兩者分工理解成：

- `yolo_models_repo`：處理模型轉換與整理
- `YOLO-CPP`：處理 C++ 端的 inference runtime

這樣整體責任會清楚很多。

## 轉換不是只是副檔名改掉

從 `.pt` 到 `.onnx` 不只是檔名換掉而已。  
真正重要的是匯出後的模型輸入輸出契約，有沒有和 runtime 端的預期對得上。

實務上你還是要注意：

- 匯出時的 task 類型
- 輸入尺寸
- opset 與 runtime 相容性
- 輸出 tensor 的排列方式

這也是為什麼 `YOLO-CPP` 後面會需要 adapter 與 binding spec 這類機制，去辨識一個 Ultralytics-style ONNX 模型到底該怎麼被解析。

## 部署流程中的位置

如果把整個流程攤開來看，大致會像這樣：

```text
YOLO training artifact (.pt)
  -> export / convert
  -> ONNX model
  -> YOLO-CPP pipeline
  -> structured inference result
```

把這個流程想清楚之後，很多 API 設計就會變得合理：  
`YOLO-CPP` 關心的，是 ONNX 之後怎麼跑，不是訓練本身。

## 小結

若你的模型來源是 Ultralytics 的 `.pt`，通常先轉成 `.onnx` 才會進入 `YOLO-CPP` 的工作範圍。  
模型轉換與 runtime 執行分成兩個 repo，各自專注自己的責任，整體反而比較乾淨。

接著可以看 [[yolo-cpp-api-overview]]，開始建立這個 library 的 public API 輪廓。
