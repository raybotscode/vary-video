import {Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import type {WebinarPromoProps} from '../../templates/registry';

export const HeroScene: React.FC<{props: WebinarPromoProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const primaryColor = safeHexColor(props.primaryColor, '#2563eb');
  const accentColor = safeHexColor(props.accentColor, '#14b8a6');
  const textColor = safeHexColor(props.textColor, '#f8fafc');
  const random = mulberry32(hashSeed(`${props.seed}-hero`));
  const enter = spring({frame, fps, config: {damping: 16, stiffness: 92}});
  const opacity = interpolate(frame, [0, 18, 134, 150], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          right: 90 + random() * 70,
          top: 80 + random() * 40,
          width: 420,
          height: 420,
          borderRadius: 210,
          border: `46px solid ${accentColor}1f`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 108,
          width: 150 + random() * 80,
          height: 8,
          borderRadius: 8,
          background: accentColor,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 96,
          top: 140,
          color: accentColor,
          fontSize: 32,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase' as const,
        }}
      >
        Live Webinar
      </div>

      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 240,
          width: width * 0.62,
          transform: `translateY(${(1 - enter) * 46}px)`,
        }}
      >
        <DynamicText
          template={props.eventTitleTemplate}
          data={props.data}
          width={width * 0.58}
          height={height * 0.26}
          maxFontSize={104}
          minFontSize={48}
          color={textColor}
          fontWeight={800}
          align="left"
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 130,
          top: 640,
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
          transform: `translateY(${(1 - enter) * 30}px)`,
        }}
      >
        <DynamicText
          template={props.hostNameTemplate}
          data={props.data}
          width={width * 0.5}
          height={height * 0.08}
          maxFontSize={44}
          minFontSize={26}
          color={textColor}
          fontWeight={600}
          align="left"
          animationOffset={12}
        />
        <DynamicText
          template={props.audienceTemplate}
          data={props.data}
          width={width * 0.5}
          height={height * 0.08}
          maxFontSize={40}
          minFontSize={24}
          color={primaryColor}
          fontWeight={700}
          align="left"
          animationOffset={24}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          left: 130,
          bottom: 110,
          width: 260,
          height: 10,
          borderRadius: 8,
          background: primaryColor,
          opacity: 0.5,
        }}
      />
    </div>
  );
};
