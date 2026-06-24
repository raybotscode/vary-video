import {Sequence} from 'remotion';
import {BrandFrame} from '../../components/BrandFrame';
import {resolvePlaceholders, safeHexColor} from '../../components/util';
import {FeaturesScene} from '../ProductLaunch/FeaturesScene';
import {IntroScene} from '../ProductLaunch/IntroScene';
import {PricingScene} from '../ProductLaunch/PricingScene';
import {CTAScene} from '../RealEstate/CTAScene';
import {DetailsScene} from '../RealEstate/DetailsScene';
import {HeroScene} from '../RealEstate/HeroScene';
import {BodyScene} from '../SocialClip/BodyScene';
import {HookScene} from '../SocialClip/HookScene';
import {OutroScene} from '../SocialClip/OutroScene';
import {
  productLaunchSchema,
  realEstateSchema,
  socialClipSchema,
} from '../../templates/registry';
import type {
  ProductLaunchProps,
  RealEstateProps,
  SocialClipProps,
} from '../../templates/registry';
import type {BlockRenderProps} from './registry';

const sceneOffset = (props: BlockRenderProps, originalStartFrame: number): number =>
  (props.startFrame ?? 0) - originalStartFrame;

const makeProductLaunchProps = ({
  content,
  brand,
  data,
}: BlockRenderProps): ProductLaunchProps =>
  productLaunchSchema.parse({
    ...content,
    data,
    brandColor: brand.brandColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    logoUrl: brand.logoUrl,
    backgroundType: brand.backgroundType,
    backgroundColor: brand.backgroundColor,
    backgroundImageUrl: brand.backgroundImageUrl,
  });

const makeRealEstateProps = ({
  content,
  brand,
  data,
}: BlockRenderProps): RealEstateProps =>
  realEstateSchema.parse({
    ...content,
    data,
    brandColor: brand.brandColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    logoUrl: brand.logoUrl,
    backgroundType: brand.backgroundType,
    backgroundColor: brand.backgroundColor,
    backgroundImageUrl: brand.backgroundImageUrl,
  });

const makeSocialClipProps = ({
  content,
  brand,
  data,
}: BlockRenderProps): SocialClipProps =>
  socialClipSchema.parse({
    ...content,
    data,
    brandColor: brand.brandColor,
    secondaryColor: brand.secondaryColor,
    accentColor: brand.accentColor,
    logoUrl: brand.logoUrl,
    backgroundType: brand.backgroundType,
    backgroundColor: brand.backgroundColor,
    backgroundImageUrl: brand.backgroundImageUrl,
  });

export const blockAdapters: Record<
  string,
  React.FC<BlockRenderProps>
> = {
  'product-intro': (props) => (
    <Sequence from={sceneOffset(props, 0)}>
      <IntroScene props={makeProductLaunchProps(props)} />
    </Sequence>
  ),
  'features-grid': (props) => (
    <Sequence from={sceneOffset(props, 130)}>
      <FeaturesScene props={makeProductLaunchProps(props)} />
    </Sequence>
  ),
  'pricing-card': (props) => (
    <Sequence from={sceneOffset(props, 280)}>
      <PricingScene props={makeProductLaunchProps(props)} />
    </Sequence>
  ),
  'property-hero': (props) => (
    <Sequence from={sceneOffset(props, 0)}>
      <HeroScene props={makeRealEstateProps(props)} />
    </Sequence>
  ),
  'property-details': (props) => (
    <Sequence from={sceneOffset(props, 160)}>
      <DetailsScene props={makeRealEstateProps(props)} />
    </Sequence>
  ),
  'agent-cta': (props) => (
    <Sequence from={sceneOffset(props, 310)}>
      <CTAScene props={makeRealEstateProps(props)} />
    </Sequence>
  ),
  'social-hook': (props) => (
    <Sequence from={sceneOffset(props, 0)}>
      <HookScene props={makeSocialClipProps(props)} />
    </Sequence>
  ),
  'social-body': (props) => (
    <Sequence from={sceneOffset(props, 110)}>
      <BodyScene props={makeSocialClipProps(props)} />
    </Sequence>
  ),
  'social-outro': (props) => (
    <Sequence from={sceneOffset(props, 270)}>
      <OutroScene props={makeSocialClipProps(props)} />
    </Sequence>
  ),
  'brand-frame': (props) => (
    <Sequence from={sceneOffset(props, 360)}>
      <BrandFrame
        brandColor={safeHexColor(props.brand.brandColor, '#1A365D')}
        secondaryColor={safeHexColor(props.brand.secondaryColor, '#3182CE')}
        logoUrl={props.brand.logoUrl}
        ctaText={resolvePlaceholders(
          props.content.ctaText ?? 'Get Started Today',
          props.data,
        )}
      />
    </Sequence>
  ),
};
