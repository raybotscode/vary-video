export {ProductLaunch} from './ProductLaunch';
export {
  defaultProductLaunchProps,
  productLaunchSchema,
} from '../../templates/registry';
import {compositionSchemaFor} from '../../templates/registry';

export const productLaunchCompositionSchema =
  compositionSchemaFor('ProductLaunch');
export type {ProductLaunchProps} from '../../templates/registry';
