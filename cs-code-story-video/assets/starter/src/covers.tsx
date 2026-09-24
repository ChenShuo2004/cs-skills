import {AbsoluteFill, Img, staticFile} from 'remotion';
import {story} from './model';

const serif = "'Noto Serif SC', 'SimSun', serif";
const sans = "'Noto Sans SC', 'Microsoft YaHei', sans-serif";
const {paper, ink, coverAccent} = story.theme;
const count = (value: string) => Array.from(value).length;
const sizeFor = (value: string, available: number, preferred: number, minimum: number) => Math.max(minimum, Math.min(preferred, Math.floor(available / Math.max(1, count(value)))));
const questionLines = (() => {
  const q = story.cover.question;
  const comma = q.indexOf('，');
  if (comma > -1) return [q.slice(0, comma + 1), q.slice(comma + 1)];
  if (count(q) <= 6) return [q];
  const split = Math.ceil(count(q) / 2);
  return [Array.from(q).slice(0, split).join(''), Array.from(q).slice(split).join('')];
})();

const MagazineTexture = () => <>
  <AbsoluteFill style={{background: `radial-gradient(ellipse at 50% 35%, #F4F0E7 0%, ${paper} 62%, #CFC9C0 100%)`}} />
  <AbsoluteFill style={{backgroundImage: 'repeating-linear-gradient(0deg, transparent 0 6px, rgba(50,39,31,.22) 6px 7px, transparent 7px 15px)', opacity: .25}} />
  {Array.from({length: 220}, (_, i) => <div key={i} style={{position: 'absolute', left: (i * 193 + i * i * 17) % 1600, top: (i * 271 + i * i * 11) % 1600, width: i % 17 === 0 ? 3 : 1, height: i % 17 === 0 ? 3 : 1, background: ink, opacity: .1}} />)}
</>;

const Headline = ({wide}: {wide: boolean}) => {
  const full = story.cover.headline;
  const split = story.cover.highlight && full.includes(story.cover.highlight) ? full.indexOf(story.cover.highlight) : -1;
  const segments = split < 0 ? [full, '', ''] : [full.slice(0, split), story.cover.highlight, full.slice(split + story.cover.highlight.length)];
  const fontSize = sizeFor(full, wide ? 1490 : 1120, wide ? 215 : 185, wide ? 96 : 90);
  return <div style={{position: 'absolute', zIndex: 3, left: wide ? 60 : 46, top: wide ? 133 : 235, width: wide ? 1500 : 1140, fontFamily: serif, fontSize, lineHeight: 1.15, fontWeight: 900, letterSpacing: -Math.round(fontSize * .08), whiteSpace: 'nowrap', color: ink}}>
    {segments[0]}<span style={{color: coverAccent}}>{segments[1]}</span>{segments[2]}
  </div>;
};

const MagazineCover = ({wide}: {wide: boolean}) => {
  const width = wide ? 1600 : 1200;
  const footerTop = wide ? 885 : 1155;
  const qSize = sizeFor(story.cover.question, wide ? 1400 : 1020, wide ? 113 : 112, 68);
  return <AbsoluteFill style={{overflow: 'hidden', background: paper}}>
    <MagazineTexture />
    <div style={{position: 'absolute', left: 60, right: 60, top: 52, borderTop: `3px solid ${ink}`}} />
    <div style={{position: 'absolute', left: 61, top: 68, font: `900 28px ${sans}`, letterSpacing: 6, color: ink}}>{story.cover.brand} / {story.cover.series}</div>
    <div style={{position: 'absolute', right: 62, top: 68, font: `900 26px ${sans}`, letterSpacing: 3, color: coverAccent}}>A-ROLL / B-ROLL</div>
    <div style={{position: 'absolute', left: 63, top: wide ? 410 : 145, font: `700 ${wide ? 70 : 75}px ${serif}`, color: ink}}>{story.cover.eyebrow}</div>
    <Headline wide={wide} />
    <div style={{position: 'absolute', zIndex: 1, left: wide ? 665 : 235, top: wide ? 272 : 442, width: wide ? 635 : 770, height: wide ? 865 : 1080, borderRadius: '50%', background: 'radial-gradient(ellipse at 50% 58%, rgba(28,22,19,.22), transparent 68%)'}} />
    <Img src={staticFile(story.character.file)} style={{position: 'absolute', zIndex: 2, left: wide ? 665 : 235, top: wide ? 272 : 442, width: wide ? 635 : 770, height: wide ? 865 : 1080, objectFit: 'contain', imageRendering: 'pixelated', filter: 'grayscale(1) contrast(1.25) brightness(.9) drop-shadow(12px 13px 0 rgba(20,17,16,.5))'}} />
    <div style={{position: 'absolute', zIndex: 3, left: wide ? 84 : 62, top: wide ? 580 : 720, width: wide ? 400 : 240, borderTop: `5px solid ${coverAccent}`}} />
    <div style={{position: 'absolute', zIndex: 3, left: wide ? 82 : 62, top: wide ? 608 : 755, color: coverAccent, font: `900 ${wide ? 32 : 29}px ${serif}`, lineHeight: 1.42}}>角色负责讲述<br />场景负责演出</div>
    <div style={{position: 'absolute', zIndex: 3, right: wide ? 100 : 80, top: wide ? 414 : 630, border: `6px solid ${coverAccent}`, padding: '15px 24px', color: coverAccent, font: `900 ${wide ? 35 : 32}px ${serif}`, transform: 'rotate(8deg)', background: 'rgba(244,240,231,.76)'}}>{story.cover.brand} / STORY</div>
    <div style={{position: 'absolute', top: footerTop, left: 0, right: 0, bottom: 0, background: '#22201E', clipPath: 'polygon(0 4%, 6% 1%, 13% 5%, 21% 0, 29% 4%, 38% 1%, 47% 5%, 57% 1%, 68% 4%, 77% 1%, 89% 5%, 100% 2%, 100% 100%, 0 100%)'}} />
    <div style={{position: 'absolute', zIndex: 3, top: footerTop + 34, left: 0, right: 0, bottom: 0, background: 'linear-gradient(90deg, rgba(34,32,30,.90) 0%, rgba(34,32,30,.76) 66%, rgba(34,32,30,.25) 100%)'}} />
    <div style={{position: 'absolute', zIndex: 4, left: wide ? 76 : 58, top: footerTop + (wide ? 63 : 55), width: width - 120, fontFamily: serif, fontWeight: 900, color: '#F3F0E7', fontSize: qSize, lineHeight: 1.12, letterSpacing: -8, textShadow: '6px 6px 0 #100E0D'}}>
      {wide ? <>{questionLines[0]}<span style={{color: '#D95349'}}>{questionLines.slice(1).join('')}</span></> : questionLines.map((line, i) => <div key={i} style={{color: i === questionLines.length - 1 ? '#D95349' : '#F3F0E7'}}>{line}</div>)}
    </div>
    <div style={{position: 'absolute', zIndex: 5, left: wide ? 80 : 62, bottom: 32, color: '#C4BDB4', font: `700 ${wide ? 21 : 23}px ${sans}`, letterSpacing: 4}}>{story.title}</div>
    <div style={{position: 'absolute', zIndex: 5, right: 62, bottom: 32, color: '#C4BDB4', font: `900 23px ${sans}`, letterSpacing: 4}}>{story.cover.brand}</div>
  </AbsoluteFill>;
};

export const CoverPortrait = () => <MagazineCover wide={false} />;
export const CoverLandscape = () => <MagazineCover wide />;
