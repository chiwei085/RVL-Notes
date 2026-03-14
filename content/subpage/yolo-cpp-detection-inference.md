---
title: 用 YOLO-CPP 做 Detection Inference
summary: 從 create_pipeline、ImageView 到 detect，整理 YOLO-CPP 最小可用的 detection 推論流程
status: subpage
tags: [cpp, yolo, onnx]
---

相信很多人都會用 Python 調度 YOLO ，把模型轉成 `.onnx` 可能也清楚怎麼做。

那麼如果手上已經有一個 YOLO 的 `.onnx` 模型，要怎麼在 C++ 裡完成 detection inference 呢？

相信許多人變卡住了。

我在此介紹`YOLO-CPP` ，它在使用概念上非常簡單：

1. 建立 pipeline
2. 準備一張影像對應的 `ImageView`
3. 呼叫 `detect(...)`
4. 取回結構化的 detection result

## 最小使用模型

`YOLO-CPP` 的使用方式刻意收斂得很小，最常見的入口是 `yolo::create_pipeline(...)`。

```cpp
#include "yolo/core/image.hpp"
#include "yolo/facade.hpp"

auto pipeline_result = yolo::create_pipeline(yolo::ModelSpec{
    .path = "yolov8n.onnx",
});

if (!pipeline_result.ok()) {
    yolo::throw_if_error(pipeline_result.error);
}

const auto& pipeline = *pipeline_result.value;
```

這一步做的事情不只是打開模型檔。  
它同時會建立 runtime session、決定 task 對應的推論流程，並整理好之後要重複使用的 pipeline 物件。

## ImageView 是對接邊界

`YOLO-CPP` 不負責幫你讀檔、開相機或處理 GUI。  
它要的只是 `yolo::ImageView`，也就是一個描述影像記憶體的輕量 view。

```cpp
yolo::ImageView image{
    .bytes = pixels,
    .size = yolo::Size2i{width, height},
    .stride_bytes = width * 3,
    .format = yolo::PixelFormat::rgb8,
};
```

這裡反映出這個 library 的邊界很清楚：

- 影像載入是應用程式自己的事
- `YOLO-CPP` 只負責吃進像素 buffer 並完成 inference

這個設計的好處是它不會綁死你的上游來源。  
不管圖片是來自檔案、相機、共享記憶體，還是其他 SDK，最後只要能整理成 `ImageView`，就可以丟進 pipeline。

## 呼叫 detect

建立好 pipeline 與 `ImageView` 之後，剩下就是：

```cpp
const yolo::DetectionResult result = pipeline->detect(image);
if (!result.ok()) {
    yolo::throw_if_error(result.error);
}
```

回傳的 `DetectionResult` 已經是結構化資料，包含：

- `detections`
- `metadata`
- `error`

其中每個 detection 會有：

- `bbox`
- `score`
- `class_id`
- 選擇性的 `label`

也就是說，`YOLO-CPP` 的責任是把模型輸出整理成可直接消費的結果，而不是把結果畫在圖上。

## Pipeline 應該重用

這是整合時最重要的一個觀念之一。

不要每來一張圖就重新 `create_pipeline(...)`。  
pipeline 是比較重的物件，包含模型載入、adapter probe 與 session 建立。正常情況下，應該在初始化階段建立一次，後續對每張圖只建立新的 `ImageView` 再重複呼叫 `detect(...)`。

可以把它想成：

```text
long-lived pipeline
  + many short-lived ImageView inputs
```

這樣才是比較合理的整合方式。

## 結果要怎麼接回應用程式

`YOLO-CPP` 的輸出是推論結果，不是最終業務行為。

因此 detection 回來之後，你的應用程式通常還會做下一步，例如：

- 畫框或輸出示意圖
- 做 tracking
- 轉成你自己的 domain object
- 發送到 logger、訊息匯流排或規則引擎

這也是 `docs/detection_guide.md` 一直在強調的邊界：  
library 應該停在 inference 與 structured result，剩下的應用層行為交給你的系統自己決定。

## 小結

如果只看 detection inference，`YOLO-CPP` 的核心使用模型其實很小：

- 用 `ModelSpec` 建 pipeline
- 用 `ImageView` 對接外部影像資料
- 用 `detect(...)` 拿回 detection result

它刻意不包辦相機、render 與 UI，這反而讓它更適合嵌進既有 C++ 系統。

接著可以看 [[what-is-onnx]]，先把模型格式的背景補齊。
