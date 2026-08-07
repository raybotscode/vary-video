import {Composition} from 'remotion';
import {
  InsuranceAd,
  ProductLaunch,
  RealEstate,
  SceneBlockPlayer,
  SocialClip,
  V2Native,
  WebinarPromo,
  defaultInsuranceAdProps,
  defaultProductLaunchProps,
  defaultRealEstateProps,
  defaultSocialClipProps,
  defaultWebinarPromoProps,
  getDefaultSceneBlockPlayerProps,
  getDefaultV2NativeProps,
  getSequenceDuration,
  getV2DocumentDuration,
  sceneBlockPlayerSchema,
  v2NativeSchema,
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
        durationInFrames={getSequenceDuration(getDefaultSceneBlockPlayerProps().blocks)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={getDefaultSceneBlockPlayerProps()}
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
      <Composition
        id="V2Native"
        component={V2Native}
        durationInFrames={getV2DocumentDuration(getDefaultV2NativeProps().document)}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={getDefaultV2NativeProps()}
        calculateMetadata={({props}) => {
          const parsed = v2NativeSchema.parse(props);
          const duration = getV2DocumentDuration(parsed.document);
          const aspectRatio = parsed.document.defaultAspectRatio;

          return {
            durationInFrames: duration,
            fps: parsed.document.fps,
            width: parsed.width,
            height: parsed.height,
          };
        }}
      />
    </>
  );
};
