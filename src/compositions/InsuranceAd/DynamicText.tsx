import {CSSProperties} from 'react';
import {FitText} from '../../components/FitText';
import {VariantData, resolvePlaceholders} from '../../components/util';

type DynamicTextProps = {
  template: string;
  data: VariantData;
  width: number;
  height: number;
  maxFontSize: number;
  minFontSize: number;
  color?: string;
  fontWeight?: CSSProperties['fontWeight'];
  align?: CSSProperties['textAlign'];
  lineHeight?: number;
  style?: CSSProperties;
  animationOffset?: number;
};

export const DynamicText: React.FC<DynamicTextProps> = ({
  template,
  data,
  ...fitProps
}) => {
  return <FitText text={resolvePlaceholders(template, data)} {...fitProps} />;
};
