import { Easing, interpolate } from 'remotion';

const OUT_EXPO = Easing.bezier(0.16, 1, 0.3, 1);
const IN_OUT = Easing.bezier(0.42, 0, 0.36, 1);

export const ease = (
  frame: number,
  range: readonly [number, number],
  to: readonly [number, number],
  curve = OUT_EXPO,
) =>
  interpolate(frame, range as [number, number], to as [number, number], {
    easing: curve,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

/** 长距离位移（推镜、滚动）用对称加减速，ease-out-expo 会显得急停。 */
export const glide = (frame: number, range: readonly [number, number], to: readonly [number, number]) =>
  ease(frame, range, to, IN_OUT);

// 近线性。两层交叉淡化时不透明度之和才接近 1；
// 用 ease-out 曲线之和会掉到 0.7 左右，转场处闪一下黑。
const CROSS = Easing.bezier(0.4, 0, 0.6, 1);

/** 某一层的不透明度：在 into 区间淡入，在 outOf 区间淡出，两者都是绝对帧区间。 */
export const crossfade = (
  frame: number,
  into: readonly [number, number] | null,
  outOf: readonly [number, number] | null,
) => {
  const rise = into ? ease(frame, into, [0, 1], CROSS) : 1;
  const fall = outOf ? ease(frame, outOf, [1, 0], CROSS) : 1;
  return Math.min(rise, fall);
};

/** 按自身局部帧窗口淡入淡出，用于文案层。 */
export const band = (frame: number, duration: number, inFrames = 22, outFrames = 22) => {
  const rise = ease(frame, [0, inFrames], [0, 1]);
  const fall = ease(frame, [duration - outFrames, duration], [1, 0]);
  return Math.min(rise, fall);
};

/** 列表项错开入场。 */
export const stagger = (frame: number, start: number, index: number, gap = 12) => {
  const from = start + index * gap;
  return {
    opacity: ease(frame, [from, from + 26], [0, 1]),
    lift: ease(frame, [from, from + 30], [18, 0]),
  };
};
