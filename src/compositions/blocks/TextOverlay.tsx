import {interpolate} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {safeHexColor} from '../../components/util';
import type {BlockRenderProps} from './registry';

export const TextOverlay: React.FC<BlockRenderProps> = ({
  frame,
  width,
  height,
  content,
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
