// PNG形式でダウンロード
export function generateDownload(canvas: any, crop: Array<number>) {
  if (!crop || !canvas) {
    return;
  }

  canvas.toBlob(
    (blob: any) => {
      const previewUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      // 現在時刻をファイル名にする（例：210526140000.png）
      const nowdate = new Date();
      const formatted = `${nowdate.getFullYear().toString().substring(2, 4)}${(nowdate.getMonth() + 1).toString().padStart(2, "0")}${nowdate.getDate().toString().padStart(2, "0")}${nowdate.getHours().toString().padStart(2, "0")}${nowdate.getMinutes().toString().padStart(2, "0")}${nowdate.getSeconds().toString().padStart(2, "0")}`.replace(/\n|\r/g, "");

      anchor.download = formatted + ".png";
      anchor.href = URL.createObjectURL(blob);
      anchor.click();
      window.URL.revokeObjectURL(previewUrl);
    },
    "image/png",
    1
  );
}

// ファイルサイズを単位で表示
export function getSizeStr(e: number) {
  const t = ["Bytes", "KB", "MB", "GB", "TB"];
  if (0 === e) return "n/a";
  const n = Math.floor(Math.log(e) / Math.log(1024));
  //const n = parseInt(Math.floor(Math.log(e) / Math.log(1024)));
  return numberFormat(Math.round(e / Math.pow(1024, n))) + t[n];
}

// 数値をカンマ区切りに
function numberFormat(num: number) {
  return num.toString().replace(/(\d+?)(?=(?:\d{3})+$)/g, function (x) {
    return x + ",";
  });
}
