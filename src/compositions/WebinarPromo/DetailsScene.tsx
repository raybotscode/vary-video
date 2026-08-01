import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import type {WebinarPromoProps} from '../../templates/registry';

export const DetailsScene: React.FC<{props: WebinarPromoProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const primaryColor = safeHexColor(props.primaryColor, '#2563eb');
  const accentColor = safeHexColor(props.accentColor, '#14b8a6');
  const textColor = safeHexColor(props.textColor, '#f8fafc');
  const random = mulberry32(hashSeed(`${props.seed}-details`));
  const enter = spring({
    frame: frame - 150,
    fps,
    config: {damping: 16, stiffness: 92},
  });
  const opacity = interpolate(frame, [150, 170, 284, 300], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 96,
          width: 140 + random() * 60,
          height: 8,
          borderRadius: 8,
          background: accentColor,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 110,
          top: 128,
          color: accentColor,
          fontSize: 30,
          fontWeight: 800,
          letterSpacing: 4,
          textTransform: 'uppercase' as const,
        }}
      >
        Event Details
      </div>

      <div
        style={{
          position: 'absolute',
          left: 150,
          top: 250,
          width: width * 0.5,
          transform: `translateY(${(1 - enter) * 40}px)`,
        }}
      >
        <DynamicText
          template={props.eventDateTemplate}
          data={props.data}
          width={width * 0.46}
          height={height * 0.14}
          maxFontSize={88}
          minFontSize={40}
          color={textColor}
          fontWeight={800}
          align="left"
          animationOffset={150}
        />
        <DynamicText
          template={props.eventTimeTemplate}
          data={props.data}
          width={width * 0.46}
          height={height * 0.1}
          maxFontSize={56}
          minFontSize={30}
          color={primaryColor}
          fontWeight={700}
          align="left"
          animationOffset={165}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          right: 110,
          top: 250,
          width: width * 0.3,
          minHeight: height * 0.36,
          padding: '42px 40px',
          borderRadius: 24,
          background: `${primaryColor}1a`,
          border: `2px solid ${primaryColor}40`,
          transform: `translateX(${(1 - enter) * 36}px)`,
        }}
      >
        <div
          style={{
            color: accentColor,
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: 3,
            textTransform: 'uppercase' as const,
            marginBottom: 22,
          }}
        >
          Key Takeaway
        </div>
        <DynamicText
          template={props.keyTakeawayTemplate}
          data={props.data}
          width={width * 0.24}
          height={height * 0.2}
          maxFontSize={52}
          minFontSize={26}
          color={textColor}
          fontWeight={600}
          align="left"
          animationOffset={180}
        />
      </div>
    </div>
  );
};
