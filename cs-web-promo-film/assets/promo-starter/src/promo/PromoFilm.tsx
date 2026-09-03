// 分镜。这是唯一需要真正手写的文件，其余从 promo-starter 复制后基本不动。
//
// 这个骨架是一支能直接渲的两段式片子（40 秒），把所有模式都示范了一遍：
// 共享 CUT 转场、统一 stops 打关键帧、实测坐标点击、文案错开入场。
// 做真片子时：改 CUT 的帧号、改各 Layer 的 stops 与几何量、改文案，段落不够就照抄一个 Layer。
import React from 'react';
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion';
import { C, GLOW } from './tokens';
import { FONT } from './fonts';
import { Body, Kicker, Pill, Rule, Stage, Title } from './ui';
import { Highlight, Pointer, Window, pagePoint } from './Window';
import { band, crossfade, ease, stagger } from './anim';

export const PROMO_FPS = 60;
export const PROMO_TOTAL = 2400; // 40 秒 × 60fps

/** 相机曲线：两头缓、中间匀，像真人推轨。长距离位移不要用 ease-out-expo。 */
const CAMERA = Easing.bezier(0.42, 0, 0.36, 1);

/** 打关键帧。同一段里所有几何量共用一组 stops，镜头才不会飘。 */
const track = (frame: number, stops: number[], values: number[]) =>
  interpolate(frame, stops, values, {
    easing: CAMERA,
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

const inRange = (frame: number, from: number, until: number) => frame >= from && frame < until;

/** 文案区固定在左侧，窗口在右侧偏中。 */
const LEFT = { x: 128, width: 500 };

// 每个转场是一个共享区间：出场层在这个区间淡出，入场层在同一区间淡入。
// 区间不共享或曲线不是近线性，转场处会闪一下黑——必须用 luma-sweep 验证，别靠眼睛。
// 52 帧（0.87 秒）是舒服的长度，低于 30 帧仓促，高于 80 帧拖沓。
const CUT = {
  openToA: [180, 232],
  aToB: [1080, 1132],
  bToEnd: [2200, 2252],
} as const;

const TextColumn: React.FC<{
  from: number;
  until: number;
  kicker: string;
  title: React.ReactNode;
  titleSize?: number;
  body?: string;
  pills?: string[];
}> = ({ from, until, kicker, title, titleSize = 48, body, pills = [] }) => {
  const frame = useCurrentFrame();
  if (!inRange(frame, from, until)) return null;
  const local = frame - from;

  return (
    <AbsoluteFill style={{ opacity: band(local, until - from, 26, 26) }}>
      <div style={{ position: 'absolute', left: LEFT.x, top: 318, width: LEFT.width }}>
        {/* 三层信息错开入场，同时出现会糊成一块。 */}
        <div
          style={{
            opacity: ease(local, [4, 30], [0, 1]),
            transform: `translateY(${ease(local, [4, 34], [14, 0])}px)`,
          }}
        >
          <Kicker>{kicker}</Kicker>
          <Rule width={ease(local, [12, 60], [0, 96])} style={{ marginTop: 18 }} />
        </div>
        <div
          style={{
            marginTop: 30,
            opacity: ease(local, [16, 46], [0, 1]),
            transform: `translateY(${ease(local, [16, 52], [22, 0])}px)`,
          }}
        >
          <Title size={titleSize}>{title}</Title>
        </div>
        {body ? (
          <div
            style={{
              marginTop: 26,
              opacity: ease(local, [34, 66], [0, 1]),
              transform: `translateY(${ease(local, [34, 70], [16, 0])}px)`,
            }}
          >
            <Body>{body}</Body>
          </div>
        ) : null}
        <div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
          {pills.map((text, index) => {
            const { opacity, lift } = stagger(local, 58, index, 16);
            return (
              <Pill key={text} style={{ opacity, transform: `translateY(${lift}px)` }}>
                {text}
              </Pill>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

/**
 * 第一段：落位 → 滚动展示 → 推进 → 高亮并点击真实链接，引出下一段。
 * 一段 6–8 秒，内部三拍（落位 / 展示 / 指向），中间必须有停住的时间让文案读完。
 */
const SegmentA: React.FC = () => {
  const frame = useCurrentFrame();
  const FROM = CUT.openToA[0];
  const UNTIL = CUT.aToB[1];
  if (!inRange(frame, FROM, UNTIL)) return null;

  //             落位  停住   滚动   推进   停住  收尾
  const stops = [190, 300, 520, 700, 860, 1100];
  const geo = {
    left: track(frame, stops, [880, 800, 800, 660, 660, 660]),
    top: track(frame, stops, [170, 170, 170, 140, 140, 140]),
    contentWidth: track(frame, stops, [1400, 1400, 1400, 2050, 2050, 2050]),
    panX: track(frame, stops, [55, 55, 55, 95, 95, 95]),
    scroll: track(frame, stops, [40, 140, 640, 880, 880, 880]),
  };
  const width = track(frame, stops, [1030, 1030, 1030, 1180, 1180, 1180]);
  const height = track(frame, stops, [760, 760, 760, 820, 820, 820]);
  const scale = track(frame, stops, [0.97, 1, 1, 1, 1, 1]);

  // 点击落点从 boxes.json 的实测坐标算，不要目测。示例元素：x=755 y=977 w=80 h=23
  const hit = pagePoint(geo, 755, 977);
  // 三个动作错开：高亮框先亮 → 指针入场 → 按下 → 立刻转场，才像「点了就跳走」。
  const highlight = Math.min(ease(frame, [940, 985], [0, 1]), ease(frame, [1055, 1080], [1, 0]));
  const cue = Math.min(ease(frame, [975, 1006], [0, 1]), ease(frame, [1040, 1070], [1, 0]));
  const press = ease(frame, [1006, 1014], [1, 0.84]);

  return (
    <AbsoluteFill style={{ opacity: crossfade(frame, CUT.openToA, CUT.aToB) }}>
      <div
        style={{
          position: 'absolute',
          left: geo.left,
          top: geo.top,
          transform: `scale(${scale})`,
          transformOrigin: '50% 40%',
        }}
      >
        <Window page="example" width={width} height={height} {...geo} />
      </div>
      <Highlight x={hit.x} y={hit.y} w={80 * hit.scale} h={23 * hit.scale} opacity={highlight} />
      <Pointer x={hit.x + 34} y={hit.y + 20} opacity={cue} press={press} />
    </AbsoluteFill>
  );
};

/** 第二段：落地新页面，滚过要展示的内容。 */
const SegmentB: React.FC = () => {
  const frame = useCurrentFrame();
  const FROM = CUT.aToB[0];
  const UNTIL = CUT.bToEnd[1];
  if (!inRange(frame, FROM, UNTIL)) return null;

  const scroll = track(frame, [1140, 1260, 2130, 2252], [20, 20, 760, 760]);

  return (
    <AbsoluteFill style={{ opacity: crossfade(frame, CUT.aToB, CUT.bToEnd) }}>
      <div
        style={{
          position: 'absolute',
          left: 660,
          top: 140,
          // 落位：轻微上浮 + 从 0.95 缩放到 1。
          transform: `translateY(${ease(frame, [FROM, FROM + 70], [58, 0])}px) scale(${ease(
            frame,
            [FROM, FROM + 70],
            [0.95, 1],
          )})`,
          transformOrigin: '50% 60%',
        }}
      >
        <Window page="example" width={1180} height={830} contentWidth={1180} panX={0} scroll={scroll} />
      </div>
    </AbsoluteFill>
  );
};

/** 开场 3–4 秒。品牌题字优先用页面上真实的 logo / 书法（用 find-region.mjs 定裁切框），不要手打。 */
const OpenScene: React.FC = () => {
  const frame = useCurrentFrame();
  if (frame >= CUT.openToA[1]) return null;

  return (
    <AbsoluteFill style={{ opacity: crossfade(frame, null, CUT.openToA), background: C.canvas }}>
      <AbsoluteFill style={{ background: GLOW.warm }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Title
            size={86}
            style={{
              letterSpacing: '0.1em',
              opacity: ease(frame, [4, 54], [0, 1]),
              transform: `scale(${ease(frame, [4, 124], [1.045, 1])})`,
            }}
          >
            品牌名
          </Title>
          <div
            style={{
              width: ease(frame, [46, 96], [0, 190]),
              height: 1,
              margin: '34px auto 30px',
              background: `linear-gradient(90deg, rgba(217,162,75,0), ${C.gold}, rgba(217,162,75,0))`,
            }}
          />
          <div
            style={{
              fontFamily: FONT.sans,
              fontWeight: 300,
              fontSize: 20,
              letterSpacing: '0.52em',
              color: C.muted,
              opacity: ease(frame, [58, 108], [0, 1]),
              transform: `translateY(${ease(frame, [58, 114], [12, 0])}px)`,
            }}
          >
            一句话副标
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/** 收尾落版，留 2 秒以上静止。 */
const EndScene: React.FC = () => {
  const frame = useCurrentFrame();
  const FROM = CUT.bToEnd[0];
  if (frame < FROM) return null;
  const local = frame - FROM;

  return (
    <AbsoluteFill
      style={{ opacity: crossfade(frame, CUT.bToEnd, null), background: 'rgba(18, 16, 14, 0.96)' }}
    >
      <AbsoluteFill style={{ background: GLOW.warm }} />
      <AbsoluteFill style={{ background: GLOW.ember }} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Title
            size={88}
            style={{
              letterSpacing: '0.1em',
              opacity: ease(local, [8, 50], [0, 1]),
              transform: `translateY(${ease(local, [8, 56], [16, 0])}px)`,
            }}
          >
            品牌名
          </Title>
          <div
            style={{
              marginTop: 30,
              fontFamily: FONT.sans,
              fontWeight: 300,
              fontSize: 23,
              letterSpacing: '0.14em',
              color: C.muted,
              opacity: ease(local, [26, 68], [0, 1]),
            }}
          >
            一句品牌态度
          </div>
          <div
            style={{
              marginTop: 54,
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: ease(local, [86, 128], [0, 1]),
            }}
          >
            <span style={{ fontFamily: FONT.sans, fontSize: 15, letterSpacing: '0.34em', color: C.gold }}>
              入口
            </span>
            <span style={{ width: 1, height: 22, background: C.hairline }} />
            <span
              style={{ fontFamily: FONT.sans, fontSize: 34, letterSpacing: '0.06em', color: C.cream }}
            >
              example.com
            </span>
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const PromoFilm: React.FC = () => (
  <Stage>
    <SegmentA />
    <SegmentB />

    {/* 文案区间与镜头动作对齐：换文案发生在镜头停住时，不在推进过程中。
        带正文的段落至少给 6 秒，观众才读得完。 */}
    <TextColumn
      from={210}
      until={1070}
      kicker="01 / 第一段"
      title="一句话说清这一段"
      titleSize={56}
      body="解释这个板块解决什么问题。加了口播之后，这一行要删掉。"
      pills={['具体数字放这里']}
    />
    <TextColumn
      from={1125}
      until={2190}
      kicker="02 / 第二段"
      title="第二段的标题"
      titleSize={46}
      body="同上。"
      pills={['17 个可以直接打开的工具']}
    />

    {/* 开场与收尾放最后，盖在内容层之上。 */}
    <OpenScene />
    <EndScene />
  </Stage>
);
