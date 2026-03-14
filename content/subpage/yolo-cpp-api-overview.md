---
title: YOLO-CPP API Overview
summary: 從 public API 的角度快速理解 YOLO-CPP 的核心型別、pipeline facade 與進階 adapter 介面
status: subpage
tags: [cpp, api, yolo]
---

`YOLO-CPP` 的 public API 大致可以分成三層。

## 第一層：基礎型別

這一層主要是一些共用資料型別，像是：

- `ModelSpec`
- `ImageView`
- `SessionOptions`
- `TensorInfo`
- `InferenceMetadata`
- `Result<T>` / `Error`

這些型別描述的是推論流程中的共通資訊：

- 模型是什麼
- 輸入影像怎麼表示
- runtime session 怎麼配置
- 輸出 tensor 長什麼樣
- 錯誤怎麼回傳

這一層不直接做 detection，但它奠定了整個 API 的語言。

## 第二層：task 與 pipeline 介面

這一層是大多數應用程式真正會接觸到的主角。

如果只看 detect，可以注意：

- `DetectionOptions`
- `Detection`
- `DetectionResult`
- `create_detector(...)`

如果想用統一入口，則可以看：

- `Pipeline`
- `PipelineOptions`
- `create_pipeline(...)`

其中 `Pipeline` 很重要，因為它把多任務的入口收斂到同一個 facade：

- `detect(...)`
- `classify(...)`
- `segment(...)`
- `estimate_pose(...)`
- `detect_obb(...)`
- `run_raw(...)`

如果你的應用希望持有一個長生命週期的推論物件，`Pipeline` 會是很自然的選擇。

## 第三層：Ultralytics adapter API

這一層屬於比較進階的 public API。

repo 裡有一個 `yolo::adapters::ultralytics` namespace，裡面暴露的是和 Ultralytics-style ONNX 模型有關的 probing 與 binding 資訊，例如：

- `AdapterBindingSpec`
- `DetectionBindingSpec`
- `OutputBinding`
- 各種 `probe_*` 函數

這一層的用途不是給所有使用者每天直接呼叫，而是當你想知道：

- 這個模型輸出到底怎麼排列
- 這個 task 的輸出契約是什麼
- adapter 幫你推得出哪些 binding metadata

這時候它就很有價值。

## 不要把 detail 當成 public API

雖然你在原始碼樹裡看得到 `include/yolo/detail/*` ，但閱讀與使用時應該把它們當成 non-public implementation detail。

比較穩的閱讀順序應該是：

1. `core/*`
2. `tasks/*`
3. `facade.hpp`
4. `adapters/ultralytics.hpp`
5. 最後才是 `detail/*`

## 小結

如果只抓重點，`YOLO-CPP` 的 public API 可以理解成三層：

- 基礎資料型別
- task 與 pipeline facade
- 進階的 Ultralytics adapter introspection

下一頁 [[yolo-cpp-how-it-connects-yolo]] 會進一步整理：這些型別與抽象，實際上是怎麼把一個 YOLO 模型接進 C++ 推論流程裡。
