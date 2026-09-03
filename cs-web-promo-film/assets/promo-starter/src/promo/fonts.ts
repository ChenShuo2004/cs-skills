// 渲染机上不一定装了中文字体，必须显式载入并等待完成。
import { loadFont as loadSerif } from '@remotion/google-fonts/NotoSerifSC';
import { loadFont as loadSans } from '@remotion/google-fonts/NotoSansSC';

const serif = loadSerif('normal', {
  weights: ['500', '600'],
  subsets: ['chinese-simplified', 'latin'],
});

const sans = loadSans('normal', {
  weights: ['300', '400', '500'],
  subsets: ['chinese-simplified', 'latin'],
});

export const FONT = {
  serif: `${serif.fontFamily}, "Songti SC", "STSong", "SimSun", serif`,
  sans: `${sans.fontFamily}, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif`,
} as const;

export const waitForFonts = () => Promise.all([serif.waitUntilDone(), sans.waitUntilDone()]);
