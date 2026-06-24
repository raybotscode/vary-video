import {getFrontendTemplate} from './templates';

export type VariantData = Record<string, string>;

export const getPlaceholdersForTemplate = (templateId: string): string[] =>
  getFrontendTemplate(templateId).placeholders ?? [];

export const placeholders = getPlaceholdersForTemplate('InsuranceAd');

export const createEmptyVariant = (templateId = 'InsuranceAd'): VariantData =>
  Object.fromEntries(
    getPlaceholdersForTemplate(templateId).map((placeholder) => [
      placeholder,
      '',
    ]),
  );

export const defaultVariantsForTemplate = (templateId: string): VariantData[] => {
  if (templateId === 'ProductLaunch') {
    return [
      {
        product_name: 'Vary Studio',
        tagline: 'Launch campaign videos in minutes',
        feature1: 'Personalized copy at scale',
        feature2: 'On-brand motion templates',
        feature3: 'Batch renders for every segment',
        company: 'Vary.video',
      },
      {
        product_name: 'Pulse Desk',
        tagline: 'One workspace for customer teams',
        feature1: 'Live account health',
        feature2: 'Automated playbooks',
        feature3: 'Board-ready reporting',
        company: 'Pulse Labs',
      },
    ];
  }

  if (templateId === 'RealEstate') {
    return [
      {
        property_name: 'The Elm Residence',
        tagline: 'Light-filled family living near the city',
        price: '€745,000',
        bedrooms: '4',
        bathrooms: '3',
        sqft: '2,180',
        location: 'Rathmines, Dublin',
        agent: 'Maeve Kelly',
      },
      {
        property_name: 'Harbour View',
        tagline: 'Modern apartment with a private balcony',
        price: '€520,000',
        bedrooms: '2',
        bathrooms: '2',
        sqft: '1,120',
        location: 'Galway Docks',
        agent: 'Sean Byrne',
      },
    ];
  }

  if (templateId === 'SocialClip') {
    return [
      {
        hook: 'Stop making one ad for every audience',
        body: 'Turn one idea into personalized clips for every campaign segment.',
        cta: 'Create your batch',
        brand: 'Vary.video',
      },
      {
        hook: 'Your launch needs more than one video',
        body: 'Swap hooks, bodies, and CTAs without rebuilding the edit.',
        cta: 'Start today',
        brand: 'Vary.video',
      },
    ];
  }

  return [
    {
      age: '52',
      gender: 'man',
      location: 'Dublin',
      company: 'Vary Cover',
    },
    {
      age: '38',
      gender: 'woman',
      location: 'Galway',
      company: 'Northstar Insurance',
    },
  ];
};

export const defaultVariants = defaultVariantsForTemplate('InsuranceAd');

export const resolvePlaceholders = (
  template: string,
  data: Record<string, string>,
): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_ -]+)\s*\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim();
    return data[key] || `{{${key}}}`;
  });
};

export const insertPlaceholder = (
  value: string,
  placeholder: string,
  start: number | null,
  end: number | null,
): string => {
  const token = `{{${placeholder}}}`;
  const insertionStart = start ?? value.length;
  const insertionEnd = end ?? insertionStart;

  return `${value.slice(0, insertionStart)}${token}${value.slice(insertionEnd)}`;
};

export const parseCsv = (input: string, columns?: string[]): VariantData[] => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const fallbackColumns = columns ?? [];
  const firstValues = lines[0].split(',').map((value) => value.trim());
  const normalizedHeaders = firstValues.map((header) => header.toLowerCase());
  const hasHeader =
    fallbackColumns.length === 0 ||
    fallbackColumns.every((column) => normalizedHeaders.includes(column.toLowerCase()));
  const headers = hasHeader ? normalizedHeaders : fallbackColumns;
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const values = line.split(',').map((value) => value.trim());

    return Object.fromEntries(
      headers.map((header, index) => {
        const valueIndex = hasHeader
          ? normalizedHeaders.indexOf(header.toLowerCase())
          : index;
        return [header, values[valueIndex] ?? ''];
      }),
    );
  });
};
