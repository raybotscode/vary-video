import {fillTextBox, fitText, measureText} from '@remotion/layout-utils';
import {CSSProperties, useMemo} from 'react';
import {interpolate, useCurrentFrame} from 'remotion';

type FitTextProps = {
  text: string;
  width: number;
  height: number;
  fontFamily?: string;
  fontWeight?: CSSProperties['fontWeight'];
  maxFontSize: number;
  minFontSize: number;
  color?: string;
  align?: CSSProperties['textAlign'];
  lineHeight?: number;
  style?: CSSProperties;
  animationOffset?: number;
};

type LayoutResult = {
  lines: string[];
  fontSize: number;
  exceedsBox: boolean;
};

const splitWords = (text: string): string[] => {
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)
    .map((word, index) => (index === 0 ? word : ` ${word}`));
};

const layoutAtSize = ({
  text,
  width,
  height,
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
}: {
  text: string;
  width: number;
  height: number;
  fontFamily: string;
  fontWeight: CSSProperties['fontWeight'];
  fontSize: number;
  lineHeight: number;
}): LayoutResult => {
  const maxLines = Math.max(1, Math.floor(height / (fontSize * lineHeight)));
  const builder = fillTextBox({maxBoxWidth: width, maxLines});
  const lines: string[] = [''];
  let exceedsBox = false;

  for (const word of splitWords(text)) {
    const result = builder.add({
      text: word,
      fontFamily,
      fontWeight: fontWeight === undefined ? undefined : String(fontWeight),
      fontSize,
      validateFontIsLoaded: false,
    });

    if (result.exceedsBox) {
      exceedsBox = true;
      break;
    }

    if (result.newLine) {
      lines.push(word.trimStart());
    } else {
      lines[lines.length - 1] = `${lines[lines.length - 1]}${word}`.trimStart();
    }
  }

  return {lines, fontSize, exceedsBox};
};

const truncateLine = ({
  line,
  width,
  fontFamily,
  fontWeight,
  fontSize,
}: {
  line: string;
  width: number;
  fontFamily: string;
  fontWeight: CSSProperties['fontWeight'];
  fontSize: number;
}): string => {
  const suffix = '...';
  if (
    measureText({
      text: line,
      fontFamily,
      fontWeight: fontWeight === undefined ? undefined : String(fontWeight),
      fontSize,
      validateFontIsLoaded: false,
    }).width <= width
  ) {
    return line;
  }

  let candidate = line;
  while (candidate.length > 0) {
    const next = `${candidate.trimEnd()}${suffix}`;
    const measured = measureText({
      text: next,
      fontFamily,
      fontWeight: fontWeight === undefined ? undefined : String(fontWeight),
      fontSize,
      validateFontIsLoaded: false,
    });

    if (measured.width <= width) {
      return next;
    }

    candidate = candidate.slice(0, -1);
  }

  return suffix;
};

export const FitText: React.FC<FitTextProps> = ({
  text,
  width,
  height,
  fontFamily = 'Inter',
  fontWeight = 700,
  maxFontSize,
  minFontSize,
  color = '#111827',
  align = 'center',
  lineHeight = 1.08,
  style,
  animationOffset = 0,
}) => {
  const frame = useCurrentFrame();
  const layout = useMemo(() => {
    const singleLineFit = fitText({
      text,
      withinWidth: width,
      fontFamily,
      fontWeight: String(fontWeight),
      validateFontIsLoaded: false,
    }).fontSize;

    const startingSize = Math.max(
      minFontSize,
      Math.min(maxFontSize, singleLineFit),
    );

    for (let size = startingSize; size >= minFontSize; size -= 1) {
      const candidate = layoutAtSize({
        text,
        width,
        height,
        fontFamily,
        fontWeight,
        fontSize: size,
        lineHeight,
      });

      if (!candidate.exceedsBox) {
        return candidate;
      }
    }

    const fallback = layoutAtSize({
      text,
      width,
      height,
      fontFamily,
      fontWeight,
      fontSize: minFontSize,
      lineHeight,
    });
    const lastLineIndex = fallback.lines.length - 1;
    fallback.lines[lastLineIndex] = truncateLine({
      line: fallback.lines[lastLineIndex] ?? text,
      width,
      fontFamily,
      fontWeight,
      fontSize: minFontSize,
    });

    return {...fallback, fontSize: minFontSize, exceedsBox: false};
  }, [
    fontFamily,
    fontWeight,
    height,
    lineHeight,
    maxFontSize,
    minFontSize,
    text,
    width,
  ]);

  const animatedSize = interpolate(
    frame - animationOffset,
    [0, 12],
    [Math.max(minFontSize, layout.fontSize - 6), layout.fontSize],
    {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'},
  );

  return (
    <div
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
        color,
        fontFamily,
        fontWeight,
        fontSize: animatedSize,
        lineHeight,
        textAlign: align,
        whiteSpace: 'pre-wrap',
        ...style,
      }}
    >
      {layout.lines.map((line, index) => (
        <span key={`${line}-${index}`}>{line}</span>
      ))}
    </div>
  );
};
