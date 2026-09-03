// 画布分层与文字层级。改字号、字距、行高在这里，不要在 PromoFilm 里内联覆盖。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, GLOW, SHADOW } from './tokens';
import { FONT } from './fonts';

/** 画布分层，顺序即叠放顺序。halo 必须在内容层之下、暖光之上。 */
export const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ background: C.canvas }}>
    <AbsoluteFill style={{ background: GLOW.warm }} />
    <AbsoluteFill style={{ background: GLOW.ember }} />
    <AbsoluteFill style={{ background: GLOW.halo }} />
    {children}
    <AbsoluteFill style={{ background: GLOW.vignette, pointerEvents: 'none' }} />
  </AbsoluteFill>
);

export const Kicker: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: FONT.sans,
      fontWeight: 500,
      fontSize: 16,
      letterSpacing: '0.36em',
      color: C.gold,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Title: React.FC<{
  children: React.ReactNode;
  size?: number;
  style?: React.CSSProperties;
}> = ({ children, size = 68, style }) => (
  <div
    style={{
      fontFamily: FONT.serif,
      fontWeight: 600,
      fontSize: size,
      lineHeight: 1.28,
      letterSpacing: '0.01em',
      color: C.cream,
      ...style,
    }}
  >
    {children}
  </div>
);

export const Body: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      fontFamily: FONT.sans,
      fontWeight: 300,
      fontSize: 22,
      lineHeight: 1.95,
      color: C.muted,
      ...style,
    }}
  >
    {children}
  </div>
);

/** 放具体数字（篇数、工具数、时长）。加了口播之后正文可以删，Pill 要留。 */
export const Pill: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '11px 20px',
      borderRadius: 999,
      border: `1px solid ${C.hairline}`,
      background: 'rgba(242, 234, 224, 0.045)',
      boxShadow: SHADOW.pill,
      fontFamily: FONT.sans,
      fontWeight: 400,
      fontSize: 17,
      color: C.cream,
      whiteSpace: 'nowrap',
      ...style,
    }}
  >
    {children}
  </div>
);

export const Rule: React.FC<{ width: number; style?: React.CSSProperties }> = ({ width, style }) => (
  <div
    style={{
      width,
      height: 1,
      background: `linear-gradient(90deg, ${C.gold}, rgba(217, 162, 75, 0))`,
      ...style,
    }}
  />
);
