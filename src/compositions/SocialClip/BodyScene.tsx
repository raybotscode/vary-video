import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {SocialClipProps} from '../../templates/registry';

export const BodyScene: React.FC<{props: SocialClipProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#9F7AEA');
  const intro = spring({frame: frame - 110, fps, config: {damping: 15}});
  const opacity = interpolate(frame, [106, 126, 238, 260], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 135,
          color: secondaryColor,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {resolvePlaceholders('{{brand}}', props.data)}
      </div>
      <div
        style={{
          position: 'absolute',
          left: 140,
          top: 250,
          width: width * 0.66,
          transform: `translateX(${(1 - intro) * 66}px)`,
        }}
      >
        <DynamicText
          template={props.bodyTemplate}
          data={props.data}
          width={width * 0.62}
          height={height * 0.24}
          maxFontSize={72}
          minFontSize={34}
          color={brandColor}
          fontWeight={800}
          align="left"
          animationOffset={112}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 140,
          bottom: 150,
          width: 220,
          height: 220,
          borderRadius: 8,
          background: accentColor,
          opacity: 0.85,
          transform: `rotate(${interpolate(intro, [0, 1], [8, 0])}deg)`,
        }}
      />
    </div>
  );
};
