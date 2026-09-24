import rawStory from '../story.json';

export type Side = 'left' | 'right' | 'center';
export type ShotKind = 'card' | 'aroll' | 'broll';
export type Chapter = {id: string; title: string; startFrame: number; endFrame: number};
export type Shot = {id: string; chapterId: string; kind: ShotKind; sceneId: string; side: Side; startFrame: number; endFrame: number};
export type Story = {
  schemaVersion: number;
  title: string;
  fps: number;
  width: number;
  height: number;
  audio: {file: string; sha256: string} | null;
  character: {file: string; sha256: string};
  theme: {paper: string; ink: string; accent: string; coverAccent: string; stage: string};
  cover: {brand: string; series: string; headline: string; highlight: string; question: string; eyebrow: string};
  chapters: Chapter[];
  shots: Shot[];
};

export const story = rawStory as Story;
export const enter = (frame: number, start = 0, duration = 12) => {
  const t = Math.max(0, Math.min(1, (frame - start) / duration));
  return t * t * (3 - 2 * t);
};
export const pixel = (n: number, grid = 8) => Math.round(n / grid) * grid;
