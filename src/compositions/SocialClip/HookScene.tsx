import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {DynamicText} from '../../components/DynamicText';
import {safeHexColor} from '../../components/util';
import type {SocialClipProps} from '../../templates/registry';

export const HookScene: React.FC<{props: SocialClipProps}> = ({props}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const accentColor = safeHexColor(props.accentColor, '#9F7AEA');
  const impact = spring({frame, fps, config: {damping: 12, stiffness: 110}});
  const opacity = interpolate(frame, [0, 14, 86, 100], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{position: 'absolute', inset: 0, opacity}}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${0.92 + impact * 0.08})`,
        }}
      >
        <div style={{width: width * 0.78, height: height * 0.34}}>
          <DynamicText
            template={props.hookTemplate}
            data={props.data}
            width={width * 0.78}
            height={height * 0.34}
            maxFontSize={104}
            minFontSize={42}
            color={brandColor}
            fontWeight={800}
          />
        </div>
      </div>
      <div
        style={{
          position: 'absolute',
          left: width * 0.42,
          bottom: 190,
          width: width * 0.16,
          height: 10,
          borderRadius: 8,
          background: accentColor,
        }}
      />
    </div>
  );
};
