import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img} from 'remotion';
import {BrandFrame} from '../../components/BrandFrame';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import {realEstateSchema, type RealEstateProps} from '../../templates/registry';
import {CTAScene} from './CTAScene';
import {DetailsScene} from './DetailsScene';
import {HeroScene} from './HeroScene';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

const backgroundFor = (props: RealEstateProps): string => {
  const backgroundColor = safeHexColor(props.backgroundColor, '#F7FAFC');
  const accentColor = safeHexColor(props.accentColor, '#38A169');
  if (props.backgroundType === 'solid') {
    return backgroundColor;
  }
  if (props.backgroundType === 'image') {
    return '#F7FAFC';
  }
  return `linear-gradient(135deg, #FFFFFF 0%, ${backgroundColor}12 55%, ${accentColor}18 100%)`;
};

export const RealEstate: React.FC<RealEstateProps> = (rawProps) => {
  const props = realEstateSchema.parse(rawProps);
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#38A169');
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
          style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.16}}
        />
      ) : null}
      <div
        style={{
          position: 'absolute',
          left: 90 + random() * 50,
          bottom: 90,
          width: 260,
          height: 260,
          border: `28px solid ${accentColor}1f`,
          borderRadius: 130,
        }}
      />
      <HeroScene props={props} />
      <DetailsScene props={props} />
      <CTAScene props={props} />
      <BrandFrame
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        logoUrl={props.logoUrl}
        ctaText={props.ctaText}
      />
    </AbsoluteFill>
  );
};
