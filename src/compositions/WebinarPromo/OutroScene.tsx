import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {safeHexColor} from '../../components/util';
import type {WebinarPromoProps} from '../../templates/registry';

export const OutroScene: React.FC<{props: WebinarPromoProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const accentColor = safeHexColor(props.accentColor, '#14b8a6');
  const textColor = safeHexColor(props.textColor, '#f8fafc');
  const enter = spring({
    frame: frame - 300,
    fps,
    config: {damping: 14},
  });
  const opacity = interpolate(frame, [300, 318, 440, 450], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 34,
      }}
    >
      <div
        style={{
          width: 120,
          height: 8,
          borderRadius: 8,
          background: accentColor,
          transform: `scaleX(${0.6 + enter * 0.4})`,
        }}
      />
      <div
        style={{
          width: width * 0.62,
          height: height * 0.2,
          transform: `scale(${0.94 + enter * 0.06})`,
        }}
      >
        <DynamicText
          template={props.ctaText}
          data={props.data}
          width={width * 0.62}
          height={height * 0.2}
          maxFontSize={108}
          minFontSize={52}
          color={textColor}
          fontWeight={800}
          animationOffset={300}
        />
      </div>
      <DynamicText
        template={props.brandName}
        data={props.data}
        width={width * 0.5}
        height={height * 0.08}
        maxFontSize={44}
        minFontSize={24}
        color={accentColor}
        fontWeight={700}
        animationOffset={316}
      />
    </div>
  );
};
