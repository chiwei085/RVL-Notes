---
title: 什麼是 ONNX
summary: 理解 ONNX 在部署流程中的角色，以及為什麼 YOLO-CPP 以 ONNX 作為模型輸入格式
status: subpage
tags: [onnx, yolo, deployment]
---

在 `YOLO-CPP` 裡，模型輸入通常是 `.onnx`，不是 `.pt`。  
所以在談 API 或 runtime 之前，先把 ONNX 的角色講清楚會比較順。

## ONNX 是什麼

ONNX 可以先把它理解成一種模型交換格式。  
它的重點不是訓練，而是讓模型能用比較標準化的方式被不同部署工具與 runtime 消費。

對這篇來說，只要先抓到一個核心觀念：

- `.pt` 常常比較貼近訓練框架
- `.onnx` 常常比較貼近部署流程

## 為什麼 YOLO-CPP 吃的是 ONNX

`YOLO-CPP` 的定位是 inference runtime。  
它關心的是：

- 如何載入模型
- 如何建立 session
- 如何餵入影像 tensor
- 如何解析輸出

這些事情比較接近部署階段，因此採用 ONNX 會比較合理。

你可以把整條路徑想成：

```text
training/export
  -> ONNX
  -> runtime session
  -> inference result
```

`YOLO-CPP` 主要站在後半段，也就是 ONNX 之後的那個位置。

## ONNX 帶來的好處

對這個 repo 而言，採用 ONNX 至少有幾個直接好處：

- 模型格式和訓練框架解耦
- 比較容易對接 ONNX Runtime 這類部署 runtime
- 讓 C++ 端的 library 專注在推論流程，而不是訓練工具鏈

也因此，repo 裡面會圍繞著模型輸入資訊、session options、execution provider 與 output binding 來設計 API。

## 這不代表 ONNX 解決所有問題

模型轉成 ONNX 之後，還是要面對很多部署層面的細節，例如：

- 輸入尺寸
- color conversion
- tensor layout
- output head 的排列方式
- 後處理與 decode 規則

也就是說，ONNX 只是部署的起點，不是終點。  
`YOLO-CPP` 的價值之一，就是把這些後續工作整理成較一致的使用模型。

## 小結

理解 ONNX 之後，再看 `YOLO-CPP` 就會比較清楚：  
這個庫不是處理訓練，而是處理「拿著一個已經可部署的模型，如何在 C++ 中穩定完成推論」。

如果你手上現在還是 `.pt` 模型，下一頁可以接著看 [[pt-to-onnx]]。
