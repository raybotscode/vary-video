import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img} from 'remotion';
import {BrandFrame} from '../../components/BrandFrame';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import {
  productLaunchSchema,
  type ProductLaunchProps,
} from '../../templates/registry';
import {FeaturesScene} from './FeaturesScene';
import {IntroScene} from './IntroScene';
import {PricingScene} from './PricingScene';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

const backgroundFor = (props: ProductLaunchProps): string => {
  const backgroundColor = safeHexColor(props.backgroundColor, '#F7FAFC');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  if (props.backgroundType === 'solid') {
    return backgroundColor;
  }
  if (props.backgroundType === 'image') {
    return '#F7FAFC';
  }
  return `linear-gradient(135deg, #FFFFFF 0%, ${backgroundColor}16 48%, ${secondaryColor}20 100%)`;
};

export const ProductLaunch: React.FC<ProductLaunchProps> = (rawProps) => {
  const props = productLaunchSchema.parse(rawProps);
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#FF6B5B');
  const random = mulberry32(hashSeed(JSON.stringify(props.data)));

  return (
    <AbsoluteFill
      style={{
        background: backgroundFor(props),
        color: brandColor,
        fontFamily: 'Inter',
        overflow: 'hidden',
      }}
    >
      {props.backgroundType === 'image' && props.backgroundImageUrl ? (
        <Img
          src={props.backgroundImageUrl}
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.18}}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          right: 110 + random() * 90,
          top: 90,
          width: 300,
          height: 300,
          borderRadius: 150,
          border: `30px solid ${accentColor}20`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 90,
          bottom: 85,
          width: 360,
          height: 14,
          borderRadius: 8,
          background: secondaryColor,
          opacity: 0.3,
        }}
      />
      <IntroScene props={props} />
      <FeaturesScene props={props} />
      <PricingScene props={props} />
      <BrandFrame
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        logoUrl={props.logoUrl}
        ctaText={props.ctaText}
      />
    </AbsoluteFill>
  );
};
