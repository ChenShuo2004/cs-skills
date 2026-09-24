import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {enter, pixel, story} from './model';

export type SceneProps = {frame: number; side?: 'left' | 'right' | 'center'};
type Scene = (props: SceneProps) => ReactNode;
const {theme} = story;

// These two scenes demonstrate the interface. Replace them with events from the
// current narration. A B-roll scene owns the whole screen and must not reuse the
// A-roll presenter layout.
const ExampleNote: Scene = ({frame, side}) => {
  const p = enter(frame, 3, 13);
  const target = side === 'right' ? 300 : 1000;
  return <div style={{position: 'absolute', top: 280, left: pixel(target + (1 - p) * (side === 'right' ? -180 : 180)), width: 580, border: `10px solid ${theme.ink}`, background: '#E4EFF9', boxShadow: `14px 14px 0 ${theme.ink}`, padding: 42, opacity: p}}>
    <div style={{fontSize: 32, fontFamily: 'Consolas, monospace', color: '#396BA5'}}>NOTE 01</div>
    <div style={{fontSize: 60, fontWeight: 900, color: theme.ink, marginTop: 24}}>这一刻</div>
    <div style={{height: 15, width: `${p * 90}%`, background: theme.accent, marginTop: 40}} />
  </div>;
};

const ExampleTable: Scene = ({frame}) => {
  const item = enter(frame, 9, 16);
  return <AbsoluteFill style={{background: 'radial-gradient(ellipse at 50% 65%, #345A79 0%, #12253B 65%, #090F19 100%)'}}>
    <div style={{position: 'absolute', left: 100, top: 80, fontSize: 30, color: '#A8C9E8', fontFamily: 'Consolas, monospace'}}>SCENE / EXAMPLE</div>
    <div style={{position: 'absolute', left: 430, top: 685, width: 1060, height: 65, background: '#101820', borderTop: `16px solid ${theme.accent}`, boxShadow: '20px 20px 0 #05080B'}} />
    <div style={{position: 'absolute', left: pixel(780 + (1 - item) * 240), top: 390, width: 360, height: 280, background: '#E4EFF9', border: `14px solid ${theme.ink}`, boxShadow: `14px 14px 0 ${theme.ink}`, opacity: item}}>
      <div style={{margin: 48, width: 230, height: 16, background: theme.accent}} />
      <div style={{margin: '0 48px', width: 170, height: 16, background: '#4678AF'}} />
    </div>
  </AbsoluteFill>;
};

export const arollScenes: Record<string, Scene> = {
  'example-note': ExampleNote,
};

export const brollScenes: Record<string, Scene> = {
  'example-table': ExampleTable,
};
