import {AbsoluteFill, Audio, Img, staticFile, useCurrentFrame} from 'remotion';
import {arollScenes, brollScenes} from './scenes';
import {enter, pixel, story, type Shot} from './model';

const font = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";

const ChapterCard = ({shot, frame}: {shot: Shot; frame: number}) => {
  const chapter = story.chapters.find((item) => item.id === shot.chapterId);
  const index = story.chapters.findIndex((item) => item.id === shot.chapterId) + 1;
  const progress = enter(frame, 1, 9);
  return <AbsoluteFill style={{background: '#0B0D10', color: story.theme.paper}}>
    <div style={{position: 'absolute', inset: 0, opacity: .06, backgroundImage: 'linear-gradient(#A8C9E8 2px, transparent 2px),linear-gradient(90deg,#A8C9E8 2px,transparent 2px)', backgroundSize: '90px 90px'}} />
    <div style={{position: 'absolute', top: 190, width: '100%', textAlign: 'center', fontSize: 60, fontFamily: 'Consolas, monospace', color: story.theme.accent, opacity: progress}}>{String(index).padStart(2, '0')}</div>
    <div style={{position: 'absolute', left: 600, top: 360, width: 720, height: 155, display: 'grid', placeItems: 'center', background: story.theme.accent, border: `10px solid ${story.theme.ink}`, boxShadow: `14px 14px 0 ${story.theme.ink}`, color: story.theme.ink, fontFamily: font, fontWeight: 900, fontSize: 83, opacity: progress, transform: `translateY(${pixel((1 - progress) * 50)}px)`}}>{chapter?.title ?? ''}</div>
  </AbsoluteFill>;
};

const Aroll = ({shot, frame}: {shot: Shot; frame: number}) => {
  const scene = arollScenes[shot.sceneId];
  if (!scene) throw new Error(`A-roll scene is not registered: ${shot.sceneId}`);
  const left = shot.side === 'left' ? 220 : shot.side === 'right' ? 1180 : 660;
  const appear = enter(frame, 0, 12);
  const breathe = Math.sin(frame / 19) * 4;
  return <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 65%, #315B8A 0%, ${story.theme.stage} 55%, #091522 100%)`, overflow: 'hidden'}}>
    <div style={{position: 'absolute', inset: 0, opacity: .12, backgroundImage: 'linear-gradient(#8AC7F5 2px, transparent 2px),linear-gradient(90deg,#8AC7F5 2px,transparent 2px)', backgroundSize: '80px 80px'}} />
    <div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 190, background: '#0E1B2B', borderTop: '12px solid #080D14', boxShadow: `inset 0 12px 0 ${story.theme.accent}`}} />
    {scene({frame, side: shot.side})}
    <Img src={staticFile(story.character.file)} style={{position: 'absolute', left: pixel(left + (1 - appear) * (shot.side === 'right' ? 180 : -180)), bottom: 115 + breathe, width: 520, height: 730, objectFit: 'contain', imageRendering: 'pixelated', filter: 'drop-shadow(12px 12px 0 #080D14)', opacity: appear}} />
  </AbsoluteFill>;
};

const Broll = ({shot, frame}: {shot: Shot; frame: number}) => {
  const scene = brollScenes[shot.sceneId];
  if (!scene) throw new Error(`B-roll scene is not registered: ${shot.sceneId}`);
  return <AbsoluteFill style={{overflow: 'hidden'}}>{scene({frame})}</AbsoluteFill>;
};

export const StoryVideo = () => {
  const frame = useCurrentFrame();
  const shot = story.shots.find((item) => frame >= item.startFrame && frame < item.endFrame);
  if (!story.audio || !shot) return <AbsoluteFill style={{background: '#0B0D10'}} />;
  const local = frame - shot.startFrame;
  return <AbsoluteFill>
    <Audio src={staticFile(story.audio.file)} />
    {shot.kind === 'card' && <ChapterCard shot={shot} frame={local} />}
    {shot.kind === 'aroll' && <Aroll shot={shot} frame={local} />}
    {shot.kind === 'broll' && <Broll shot={shot} frame={local} />}
  </AbsoluteFill>;
};
