import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {safeHexColor} from '../../components/util';
import type {ProductLaunchProps} from '../../templates/registry';

export const FeaturesScene: React.FC<{props: ProductLaunchProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const localFrame = frame - 130;
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const accentColor = safeHexColor(props.accentColor, '#FF6B5B');
  const opacity = interpolate(frame, [126, 146, 252, 270], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const features = [
    props.feature1Template,
    props.feature2Template,
    props.feature3Template,
  ];

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 110,
          color: accentColor,
          fontSize: 28,
          fontWeight: 800,
          textTransform: 'uppercase',
        }}
      >
        Built for launch day
      </div>
      <div
        style={{
          position: 'absolute',
          left: 130,
          right: 130,
          top: 210,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 34,
        }}
      >
        {features.map((feature, index) => {
          const intro = spring({
            frame: localFrame - index * 12,
            fps,
            config: {damping: 16, stiffness: 95},
          });
          return (
            <div
              key={feature}
              style={{
                height: height * 0.48,
                border: `3px solid ${brandColor}18`,
                borderRadius: 8,
                padding: 38,
                background: 'rgba(255,255,255,0.78)',
                transform: `translateY(${(1 - intro) * 56}px)`,
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 8,
                  background: accentColor,
                  color: 'white',
                  fontSize: 28,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 42,
                }}
              >
                {index + 1}
              </div>
              <DynamicText
                template={feature}
                data={props.data}
                width={(width - 328) / 3}
                height={height * 0.24}
                maxFontSize={48}
                minFontSize={26}
                color={brandColor}
                fontWeight={800}
                align="left"
                animationOffset={130 + index * 12}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
