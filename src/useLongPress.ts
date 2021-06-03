import { useEffect, useState } from "react";

/**
 * React長押しボタンカスタムフック
 * https://zenn.dev/katahei/scraps/7a52c361329387
 *
 * 以下のように使用する
 * const handleLongPress = useLongPress(関数, インターバル時間)
 * <button {...handleLongPress}>クリック</button>
 */
type LongPressSet = {
  onMouseDown: () => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
  onTouchStart: () => void;
  onTouchEnd: () => void;
};

export const useLongPress = (callback: () => void, ms: number): LongPressSet => {
  const [startLongPress, setStartLongPress] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout | undefined;

    if (startLongPress) {
      timeout = setTimeout(callback, ms);
    } else {
      clearTimeout(timeout as NodeJS.Timeout);
    }

    return () => {
      clearTimeout(timeout as NodeJS.Timeout);
    };
  }, [startLongPress, callback]);

  const start = () => {
    callback();
    setTimeout(() => {
      setStartLongPress(true);
    }, 1000);
  };

  const stop = () => {
    setStartLongPress(false);
  };

  return {
    onMouseDown: start,
    onMouseUp: stop,
    onMouseLeave: stop,
    onTouchStart: start,
    onTouchEnd: stop,
  };
};

export default useLongPress;
