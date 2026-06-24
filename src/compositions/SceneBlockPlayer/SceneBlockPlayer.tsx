import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img, useCurrentFrame} from 'remotion';
import {safeHexColor} from '../../components/util';
import {blockRenderers, getBlock} from '../blocks/registry';
import {
  getBlockDuration,
  sceneBlockPlayerSchema,
  type SceneBlockPlayerProps,
  type SceneBlockSequenceItem,
} from './schema';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

type PositionedBlock = {
  block: SceneBlockSequenceItem;
  startFrame: number;
  duration: number;
};

const getPositionedBlocks = (
  blocks: SceneBlockSequenceItem[],
): PositionedBlock[] => {
  let accumulated = 0;

  return blocks.map((block) => {
    const duration = getBlockDuration(block);
    const positioned = {block, startFrame: accumulated, duration};
    accumulated += duration;
    return positioned;
  });
};

const backgroundFor = (props: SceneBlockPlayerProps): string => {
  const backgroundColor = safeHexColor(
    props.brandSettings.backgroundColor,
    '#F7FAFC',
  );
  const secondaryColor = safeHexColor(
    props.brandSettings.secondaryColor,
    '#3182CE',
  );

  if (props.brandSettings.backgroundType === 'solid') {
    return backgroundColor;
  }

  if (props.brandSettings.backgroundType === 'image') {
    return '#F7FAFC';
  }

  return `linear-gradient(135deg, #FFFFFF 0%, ${backgroundColor}16 48%, ${secondaryColor}20 100%)`;
};

const renderPositionedBlock = ({
  positioned,
  localFrame,
  props,
}: {
  positioned: PositionedBlock;
  localFrame: number;
  props: SceneBlockPlayerProps;
}) => {
  const Renderer = blockRenderers[positioned.block.blockId];
  if (!Renderer) {
    return null;
  }

  const definition = getBlock(positioned.block.blockId);

  return (
    <Renderer
      frame={localFrame}
      fps={props.fps}
      width={props.width}
      height={props.height}
      content={{
        ...definition.defaultContent,
        ...positioned.block.content,
      }}
      brand={props.brandSettings}
      data={props.data}
      startFrame={positioned.startFrame}
    />
  );
};

export const SceneBlockPlayer: React.FC<SceneBlockPlayerProps> = (rawProps) => {
  const props = sceneBlockPlayerSchema.parse(rawProps);
  const currentFrame = useCurrentFrame();
  const positionedBlocks = getPositionedBlocks(props.blocks);
  const currentIndex = positionedBlocks.findIndex(
    ({startFrame, duration}) =>
      currentFrame >= startFrame && currentFrame < startFrame + duration,
  );
  const current =
    positionedBlocks[currentIndex] ?? positionedBlocks[positionedBlocks.length - 1];

  if (!current) {
    return null;
  }

  const localFrame = Math.max(0, currentFrame - current.startFrame);
  const next = positionedBlocks[currentIndex + 1];
  const transitionFrames = Math.min(
    current.block.transitionFrames ?? 12,
    current.duration,
  );
  const transitionStart = current.duration - transitionFrames;
  const transitionProgress =
    next && transitionFrames > 0 && localFrame >= transitionStart
      ? (localFrame - transitionStart) / transitionFrames
      : 0;

  return (
    <AbsoluteFill
      style={{
        background: backgroundFor(props),
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}
    >
      {props.brandSettings.backgroundType === 'image' &&
      props.brandSettings.backgroundImageUrl ? (
        <Img
          src={props.brandSettings.backgroundImageUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.16,
          }}
        />
      ) : null}

      {next && transitionProgress > 0 ? (
        <div style={{position: 'absolute', inset: 0, opacity: transitionProgress}}>
          {renderPositionedBlock({
            positioned: {
              ...next,
              startFrame: currentFrame - transitionProgress * transitionFrames,
            },
            localFrame: transitionProgress * transitionFrames,
            props,
          })}
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: next ? 1 - transitionProgress : 1,
        }}
      >
        {renderPositionedBlock({positioned: current, localFrame, props})}
      </div>
    </AbsoluteFill>
  );
};
