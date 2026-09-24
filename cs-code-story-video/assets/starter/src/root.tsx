import {Composition} from 'remotion';
import {StoryVideo} from './video';
import {CoverLandscape, CoverPortrait} from './covers';
import {story} from './model';

const fullFrames = story.shots.at(-1)?.endFrame ?? 1;
const sampleFrames = story.chapters[1]?.endFrame ?? story.chapters[0]?.endFrame ?? fullFrames;

export const Root = () => <>
  <Composition id="StoryVideo" component={StoryVideo} durationInFrames={fullFrames} fps={story.fps} width={story.width} height={story.height} />
  <Composition id="StoryOpening" component={StoryVideo} durationInFrames={sampleFrames} fps={story.fps} width={story.width} height={story.height} />
  <Composition id="StoryCover3x4" component={CoverPortrait} durationInFrames={1} fps={story.fps} width={1200} height={1600} />
  <Composition id="StoryCover4x3" component={CoverLandscape} durationInFrames={1} fps={story.fps} width={1600} height={1200} />
</>;
