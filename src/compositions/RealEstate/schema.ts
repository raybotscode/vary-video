export {RealEstate} from './RealEstate';
export {defaultRealEstateProps, realEstateSchema} from '../../templates/registry';
import {compositionSchemaFor} from '../../templates/registry';

export const realEstateCompositionSchema = compositionSchemaFor('RealEstate');
export type {RealEstateProps} from '../../templates/registry';
