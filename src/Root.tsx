import {Composition} from 'remotion';
import {
  InsuranceAd,
  ProductLaunch,
  RealEstate,
  SocialClip,
  defaultInsuranceAdProps,
  defaultProductLaunchProps,
  defaultRealEstateProps,
  defaultSocialClipProps,
} from './compositions';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="InsuranceAd"
        component={InsuranceAd}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultInsuranceAdProps}
      />
      <Composition
        id="ProductLaunch"
        component={ProductLaunch}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultProductLaunchProps}
      />
      <Composition
        id="RealEstate"
        component={RealEstate}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultRealEstateProps}
      />
      <Composition
        id="SocialClip"
        component={SocialClip}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultSocialClipProps}
      />
    </>
  );
};
