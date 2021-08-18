import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import ReactCrop from "react-image-crop";
import { generateDownload, getSizeStr } from "./functions";
import "react-image-crop/dist/ReactCrop.css";
import "./styles.css";
import img from "./main.svg";

const App = () => {
  const [step, setStep] = useState(0);
  const [upImgs, setUpImgs] = useState(Array());
  const [upCrops, setUpCrops] = useState<any>(Array());
  const [upImg, setUpImg] = useState<any>(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const [crop, setCrop] = useState<any>({
    unit: "%",
    width: 100,
    height: 50,
  });
  const [completedCrop, setCompletedCrop] = useState<any>(null);
  //const [canvasInnerHeight, setCanvasInnerHeight] = useState(0);
  const [canvasHeight, setCanvasHeight] = useState(0);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [currentPos, setCurrentPos] = useState(0);
  const [size, setSize] = useState<any>(null);
  const previewWidth = useRef(0);
  const previewHeight = useRef(0);

  // ファイル選択時
  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => setUpImg(reader.result));
      reader.readAsDataURL(e.target.files[0]);
      if (step === 0) setStep(1);
      if (step === 2) setStep(3);
    }
  };

  // 画像読み込み時
  const onLoad = useCallback((img) => {
    imgRef.current = img;
    //const canvas = previewCanvasRef.current;
    const canvas = document.createElement("canvas");
    if (canvas === null) return;
    const ctx = canvas.getContext("2d");
    const width = img.naturalWidth;
    const height = img.height;
    const previewWidthNow = previewWidth.current;
    const previewHeightNow = previewHeight.current;
    previewWidth.current = width;
    previewHeight.current = height;

    // 幅が変わった場合初期化（canvas狂うため）
    if (previewWidthNow && previewWidth.current !== previewWidthNow && ctx) {
      alert("【エラー】\n横幅が同じ画像をセットしてください。\n最初の画面へ戻ります。");
      ctx.clearRect(0, 0, ctx.canvas.clientWidth, ctx.canvas.clientHeight);
      setStep(0);
      setUpImgs([]);
      setUpCrops([]);
      setUpImg(null);
      setCompletedCrop(null);
      setCanvasHeight(0);
      setCanvasWidth(0);
      setCurrentPos(0);
      setSize(null);
      setCrop({
        unit: "%",
        width: 100,
        height: 50,
      });
      previewWidth.current = 0;
      previewHeight.current = 0;
      (document.getElementById("inputFile") as HTMLInputElement).value = "";
      return;
    }

    // 高さが変わった場合リセット（切り抜けないのを防ぐ）
    if (previewHeightNow && previewHeight.current !== previewHeightNow) {
      setTimeout(function () {
        setCrop({ unit: "%", width: 100, height: 50, x: 0, y: 0 });
      }, 0);
    }
  }, []);

  // 切り抜き
  function cropImage(canvas: any, crop: any, image: any, pos: any) {
    if (!canvas) {
      return;
    }

    // ステップ進行
    let currentStep = step + 1;

    // 切り抜き時のみステップ進める
    if (!pos) {
      setStep(currentStep);
    }

    // ずらし
    const posCurrent = pos !== undefined ? currentPos + pos : currentPos;
    setCurrentPos(posCurrent);

    // ダウンロード画像幅（切り抜き幅 * ピクセル密度）
    let canvasHeightCurrent = canvasHeight;

    if (image) {
      setCanvasWidth(image.current.naturalWidth);
      const scale = image.current.naturalWidth / crop.width;

      // ダウンロード画像幅（切り抜き幅 * ピクセル密度）
      canvasHeightCurrent = crop.height * scale;
    }

    if (canvasHeight !== 0 && crop) {
      canvasHeightCurrent = canvasHeightCurrent + canvasHeight;
    }

    // 1153 → 2306 → 2106 → 1906？
    const posCurrent2 = pos !== undefined ? pos : currentPos;
    setCanvasHeight(Math.round(canvasHeightCurrent + posCurrent2));

    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";

    // 取り込み画像配列へ追加
    let images = upImgs;
    if (image) {
      images.push(image.current.src);
    }
    setUpImgs(images);

    // 取り込み画像配列へ追加
    let crops = upCrops;
    if (crop) {
      crops.push(crop);
    }
    setUpCrops(crops);

    const loadImage = (imagePath: any) => {
      return new Promise((resolve) => {
        let image = new Image();
        image.src = imagePath;
        resolve(image);
      });
    };

    Promise.all(upImgs.map((i) => loadImage(i)))
      .then((images) => {
        // 描画イメージ矩形のy座標（初期値0とする）
        let dy = 0;

        // canvasのstyle属性のheight（実寸よりは小さい）
        //let canvasDomHeight = 0;

        for (let index = 0; index < images.length; index++) {
          const image: any = images[index];
          const scale = image.naturalWidth / crops[index].width;

          // とりあえず2枚目以降。1つ前の高さにスケールを乗算
          if (index > 0) dy = crops[index - 1].height * scale;

          // 小数点省略
          dy = Math.round(dy);

          let newPos = index > 0 ? posCurrent : 0;
          //canvasDomHeight += crops[index].height + (newPos / scale) * 2;

          ctx.drawImage(
            image,
            0, // 元画像x座標
            Math.round(crops[index].y * scale), // 元画像y座標
            image.naturalWidth, // 元画像利用幅
            Math.round(crops[index].height * scale), // 元画像利用高さ
            0, // 描画イメージ矩形のx座標
            dy + newPos, // 描画イメージ矩形のy座標
            image.naturalWidth, // ピクセル値で画像の切取り部分の幅
            Math.round(crops[index].height * scale) // ピクセル値で画像の切取り部分の高さ
          );
        }
        //setCanvasInnerHeight(Math.round(canvasDomHeight));

        // 容量取得
        if (canvas) {
          canvas.toBlob(function (blob: any) {
            setSize(getSizeStr(blob.size));
          });
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }

  useEffect(() => {
    // 1.画像を選択 → 2.切り抜き確定 → 3.画像を選択（2枚目）→ 4.切り抜き確定（2枚目）→ ...
    if (step > 0) {
      document.body.classList.add("on");
    }
  }, [step]);

  return (
    <>
      {step === 0 && (
        <>
          <div className="main">
            <p>スクショつなぐくん</p>
            <img src={img} alt="Logo" className="img" />
          </div>
        </>
      )}
      <div className={`ReactCropWrapper ${step > 1 ? "on" : ""}`}>
        {(step === 1 || step === 3) && (
          <ReactCrop
            src={upImg}
            crop={crop}
            minWidth={window.parent.screen.width}
            maxWidth={window.parent.screen.width}
            //ruleOfThirds
            keepSelection={true}
            onImageLoaded={onLoad}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
          />
        )}
        <div className={`canvas ${step === 2 || step === 4 ? "on" : ""}`}>
          <canvas
            ref={previewCanvasRef}
            style={{
              width: Math.round(completedCrop?.width ?? 0),
              //height: canvasInnerHeight,
            }}
            width={canvasWidth}
            height={canvasHeight}
          />
        </div>
      </div>
      {upImgs.length > 1 && (
        <ul className="nav">
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, -100)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↑↑↑
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, -10)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↑↑
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, -1)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↑
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, 1)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↓
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, 10)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↓↓
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={cropImage.bind(undefined, previewCanvasRef.current, null, null, 100)}
              onContextMenu={(e) => {
                e.preventDefault();
              }}
            >
              ↓↓↓
            </button>
          </li>
        </ul>
      )}
      {size && (
        <p className="info">
          {canvasWidth} × {canvasHeight}px（{size}）
        </p>
      )}
      <ul className={`fixed${step > 0 && step < 4 ? " fixed_2" : ""}`}>
        {step !== 4 && (
          <li>
            <div className={`file${step === 1 || step === 3 ? " re" : ""}`}>
              {step === 0 && "最初の画像を選ぶ"}
              {(step === 1 || step === 3) && "画像を選び直す"}
              {step === 2 && "画像を追加"}
              <input type="file" accept="image/*" onChange={onSelectFile} id="inputFile" />
            </div>
          </li>
        )}
        {(step === 1 || step === 3) && (
          <li>
            <button type="button" disabled={!completedCrop?.width || !completedCrop?.height} onClick={() => cropImage(previewCanvasRef.current, completedCrop, imgRef, null)}>
              切り抜き確定
            </button>
          </li>
        )}
        {(step === 2 || step > 3) && (
          <li>
            <button type="button" disabled={!completedCrop?.width || !completedCrop?.height} onClick={() => generateDownload(previewCanvasRef.current, completedCrop)} className="download">
              ダウンロード
            </button>
          </li>
        )}
      </ul>
    </>
  );
};

ReactDOM.render(<App />, document.getElementById("root"));
