import {Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import type {ProductLaunchProps} from '../../templates/registry';

export const IntroScene: React.FC<{props: ProductLaunchProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const accentColor = safeHexColor(props.accentColor, '#FF6B5B');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const random = mulberry32(hashSeed(JSON.stringify(props.data)));
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 92}});
  const opacity = interpolate(frame, [0, 18, 104, 120], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          top: 94,
          left: 96,
          width: 150 + random() * 80,
          height: 8,
          borderRadius: 8,
          background: accentColor,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: 100,
          top: 116,
          color: brandColor,
          fontSize: 30,
          fontWeight: 800,
        }}
      >
        {props.data.company}
      </div>
      {props.productImageUrl ? (
        <Img
          src={props.productImageUrl}
          style={{
            position: 'absolute',
            right: 130,
            bottom: 120,
            width: width * 0.28,
            height: height * 0.42,
            objectFit: 'contain',
            transform: `translateY(${(1 - enter) * 34}px) scale(${0.92 + enter * 0.08})`,
          }}
        />
      ) : (
        <div
          style={{
            position: 'absolute',
            right: 190,
            bottom: 145,
            width: 360,
            height: 360,
            borderRadius: 36,
            background: `linear-gradient(145deg, ${secondaryColor}, ${accentColor})`,
            transform: `rotate(${interpolate(enter, [0, 1], [-8, 0])}deg)`,
            boxShadow: '0 32px 80px rgba(20, 28, 45, 0.18)',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 255,
          width: width * 0.56,
          transform: `translateY(${(1 - enter) * 46}px)`,
        }}
      >
        <DynamicText
          template={props.headlineTemplate}
          data={props.data}
          width={width * 0.54}
          height={height * 0.22}
          maxFontSize={92}
          minFontSize={42}
          color={brandColor}
          fontWeight={800}
          align="left"
        />
        <DynamicText
          template={props.taglineTemplate}
          data={props.data}
          width={width * 0.46}
          height={height * 0.12}
          maxFontSize={44}
          minFontSize={24}
          color="#243042"
          fontWeight={600}
          align="left"
          animationOffset={18}
        />
      </div>
    </div>
  );
};
