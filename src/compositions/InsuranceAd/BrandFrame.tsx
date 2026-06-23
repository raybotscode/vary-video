import {Img, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {FitText} from '../../components/FitText';

type BrandFrameProps = {
  brandColor: string;
  secondaryColor: string;
  logoUrl: string;
  ctaText: string;
};

export const BrandFrame: React.FC<BrandFrameProps> = ({
  brandColor,
  secondaryColor,
  logoUrl,
  ctaText,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const intro = spring({frame: frame - 360, fps, config: {damping: 14}});
  const fade = interpolate(frame, [355, 380], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity: fade,
        background: `linear-gradient(135deg, ${brandColor}, ${secondaryColor})`,
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'Inter',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 90,
          left: 110,
          right: 110,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 34,
          fontWeight: 700,
        }}
      >
        {logoUrl ? (
          <Img
            src={logoUrl}
            style={{height: 84, maxWidth: 360, objectFit: 'contain'}}
          />
        ) : (
          <div>Vary.video</div>
        )}
        <div style={{fontSize: 26, opacity: 0.82}}>vary.video</div>
      </div>

      <div
        style={{
          transform: `scale(${0.92 + intro * 0.08})`,
          width: width * 0.72,
          height: height * 0.22,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <FitText
          text={ctaText}
          width={width * 0.72}
          height={height * 0.22}
          maxFontSize={96}
          minFontSize={42}
          color="white"
          fontWeight={800}
          animationOffset={360}
        />
      </div>

      <div
        style={{
          marginTop: 38,
          padding: '18px 42px',
          border: '2px solid rgba(255,255,255,0.44)',
          borderRadius: 8,
          fontSize: 31,
          fontWeight: 700,
          letterSpacing: 0,
        }}
      >
        Start your quote in minutes
      </div>
    </div>
  );
};
