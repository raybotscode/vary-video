export {SocialClip} from './SocialClip';
export {defaultSocialClipProps, socialClipSchema} from '../../templates/registry';
import {compositionSchemaFor} from '../../templates/registry';

export const socialClipCompositionSchema = compositionSchemaFor('SocialClip');
export type {SocialClipProps} from '../../templates/registry';
