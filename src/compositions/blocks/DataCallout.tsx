import {interpolate, spring} from 'remotion';
import {FitText} from '../../components/FitText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {BlockRenderProps} from './registry';

export const DataCallout: React.FC<BlockRenderProps> = ({
  frame,
  fps,
  width,
  height,
  content,
  brand,
  data,
}) => {
  const brandColor = safeHexColor(brand.brandColor, '#1A365D');
  const accentColor = safeHexColor(brand.accentColor, '#FF6B5B');
  const secondaryColor = safeHexColor(brand.secondaryColor, '#3182CE');
  const enter = spring({frame, fps, config: {damping: 14, stiffness: 100}});
  const opacity = interpolate(frame, [0, 14, 104, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        background: `linear-gradient(135deg, #FFFFFF 0%, ${secondaryColor}18 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          width: width * 0.7,
          height: height * 0.44,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.9 + enter * 0.1})`,
        }}
      >
        <FitText
          text={resolvePlaceholders(content.value ?? '{{value}}', data)}
          width={width * 0.58}
          height={height * 0.18}
          maxFontSize={150}
          minFontSize={58}
          color={accentColor}
          fontWeight={800}
        />
        <div
          style={{
            width: 170,
            height: 8,
            borderRadius: 8,
            background: brandColor,
            margin: '30px 0',
          }}
        />
        <FitText
          text={resolvePlaceholders(content.label ?? '{{label}}', data)}
          width={width * 0.52}
          height={height * 0.1}
          maxFontSize={52}
          minFontSize={26}
          color={brandColor}
          fontWeight={800}
          animationOffset={12}
        />
      </div>
    </div>
  );
};
