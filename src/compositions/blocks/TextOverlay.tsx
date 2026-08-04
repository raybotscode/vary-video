import {interpolate} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {safeHexColor} from '../../components/util';
import type {BlockRenderProps} from './registry';
import {getElementLayout, percentToPixels, getElementAnimationStyle} from './layoutUtils';

export const TextOverlay: React.FC<BlockRenderProps> = ({
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
  const secondaryColor = safeHexColor(brand.secondaryColor, '#3182CE');
  const backgroundColor = safeHexColor(
    content.backgroundColor ?? brand.backgroundColor,
    '#F7FAFC',
  );
  const opacity = interpolate(frame, [0, 16, 104, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Resolve headline layout with fallback to hardcoded defaults
  const headlineLayout = getElementLayout(layout, 'headline', {
    x: 50,  // center
    y: 50,  // center
    fontSize: 86,
    color: brandColor,
  });

  // Per-element animation for headline
  const headlineAnimStyle = getElementAnimationStyle(
    headlineLayout.animation,
    frame,
    fps,
    width,
    height,
  );

  // If layout is provided, use percentage-based positioning
  const hasLayoutOverrides = layout?.['headline'] != null;

  if (hasLayoutOverrides) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity,
          background: `linear-gradient(135deg, ${backgroundColor}, ${secondaryColor}20)`,
          fontFamily: 'Inter',
          ...headlineAnimStyle,
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${headlineLayout.x}%`,
            top: `${headlineLayout.y}%`,
            transform: 'translate(-50%, -50%)',
            width: width * 0.74,
            minHeight: height * 0.28,
            padding: 48,
            borderRadius: 8,
            background: 'rgba(255,255,255,0.72)',
            border: `3px solid ${headlineLayout.color}14`,
          }}
        >
          <DynamicText
            template={content.headline ?? '{{headline}}'}
            data={data}
            width={width * 0.68}
            height={height * 0.22}
            maxFontSize={headlineLayout.fontSize}
            minFontSize={Math.max(12, headlineLayout.fontSize - 52)}
            color={headlineLayout.color}
            fontWeight={800}
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
        background: `linear-gradient(135deg, ${backgroundColor}, ${secondaryColor}20)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          width: width * 0.74,
          minHeight: height * 0.28,
          padding: 48,
          borderRadius: 8,
          background: 'rgba(255,255,255,0.72)',
          border: `3px solid ${brandColor}14`,
        }}
      >
        <DynamicText
          template={content.headline ?? '{{headline}}'}
          data={data}
          width={width * 0.68}
          height={height * 0.22}
          maxFontSize={86}
          minFontSize={34}
          color={brandColor}
          fontWeight={800}
        />
      </div>
    </div>
  );
};
