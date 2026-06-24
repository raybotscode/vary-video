import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FitText} from '../../components/FitText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {RealEstateProps} from '../../templates/registry';

export const CTAScene: React.FC<{props: RealEstateProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#38A169');
  const intro = spring({frame: frame - 310, fps, config: {damping: 15}});
  const opacity = interpolate(frame, [306, 324, 346, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: width * 0.2,
          top: height * 0.2,
          width: width * 0.6,
          height: height * 0.46,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})`,
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.94 + intro * 0.06})`,
        }}
      >
        <div style={{fontSize: 31, fontWeight: 700, opacity: 0.82}}>
          {resolvePlaceholders('{{agent}}', props.data)}
        </div>
        <FitText
          text={resolvePlaceholders(props.ctaText, props.data)}
          width={width * 0.44}
          height={height * 0.14}
          maxFontSize={66}
          minFontSize={32}
          color="white"
          fontWeight={800}
          animationOffset={314}
        />
        <div
          style={{
            marginTop: 24,
            width: 140,
            height: 8,
            borderRadius: 8,
            background: accentColor,
          }}
        />
      </div>
    </div>
  );
};
