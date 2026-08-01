import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill} from 'remotion';
import {BrandFrame} from '../../components/BrandFrame';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import {
  type WebinarPromoProps,
  webinarPromoSchema,
} from '../../templates/registry';
import {DetailsScene} from './DetailsScene';
import {HeroScene} from './HeroScene';
import {OutroScene} from './OutroScene';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

const backgroundFor = (props: WebinarPromoProps): string => {
  const backgroundColor = safeHexColor(props.backgroundColor, '#0f172a');
  const primaryColor = safeHexColor(props.primaryColor, '#2563eb');
  return `linear-gradient(145deg, ${backgroundColor} 0%, ${primaryColor}22 52%, ${backgroundColor} 100%)`;
};

export const WebinarPromo: React.FC<WebinarPromoProps> = (rawProps) => {
  const props = webinarPromoSchema.parse(rawProps);
  const brandColor = safeHexColor(props.primaryColor, '#2563eb');
  const secondaryColor = safeHexColor(props.accentColor, '#14b8a6');
  const accentColor = safeHexColor(props.accentColor, '#14b8a6');
  const random = mulberry32(hashSeed(props.seed));

  return (
    <AbsoluteFill
      style={{
        background: backgroundFor(props),
        color: safeHexColor(props.textColor, '#f8fafc'),
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 80 + random() * 40,
          bottom: 90,
          width: 300,
          height: 300,
          borderRadius: 150,
          border: `26px solid ${accentColor}14`,
        }}
      />
      <HeroScene props={props} />
      <DetailsScene props={props} />
      <OutroScene props={props} />
      <BrandFrame
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        logoUrl=""
        ctaText={props.ctaText}
        tagline="Limited seats available"
      />
    </AbsoluteFill>
  );
};
