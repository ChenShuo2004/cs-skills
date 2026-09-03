// 放到 src/Root.tsx。durationInFrames 必须等于 时长(秒) × fps。
// 60fps 不是奢侈：运镜和滚动是连续位移，30fps 下会有明显频闪。
import React from 'react';
import { Composition } from 'remotion';
import { PROMO_FPS, PROMO_TOTAL, PromoFilm } from './promo/PromoFilm';

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Promo"
    component={PromoFilm}
    durationInFrames={PROMO_TOTAL}
    fps={PROMO_FPS}
    width={1920}
    height={1080}
  />
);
