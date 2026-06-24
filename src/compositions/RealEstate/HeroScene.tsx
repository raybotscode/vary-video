import {Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import type {RealEstateProps} from '../../templates/registry';

export const HeroScene: React.FC<{props: RealEstateProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const accentColor = safeHexColor(props.accentColor, '#38A169');
  const random = mulberry32(hashSeed(JSON.stringify(props.data)));
  const intro = spring({frame, fps, config: {damping: 16}});
  const opacity = interpolate(frame, [0, 20, 132, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      {props.propertyImageUrl ? (
        <Img
          src={props.propertyImageUrl}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: width * 0.48,
            height,
            objectFit: 'cover',
            opacity: 0.95,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            right: 120,
            top: 145,
            width: width * 0.34,
            height: height * 0.56,
            borderRadius: 8,
            background: `linear-gradient(145deg, ${brandColor}22, ${accentColor}44)`,
            border: `4px solid ${brandColor}18`,
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 190 + random() * 14,
          width: width * 0.45,
          transform: `translateY(${(1 - intro) * 45}px)`,
        }}
      >
        <DynamicText
          template={props.headlineTemplate}
          data={props.data}
          width={width * 0.42}
          height={height * 0.2}
          maxFontSize={82}
          minFontSize={38}
          color={brandColor}
          fontWeight={800}
          align="left"
        />
        <DynamicText
          template={props.taglineTemplate}
          data={props.data}
          width={width * 0.38}
          height={height * 0.12}
          maxFontSize={42}
          minFontSize={24}
          color="#344054"
          fontWeight={600}
          align="left"
          animationOffset={20}
        />
        <div
          style={{
            marginTop: 34,
            color: accentColor,
            fontSize: 58,
            fontWeight: 800,
          }}
        >
          <DynamicText
            template={props.priceTemplate}
            data={props.data}
            width={width * 0.32}
            height={height * 0.08}
            maxFontSize={58}
            minFontSize={30}
            color={accentColor}
            fontWeight={800}
            align="left"
            animationOffset={32}
          />
        </div>
      </div>
    </div>
  );
};
