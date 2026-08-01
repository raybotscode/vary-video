export {WebinarPromo} from './WebinarPromo';
export {
  defaultWebinarPromoProps,
  webinarPromoSchema,
} from '../../templates/registry';
import {compositionSchemaFor} from '../../templates/registry';

export const webinarPromoCompositionSchema =
  compositionSchemaFor('WebinarPromo');
export type {WebinarPromoProps} from '../../templates/registry';
