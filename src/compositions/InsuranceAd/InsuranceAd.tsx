import {loadFont} from '@remotion/google-fonts/Inter';
import {
  AbsoluteFill,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {mulberry32, safeHexColor, hashSeed} from '../../components/util';
import {BrandFrame} from './BrandFrame';
import {DynamicText} from './DynamicText';
import {InsuranceAdProps, insuranceAdSchema} from './schema';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

const backgroundFor = (props: InsuranceAdProps): string => {
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const backgroundColor = safeHexColor(props.backgroundColor, '#F7FAFC');

  if (props.backgroundType === 'solid') {
    return backgroundColor;
  }

  if (props.backgroundType === 'image') {
    return '#F7FAFC';
  }

  return `linear-gradient(135deg, #F7FAFC 0%, #EDF2F7 58%, ${backgroundColor}22 100%)`;
};

export const InsuranceAd: React.FC<InsuranceAdProps> = (rawProps) => {
  const props = insuranceAdSchema.parse(rawProps);
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const seed = hashSeed(JSON.stringify(props.data));
  const random = mulberry32(seed);

  const hookOpacity = interpolate(frame, [0, 20, 82, 96], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const hookY = interpolate(frame, [0, 24], [42, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const valueOpacity = interpolate(frame, [90, 116, 338, 360], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const valueSpring = spring({
    frame: frame - 94,
    fps,
    config: {damping: 18, stiffness: 90},
  });

  const accentOne = {left: 80 + random() * 120, top: 92 + random() * 70};
  const accentTwo = {right: 120 + random() * 180, bottom: 118 + random() * 80};

  return (
    <AbsoluteFill
      style={{
        background: backgroundFor(props),
        fontFamily: 'Inter',
        color: brandColor,
        overflow: 'hidden',
      }}
    >
      {props.backgroundType === 'image' && props.backgroundImageUrl ? (
        <Img
          src={props.backgroundImageUrl}
          style={{
            position: 'absolute',
            inset: 0,
            width,
            height,
            objectFit: 'cover',
            opacity: 0.22,
          }}
        />
      ) : null}

      <div
        style={{
          position: 'absolute',
          left: accentOne.left,
          top: accentOne.top,
          width: 170,
          height: 8,
          background: secondaryColor,
          borderRadius: 8,
          opacity: 0.38,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: accentTwo.right,
          bottom: accentTwo.bottom,
          width: 280,
          height: 280,
          border: `28px solid ${secondaryColor}24`,
          borderRadius: 140,
        }}
      />

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: hookOpacity,
          transform: `translateY(${hookY}px)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            width: width * 0.8,
            height: height * 0.34,
          }}
        >
          <DynamicText
            template={props.headlineTemplate}
            data={props.data}
            width={width * 0.8}
            height={height * 0.34}
            maxFontSize={90}
            minFontSize={34}
            color={brandColor}
            fontWeight={800}
          />
        </div>
        <div
          style={{
            marginTop: 30,
            width: 150,
            height: 8,
            background: secondaryColor,
            borderRadius: 8,
          }}
        />
      </div>

      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: valueOpacity,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          transform: `translateX(${(1 - valueSpring) * 70}px)`,
        }}
      >
        <div
          style={{
            width: width * 0.68,
            height: height * 0.16,
          }}
        >
          <DynamicText
            template={props.subheadlineTemplate}
            data={props.data}
            width={width * 0.68}
            height={height * 0.16}
            maxFontSize={70}
            minFontSize={28}
            color={brandColor}
            fontWeight={800}
            animationOffset={96}
          />
        </div>
        <div
          style={{
            marginTop: 42,
            width: width * 0.56,
            height: height * 0.18,
            color: '#243042',
          }}
        >
          <DynamicText
            template="Fast, tailored insurance options for {{location}} residents, backed by {{company}}."
            data={props.data}
            width={width * 0.56}
            height={height * 0.18}
            maxFontSize={44}
            minFontSize={22}
            color="#243042"
            fontWeight={600}
            lineHeight={1.18}
            animationOffset={118}
          />
        </div>
        <div
          style={{
            marginTop: 48,
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            color: brandColor,
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              background: '#E53E3E',
              borderRadius: 9,
              display: 'inline-block',
            }}
          />
          Quote options built for your profile
        </div>
      </div>

      <BrandFrame
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        logoUrl={props.logoUrl}
        ctaText={props.ctaText}
      />
    </AbsoluteFill>
  );
};
