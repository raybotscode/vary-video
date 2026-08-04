import {interpolate, spring} from 'remotion';
import {FitText} from '../../components/FitText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {BlockRenderProps} from './registry';
import {getElementLayout, getElementAnimationStyle} from './layoutUtils';

export const DataCallout: React.FC<BlockRenderProps> = ({
  frame,
  fps,
  width,
  height,
  content,
  layout,
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

  // Resolve layout for value and label
  const valueLayout = getElementLayout(layout, 'value', {
    x: 50, y: 50, fontSize: 150, color: accentColor,
  });
  const labelLayout = getElementLayout(layout, 'label', {
    x: 50, y: 65, fontSize: 52, color: brandColor,
  });

  const hasLayoutOverrides = layout?.['value'] != null || layout?.['label'] != null;

  // Per-element animations
  const valueAnimStyle = getElementAnimationStyle(valueLayout.animation, frame, fps, width, height);
  const labelAnimStyle = getElementAnimationStyle(labelLayout.animation, frame, fps, width, height);

  if (hasLayoutOverrides) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          background: `linear-gradient(135deg, #FFFFFF 0%, ${secondaryColor}18 100%)`,
          fontFamily: 'Inter',
        }}
      >
        {/* Value element — positioned absolutely */}
        <div
          style={{
            position: 'absolute',
            left: `${valueLayout.x}%`,
            top: `${valueLayout.y}%`,
            transform: `translate(-50%, -50%) scale(${0.9 + enter * 0.1})`,
            ...valueAnimStyle,
          }}
        >
          <FitText
            text={resolvePlaceholders(content.value ?? '{{value}}', data)}
            width={width * 0.58}
            height={height * 0.18}
            maxFontSize={valueLayout.fontSize}
            minFontSize={Math.max(12, valueLayout.fontSize - 92)}
            color={valueLayout.color}
            fontWeight={800}
          />
        </div>

        {/* Divider */}
        <div
          style={{
            position: 'absolute',
            left: `${(valueLayout.x + labelLayout.x) / 2}%`,
            top: `${(valueLayout.y + labelLayout.y) / 2}%`,
            transform: 'translate(-50%, -50%)',
            width: 170,
            height: 8,
            borderRadius: 8,
            background: brandColor,
          }}
        />

        {/* Label element — positioned absolutely */}
        <div
          style={{
            position: 'absolute',
            left: `${labelLayout.x}%`,
            top: `${labelLayout.y}%`,
            transform: `translate(-50%, -50%) scale(${0.9 + enter * 0.1})`,
            ...labelAnimStyle,
          }}
        >
          <FitText
            text={resolvePlaceholders(content.label ?? '{{label}}', data)}
            width={width * 0.52}
            height={height * 0.1}
            maxFontSize={labelLayout.fontSize}
            minFontSize={Math.max(12, labelLayout.fontSize - 26)}
            color={labelLayout.color}
            fontWeight={800}
            animationOffset={12}
          />
        </div>
      </div>
    );
  }

  // Default hardcoded layout (backward compatible)
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
