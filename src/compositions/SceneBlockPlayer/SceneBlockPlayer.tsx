import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Audio, Img, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {safeHexColor} from '../../components/util';
import {blockRenderers, getBlock} from '../blocks/registry';
import {isBlockContentEmpty} from '../blocks/emptyCheck';
import {getAnimationStyle, mergeMotionStyles} from '../animations';
import {getTransitionStyle} from '../transitions';
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

const resolveAudioSrc = (src: string): string => {
  if (src.startsWith('/audio/')) return staticFile(src.slice(1));
  if (src.startsWith('audio/')) return staticFile(src);
  return src;
};

const getAudioVolume = ({
  frame,
  durationInFrames,
  fps,
  volume,
  fadeIn,
  fadeOut,
}: {
  frame: number;
  durationInFrames: number;
  fps: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
}): number => {
  const fadeInFrames = Math.round(fadeIn * fps);
  const fadeOutFrames = Math.round(fadeOut * fps);
  const fadeInMultiplier =
    fadeInFrames > 0
      ? interpolate(frame, [0, fadeInFrames], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  const fadeOutStart = Math.max(0, durationInFrames - fadeOutFrames);
  const fadeOutMultiplier =
    fadeOutFrames > 0
      ? interpolate(frame, [fadeOutStart, durationInFrames], [1, 0], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        })
      : 1;
  return volume * fadeInMultiplier * fadeOutMultiplier;
};

type PositionedBlock = {
  block: SceneBlockSequenceItem;
  startFrame: number;
  duration: number;
};

/**
 * Build positioned blocks, filtering out blocks whose essential content is
 * empty (graceful CSV defaults) and redistributing their duration to the
 * remaining blocks proportionally.
 */
const getPositionedBlocks = (
  blocks: SceneBlockSequenceItem[],
  data: Record<string, string>,
): PositionedBlock[] => {
  // Filter out blocks with empty essential content
  const visibleBlocks = blocks.filter((block) => {
    const definition = getBlock(block.blockId);
    const mergedContent = {...definition.defaultContent, ...block.content};
    return !isBlockContentEmpty(block.blockId, mergedContent, data);
  });

  // If all blocks are hidden, fall back to showing everything
  const effectiveBlocks = visibleBlocks.length > 0 ? visibleBlocks : blocks;

  let accumulated = 0;

  return effectiveBlocks.map((block) => {
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
      layout={positioned.block.layout}
      brand={props.brandSettings}
      data={props.data}
      startFrame={positioned.startFrame}
      imageTreatment={positioned.block.imageTreatment}
    />
  );
};

export const SceneBlockPlayer: React.FC<SceneBlockPlayerProps> = (rawProps) => {
  const props = sceneBlockPlayerSchema.parse(rawProps);
  const currentFrame = useCurrentFrame();
  const {durationInFrames, fps} = useVideoConfig();
  const positionedBlocks = getPositionedBlocks(props.blocks, props.data);
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

  // Transition config: use new `transition` field, fall back to legacy `transitionFrames`
  const transitionConfig = current.block.transition;
  const transitionDuration = Math.min(
    transitionConfig?.durationFrames ?? current.block.transitionFrames ?? 12,
    current.duration,
  );
  const transitionType = transitionConfig?.type ?? 'crossfade';
  const transitionDirection = transitionConfig?.direction;
  const transitionEasing = transitionConfig?.easing;
  const transitionIntensity = transitionConfig?.intensity;

  const transitionStart = current.duration - transitionDuration;
  const transitionProgress =
    next && transitionDuration > 0 && localFrame >= transitionStart
      ? (localFrame - transitionStart) / transitionDuration
      : 0;

  // Animation styles for current block
  const entryAnimation = current.block.animation?.entry;
  const exitAnimation = current.block.animation?.exit;
  const entryDuration = entryAnimation?.durationFrames ?? 12;
  const exitDuration = exitAnimation?.durationFrames ?? 12;

  const entryStyle = entryAnimation
    ? getAnimationStyle({
        presetId: entryAnimation.presetId,
        frame: localFrame,
        fps: props.fps,
        width: props.width,
        height: props.height,
        durationFrames: entryDuration,
        intensity: entryAnimation.intensity,
        easing: entryAnimation.easing,
      })
    : {};

  const framesRemaining = current.duration - localFrame;
  const exitStyle = exitAnimation && framesRemaining <= exitDuration
    ? getAnimationStyle({
        presetId: exitAnimation.presetId,
        frame: exitDuration - framesRemaining,
        fps: props.fps,
        width: props.width,
        height: props.height,
        durationFrames: exitDuration,
        intensity: exitAnimation.intensity,
        easing: exitAnimation.easing,
      })
    : {};

  // Animation style for next block during transition (entry animation starts at overlap)
  const nextEntryAnimation = next?.block.animation?.entry;
  const nextEntryDuration = nextEntryAnimation?.durationFrames ?? 12;
  const nextEntryStyle = next && nextEntryAnimation && transitionProgress > 0
    ? getAnimationStyle({
        presetId: nextEntryAnimation.presetId,
        frame: transitionProgress * transitionDuration,
        fps: props.fps,
        width: props.width,
        height: props.height,
        durationFrames: nextEntryDuration,
        intensity: nextEntryAnimation.intensity,
        easing: nextEntryAnimation.easing,
      })
    : {};

  // Transition styles using the transition utility
  const currentTransitionStyle = transitionProgress > 0
    ? getTransitionStyle({
        type: transitionType,
        layer: 'current',
        progress: transitionProgress,
        width: props.width,
        height: props.height,
        direction: transitionDirection,
        intensity: transitionIntensity,
        easing: transitionEasing,
      })
    : {};

  const nextTransitionStyle = transitionProgress > 0
    ? getTransitionStyle({
        type: transitionType,
        layer: 'next',
        progress: transitionProgress,
        width: props.width,
        height: props.height,
        direction: transitionDirection,
        intensity: transitionIntensity,
        easing: transitionEasing,
      })
    : {};

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

      {props.audio ? (
        <Audio
          src={resolveAudioSrc(props.audio.src)}
          volume={() =>
            getAudioVolume({
              frame: currentFrame,
              durationInFrames,
              fps,
              volume: props.audio!.volume,
              fadeIn: props.audio!.fadeIn,
              fadeOut: props.audio!.fadeOut,
            })
          }
          startFrom={Math.round(props.audio.startOffset * fps)}
          loop={props.audio.loop}
        />
      ) : null}

      {next && transitionProgress > 0 ? (
        <div style={{
          position: 'absolute',
          inset: 0,
          ...mergeMotionStyles(
            nextTransitionStyle,
            nextEntryStyle,
          ),
        }}>
          {renderPositionedBlock({
            positioned: {
              ...next,
              startFrame: currentFrame - transitionProgress * transitionDuration,
            },
            localFrame: transitionProgress * transitionDuration,
            props,
          })}
        </div>
      ) : null}

      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...mergeMotionStyles(
            currentTransitionStyle,
            entryStyle,
            exitStyle,
          ),
        }}
      >
        {renderPositionedBlock({positioned: current, localFrame, props})}
      </div>
    </AbsoluteFill>
  );
};
