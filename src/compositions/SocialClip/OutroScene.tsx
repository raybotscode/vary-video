import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FitText} from '../../components/FitText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {SocialClipProps} from '../../templates/registry';

export const OutroScene: React.FC<{props: SocialClipProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const accentColor = safeHexColor(props.accentColor, '#9F7AEA');
  const intro = spring({frame: frame - 270, fps, config: {damping: 14}});
  const opacity = interpolate(frame, [266, 286, 346, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: width * 0.2,
          top: height * 0.25,
          width: width * 0.6,
          height: height * 0.34,
          borderRadius: 8,
          background: brandColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.9 + intro * 0.1})`,
        }}
      >
        <FitText
          text={resolvePlaceholders(props.ctaText, props.data)}
          width={width * 0.46}
          height={height * 0.16}
          maxFontSize={78}
          minFontSize={36}
          color="white"
          fontWeight={800}
          animationOffset={272}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          left: width * 0.5 - 95,
          top: height * 0.62,
          width: 190,
          height: 10,
          borderRadius: 8,
          background: accentColor,
        }}
      />
    </div>
  );
};
