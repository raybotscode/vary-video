import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {FitText} from '../../components/FitText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {ProductLaunchProps} from '../../templates/registry';

export const PricingScene: React.FC<{props: ProductLaunchProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#FF6B5B');
  const localFrame = frame - 280;
  const intro = spring({frame: localFrame, fps, config: {damping: 14}});
  const opacity = interpolate(frame, [276, 294, 346, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: width * 0.18,
          top: height * 0.22,
          width: width * 0.64,
          height: height * 0.44,
          borderRadius: 8,
          background: 'white',
          boxShadow: '0 28px 84px rgba(20, 28, 45, 0.14)',
          border: `3px solid ${secondaryColor}22`,
          transform: `scale(${0.94 + intro * 0.06})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <DynamicText
          template={props.taglineTemplate}
          data={props.data}
          width={width * 0.48}
          height={height * 0.14}
          maxFontSize={54}
          minFontSize={28}
          color={brandColor}
          fontWeight={800}
        />
        <div
          style={{
            width: 160,
            height: 8,
            borderRadius: 8,
            background: accentColor,
            margin: '28px 0',
          }}
        />
        <FitText
          text={resolvePlaceholders(props.ctaText, props.data)}
          width={width * 0.42}
          height={height * 0.1}
          maxFontSize={56}
          minFontSize={28}
          color={secondaryColor}
          fontWeight={800}
          animationOffset={290}
        />
      </div>
    </div>
  );
};
