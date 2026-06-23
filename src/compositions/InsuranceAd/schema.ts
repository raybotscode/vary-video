import {z} from 'zod';

export const insuranceAdSchema = z.object({
  headlineTemplate: z
    .string()
    .default('Are you a {{age}} year old {{gender}} in {{location}}?'),
  subheadlineTemplate: z
    .string()
    .default('Get covered today with {{company}}'),
  data: z.record(z.string(), z.string()).default({
    age: '52',
    gender: 'person',
    location: 'Dublin',
    company: 'Vary Cover',
  }),
  ctaText: z.string().default('Get a Quote Today'),
  brandColor: z.string().default('#1A365D'),
  secondaryColor: z.string().default('#3182CE'),
  logoUrl: z.string().default(''),
  backgroundType: z.enum(['solid', 'gradient', 'image']).default('gradient'),
  backgroundColor: z.string().default('#1A365D'),
  backgroundImageUrl: z.string().optional(),
});

export type InsuranceAdProps = z.infer<typeof insuranceAdSchema>;

export const defaultInsuranceAdProps: InsuranceAdProps =
  insuranceAdSchema.parse({});

export const insuranceAdCompositionSchema = {
  id: 'InsuranceAd',
  durationInFrames: 450,
  fps: 30,
  width: 1920,
  height: 1080,
  props: {
    headlineTemplate: 'string',
    subheadlineTemplate: 'string',
    data: 'Record<string, string>',
    ctaText: 'string',
    brandColor: 'hex color',
    secondaryColor: 'hex color',
    logoUrl: 'string',
    backgroundType: '"solid" | "gradient" | "image"',
    backgroundColor: 'hex color',
    backgroundImageUrl: 'string | undefined',
  },
  defaults: defaultInsuranceAdProps,
};
