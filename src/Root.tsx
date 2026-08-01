import {Composition} from 'remotion';
import {
  InsuranceAd,
  ProductLaunch,
  RealEstate,
  SceneBlockPlayer,
  SocialClip,
  WebinarPromo,
  defaultInsuranceAdProps,
  defaultProductLaunchProps,
  defaultRealEstateProps,
  defaultSceneBlockPlayerProps,
  defaultSocialClipProps,
  defaultWebinarPromoProps,
  getSequenceDuration,
  sceneBlockPlayerSchema,
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
      <Composition
        id="WebinarPromo"
        component={WebinarPromo}
        durationInFrames={450}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultWebinarPromoProps}
      />
      <Composition
        id="SceneBlockPlayer"
        component={SceneBlockPlayer}
        durationInFrames={getSequenceDuration(defaultSceneBlockPlayerProps.blocks)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={defaultSceneBlockPlayerProps}
        calculateMetadata={({props}) => {
          const parsed = sceneBlockPlayerSchema.parse(props);

          return {
            durationInFrames: getSequenceDuration(parsed.blocks),
            fps: parsed.fps,
            width: parsed.width,
            height: parsed.height,
          };
        }}
      />
    </>
  );
};
