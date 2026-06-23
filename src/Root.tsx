import {Composition} from 'remotion';
import {InsuranceAd, defaultInsuranceAdProps} from './compositions';

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="InsuranceAd"
      component={InsuranceAd}
      durationInFrames={450}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={defaultInsuranceAdProps}
    />
  );
};
