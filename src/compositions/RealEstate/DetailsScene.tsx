import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import type {RealEstateProps} from '../../templates/registry';

export const DetailsScene: React.FC<{props: RealEstateProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#38A169');
  const localFrame = frame - 160;
  const intro = spring({frame: localFrame, fps, config: {damping: 17}});
  const opacity = interpolate(frame, [156, 178, 282, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 130,
          fontSize: 30,
          fontWeight: 800,
          color: accentColor,
          textTransform: 'uppercase',
        }}
      >
        Property Details
      </div>
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 230,
          width: width * 0.72,
          height: height * 0.44,
          borderRadius: 8,
          background: 'white',
          border: `3px solid ${brandColor}14`,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 40,
          padding: 52,
          transform: `translateX(${(1 - intro) * 58}px)`,
        }}
      >
        <div>
          <span style={{fontSize: 24, fontWeight: 800, color: secondaryColor}}>
            Space
          </span>
          <DynamicText
            template={props.specsLine}
            data={props.data}
            width={width * 0.3}
            height={height * 0.14}
            maxFontSize={54}
            minFontSize={28}
            color={brandColor}
            fontWeight={800}
            align="left"
            animationOffset={166}
          />
        </div>
        <div>
          <span style={{fontSize: 24, fontWeight: 800, color: secondaryColor}}>
            Location
          </span>
          <DynamicText
            template={props.locationLine}
            data={props.data}
            width={width * 0.3}
            height={height * 0.14}
            maxFontSize={54}
            minFontSize={28}
            color={brandColor}
            fontWeight={800}
            align="left"
            animationOffset={178}
          />
        </div>
        <div
          style={{
            gridColumn: '1 / -1',
            fontSize: 34,
            fontWeight: 700,
            color: '#344054',
          }}
        >
          Listed by {resolvePlaceholders('{{agent}}', props.data)}
        </div>
      </div>
    </div>
  );
};
