import {loadFont} from '@remotion/google-fonts/Inter';
import {AbsoluteFill, Img} from 'remotion';
import {BrandFrame} from '../../components/BrandFrame';
import {hashSeed, mulberry32, safeHexColor} from '../../components/util';
import {socialClipSchema, type SocialClipProps} from '../../templates/registry';
import {BodyScene} from './BodyScene';
import {HookScene} from './HookScene';
import {OutroScene} from './OutroScene';

loadFont('normal', {
  weights: ['400', '600', '700', '800'],
  subsets: ['latin'],
  ignoreTooManyRequestsWarning: true,
});

const backgroundFor = (props: SocialClipProps): string => {
  const backgroundColor = safeHexColor(props.backgroundColor, '#F7FAFC');
  const accentColor = safeHexColor(props.accentColor, '#9F7AEA');
  if (props.backgroundType === 'solid') {
    return backgroundColor;
  }
  if (props.backgroundType === 'image') {
    return '#F7FAFC';
  }
  return `linear-gradient(135deg, #FFFFFF 0%, ${accentColor}18 52%, ${backgroundColor}18 100%)`;
};

export const SocialClip: React.FC<SocialClipProps> = (rawProps) => {
  const props = socialClipSchema.parse(rawProps);
  const brandColor = safeHexColor(props.brandColor, '#1A365D');
  const secondaryColor = safeHexColor(props.secondaryColor, '#3182CE');
  const accentColor = safeHexColor(props.accentColor, '#9F7AEA');
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
          top: 90 + random() * 50,
          right: 110,
          width: 240,
          height: 240,
          borderRadius: 120,
          background: `${accentColor}1f`,
        }}
      />
      <HookScene props={props} />
      <BodyScene props={props} />
      <OutroScene props={props} />
      <BrandFrame
        brandColor={brandColor}
        secondaryColor={secondaryColor}
        logoUrl={props.logoUrl}
        ctaText={props.ctaText}
      />
    </AbsoluteFill>
  );
};
