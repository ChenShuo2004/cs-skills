// 虚拟浏览器窗口：窗口里贴一张 1440 逻辑宽的页面长截图。
// 运镜 = 改 contentWidth（推）/ panX（横移）/ scroll（滚）三个数，不改这个文件。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { C, PAGES, PAGE_WIDTH, SHADOW } from './tokens';
import { FONT } from './fonts';

type PageKey = keyof typeof PAGES;

type Props = {
  page: PageKey;
  /** 窗口在画布上的尺寸，成片像素。 */
  width: number;
  height: number;
  /** 这张 1440 宽的页面被放大到多宽，成片像素。变大就是推镜头。 */
  contentWidth: number;
  /** 纵向看到页面的哪里，页面逻辑像素。 */
  scroll: number;
  /** 横向看到页面的哪里，页面逻辑像素。 */
  panX?: number;
  blur?: number;
  opacity?: number;
  /** 关掉标题栏，用于把页面局部当作纯图版（比如裁品牌题字做片头）。 */
  showChrome?: boolean;
  style?: React.CSSProperties;
};

/** 标题栏高度。点击落点换算必须加上它，忘了指针会整体偏上。 */
export const CHROME_HEIGHT = 38;

const DOTS = ['#FF5F57', '#FEBC2E', '#28C840'];

export const Window: React.FC<Props> = ({
  page,
  width,
  height,
  contentWidth,
  scroll,
  panX = 0,
  blur = 0,
  opacity = 1,
  showChrome = true,
  style,
}) => {
  const meta = PAGES[page];
  const pageScale = contentWidth / PAGE_WIDTH;

  return (
    <div
      style={{
        width,
        height,
        borderRadius: 16,
        overflow: 'hidden',
        background: C.chrome,
        boxShadow: SHADOW.window,
        opacity,
        filter: blur > 0 ? `blur(${blur}px)` : undefined,
        display: 'flex',
        flexDirection: 'column',
        ...style,
      }}
    >
      {showChrome ? (
        <div
          style={{
            height: CHROME_HEIGHT,
            flexShrink: 0,
            background: C.chrome,
            borderBottom: '1px solid rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 16,
            gap: 8,
            position: 'relative',
          }}
        >
          {DOTS.map((color) => (
            <div key={color} style={{ width: 11, height: 11, borderRadius: 999, background: color }} />
          ))}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: FONT.sans,
              fontWeight: 400,
              fontSize: 14,
              letterSpacing: '0.06em',
              color: 'rgba(242, 234, 224, 0.42)',
            }}
          >
            {meta.title}
          </div>
        </div>
      ) : null}
      {/* overflow: hidden 就是「裁切」。不要用 ffmpeg 的 crop 滤镜，Remotion 自带 ffmpeg 禁用了它。 */}
      <div style={{ position: 'relative', flex: 1, overflow: 'hidden' }}>
        <Img
          src={staticFile(meta.file)}
          style={{
            position: 'absolute',
            left: -panX * pageScale,
            top: -scroll * pageScale,
            width: contentWidth,
            height: meta.height * pageScale,
            display: 'block',
            filter: meta.grade === 1 ? undefined : `brightness(${meta.grade})`,
          }}
        />
      </div>
    </div>
  );
};

type Frame = {
  /** 窗口外层 div 的 left / top。 */
  left: number;
  top: number;
  contentWidth: number;
  panX: number;
  scroll: number;
  showChrome?: boolean;
};

/**
 * 把 boxes.json 里的页面坐标换成画布坐标。
 * 所有点击落点、高亮框位置都用它算，不要目测——目测一定会点在链接旁边的空白上。
 */
export const pagePoint = (frame: Frame, pageX: number, pageY: number) => {
  const scale = frame.contentWidth / PAGE_WIDTH;
  const chrome = frame.showChrome === false ? 0 : CHROME_HEIGHT;
  return {
    x: frame.left + (pageX - frame.panX) * scale,
    y: frame.top + chrome + (pageY - frame.scroll) * scale,
    scale,
  };
};

/** 高亮真实链接。w / h 用 boxes.json 里量到的元素尺寸，别自己编。 */
export const Highlight: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  opacity: number;
}> = ({ x, y, w, h, opacity }) => (
  <div
    style={{
      position: 'absolute',
      left: x - 10,
      top: y - 6,
      width: w + 20,
      height: h + 12,
      borderRadius: 8,
      border: `1px solid ${C.gold}`,
      background: 'rgba(217, 162, 75, 0.16)',
      opacity,
      pointerEvents: 'none',
    }}
  />
);

/** 录屏风格指针，标注真实发生的点击。绝不画产品界面上没有的按钮。 */
export const Pointer: React.FC<{ x: number; y: number; opacity: number; press: number }> = ({
  x,
  y,
  opacity,
  press,
}) => (
  <svg
    width="40"
    height="50"
    viewBox="0 0 42 52"
    style={{
      position: 'absolute',
      left: x,
      top: y,
      opacity,
      transform: `scale(${press})`,
      transformOrigin: 'top left',
      filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.6))',
      pointerEvents: 'none',
    }}
  >
    <path
      d="M4 2L5 42L15 31L22 49L30 45L22 28L37 27Z"
      fill="#fff"
      stroke="#111"
      strokeWidth="3"
      strokeLinejoin="round"
    />
  </svg>
);
