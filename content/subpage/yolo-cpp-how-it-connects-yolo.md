---
title: YOLO-CPP 如何對接 YOLO
summary: 從 ModelSpec、ImageView、SessionOptions、Pipeline 與 Ultralytics adapter 來理解 YOLO-CPP 如何把 YOLO 模型接進 C++ 推論流程
status: subpage
tags: [cpp, yolo, onnxruntime]
---

接著我們將要來談談 `YOLO-CPP` 到底是怎麼把一個 YOLO 模型接進 C++ 推論流程。

## 第一步：用 ModelSpec 描述模型

模型入口主要透過 `yolo::ModelSpec`。

它至少會有：

- `path`

另外還可以帶一些補充資訊，例如：

- `task`
- `model_name`
- `adapter`
- `input_size`
- `class_count`
- `labels`

這代表 `YOLO-CPP` 對模型的看法不是只有「一個檔案路徑」，而是「一份推論規格」。

## 第二步：用 ImageView 接收外部影像

影像輸入不是靠某個內建 image loader，而是透過 `yolo::ImageView`。

`ImageView` 主要描述幾件事：

- 影像 bytes
- 寬高
- row stride
- pixel format

這個設計很重要，因為它讓 library 不需要知道你的影像來自哪裡。  
它只關心最後餵進推論的那塊記憶體長什麼樣。

## 第三步：用 SessionOptions 決定 runtime 行為

模型和影像之外，還要有 runtime session 的配置方式，這由 `yolo::SessionOptions` 負責。

這裡面會包含像是：

- thread 數量
- profiling
- memory pattern
- graph optimization level
- execution provider

execution provider 尤其重要，因為它決定你推論時是走：

- `cpu`
- `cuda`
- `tensorrt`

也就是說，`YOLO-CPP` 不只是在做資料型別包裝，它還把部署環境的選項也納進了 public API。

## 第四步：用 Pipeline 收斂推論流程

如果這時候直接去看 `include/yolo/facade.hpp`，你會發現這個 header 其實已經把想給外部使用者的主線交代得很清楚。

### PipelineOptions

一開始先出現的是 `PipelineOptions`，裡面不是一些很抽象的設定，而是很直接地把每個 task 的 option 收進來：

- `detection`
- `classification`
- `segmentation`
- `pose`
- `obb`

### RawOutputTensor 與 RawInferenceResult

這兩個型別很值得注意，因為它們表示 `Pipeline` 並不打算只給你 task-specific 的高階結果。  
如果你需要 debug、驗證模型輸出，或比對 adapter decode 前後的狀態，它也允許你直接拿到 raw tensor。

這個設計很實用，因為實際接 YOLO 時，最麻煩的地方常常就是：

- 模型輸出 shape 跟預期不一樣
- output head 排列方式不同
- decode 結果看起來怪，但你不確定是模型問題還是後處理問題

有 `run_raw(...)` 這條路，就代表它不是把使用者完全鎖在黑盒子外面。

### PipelineInfo

接著會看到 `PipelineInfo`。  
這個型別其實很關鍵，因為它說明 `Pipeline` 不只是「一個可以呼叫 detect 的東西」，它也保留了一份可被查閱的推論描述資訊。

`PipelineInfo` 裡面有：

- `model`
- `inputs`
- `outputs`
- `preprocess`
- `adapter_binding`

這裡可以看出來，建立 pipeline 之後，repo 其實已經把幾件事整理好了：

- 這次到底載入了哪個模型
- runtime 看到的 input / output tensor metadata 是什麼
- 實際採用的 preprocess policy 是什麼
- adapter 最後推導出的 binding spec 是什麼

所以 `Pipeline` 不只是執行器，它也保存了「這條推論管線是怎麼被組起來的」。

### class Pipeline

看到 `class Pipeline` 時，重點反而不是它有虛擬函數，而是它把整個使用模型收得非常集中。

先看建立方式：

```cpp
[[nodiscard]] static Result<std::unique_ptr<Pipeline>> create(
    ModelSpec spec, SessionOptions session = {},
    PipelineOptions options = {});
```

這個簽名幾乎就是整個 repo 的縮影。  
建立一條推論管線需要三類資訊：

- `ModelSpec`：你要跑哪個模型
- `SessionOptions`：你要怎麼跑它
- `PipelineOptions`：你要怎麼解讀各 task 的結果

換句話說，這裡不是單純 `load_model(path)` 的思維，而是「把模型、執行環境與 task 行為一起收斂成一條可重用的 pipeline」。

### info() 與 run 系列函數

`Pipeline` 的 public member 很少，但每個都很有代表性。

#### `info()`

```cpp
[[nodiscard]] virtual const PipelineInfo& info() const noexcept = 0;
```

這表示 pipeline 建完之後，外部仍然可以回頭檢查它的組成資訊，而不是只能盲目呼叫 `detect(...)`。

#### `run(...)`

```cpp
[[nodiscard]] virtual InferenceResult run(const ImageView& image) const = 0;
```

這是較泛化的入口。  
它回傳的是 `std::variant<...>` 型別的 `InferenceResult`，表示這個 façade 想支援「同一條 pipeline，依 task 回傳不同結果型別」的模型。

#### `run_raw(...)`

```cpp
[[nodiscard]] virtual RawInferenceResult run_raw(
    const ImageView& image) const = 0;
```

這條路是給想直接看 tensor 的人。  
如果你正在研究某顆 YOLO ONNX 模型到底怎麼輸出，這會比只看 `DetectionResult` 更接近 runtime 真相。

#### task-specific entry points

再往下就是：

- `detect(...)`
- `classify(...)`
- `segment(...)`
- `estimate_pose(...)`
- `detect_obb(...)`

這些函數告訴你，雖然 `Pipeline` 是一個通用 façade，但它並沒有把所有 task 硬壓成一個模糊介面。  
相反地，它仍然保留了每個 task 清楚的型別化入口。

這是一個很實際的折衷：

- 你有統一的 pipeline 生命週期
- 你仍然拿得到 task-specific 的結構化結果

### create_pipeline 

最後 header 底部還有一個：

```cpp
[[nodiscard]] Result<std::unique_ptr<Pipeline>> create_pipeline(
    ModelSpec spec, SessionOptions session = {}, PipelineOptions options = {});
```

這其實就是把 `Pipeline::create(...)` 再包成更順手的 façade 入口。  
對使用者來說，重點不是 class hierarchy，而是：

1. 給模型規格
2. 給 session 設定
3. 給 task options
4. 換回一個可重用的 pipeline

從 source code 的角度看，`Pipeline` 這一層真正完成的工作是：  
把原本可能散落在不同地方的 model loading、session setup、preprocess metadata、adapter binding 與 task dispatch，全都收斂成同一個 public object。

也因此，當你在應用程式裡寫：

```cpp
auto pipeline = yolo::create_pipeline(...);
auto result = (*pipeline.value)->detect(image);
```

表面上只有兩行，但背後其實已經把一整條 YOLO inference pipeline 封裝好了。

## 第五步：用 adapter 理解 Ultralytics-style 輸出

YOLO 模型真正麻煩的地方，不是只有把 ONNX 載進來，而是不同 task、不同 head 的輸出到底該怎麼解析。

這也是 repo 裡 `yolo::adapters::ultralytics` 存在的原因。

這一層會處理的觀念包括：

- output role
- detection head layout
- classification score kind
- pose / obb / segmentation 各自的 binding spec

它的價值在於：  
把「這顆 Ultralytics-style ONNX 模型該怎麼讀」這件事，從零散的 if-else 與硬編碼，提升成較明確的 binding metadata。

## 為什麼這樣的抽象有價值

如果沒有這些抽象，應用程式通常會被迫自己處理很多本來不該攤在業務層的事情，例如：

- 模型輸入尺寸與預處理策略
- 輸出 tensor 的排列方式
- task-specific decode 差異
- runtime provider 的切換

`YOLO-CPP` 的設計價值，就在於把這些問題往 library 內部收斂，同時保留一個小而清楚的 public API。

## 小結

可以把整個 `YOLO-CPP`  想成下面這條路：

```text
YOLO ONNX model
  + ModelSpec
  + SessionOptions
  -> Pipeline
  + ImageView
  -> task inference
  -> structured result
```

而 adapter 的角色，是幫 pipeline 更可靠地理解模型輸出契約。

這個 repo 真正做的事情，不只是「把 ONNX 跑起來」，而是：

- 定義模型規格
- 定義輸入影像邊界
- 定義 runtime session 選項
- 定義 task facade
- 定義 Ultralytics-style 模型的 binding 與解析方式

這些東西合在一起，才讓它成為一個可重用的 YOLO C++ runtime。
