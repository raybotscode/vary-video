import type {CSSProperties} from 'react';

/**
 * CSS style output from animation/transition calculations.
 * Only opacity and transform — applied as wrapper styles around block content.
 */
export type AnimationStyle = Pick<CSSProperties, 'opacity' | 'transform'>;
