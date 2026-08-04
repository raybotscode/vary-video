/**
 * Maps template IDs to their sample CSV files.
 * Each template that has sample data gets an entry here.
 */
export const sampleDataMap: Record<string, {filename: string; label: string}> = {
  InsuranceAd: {filename: 'insurance-ad.csv', label: 'Sample Insurance Quotes'},
  ProductLaunch: {filename: 'product-launch.csv', label: 'Sample Products'},
  RealEstate: {filename: 'real-estate.csv', label: 'Sample Properties'},
  SocialClip: {filename: 'social-clip.csv', label: 'Sample Social Clips'},
  WebinarPromo: {filename: 'webinar-promo.csv', label: 'Sample Webinars'},
};

export function getSampleDataUrl(templateId: string): string | null {
  const entry = sampleDataMap[templateId];
  return entry ? `/samples/${entry.filename}` : null;
}

export function getSampleDataLabel(templateId: string): string | null {
  return sampleDataMap[templateId]?.label ?? null;
}
