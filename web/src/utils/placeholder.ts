export type VariantData = {
  age: string;
  gender: 'man' | 'woman';
  location: string;
  company: string;
};

export const placeholders = ['age', 'gender', 'location', 'company'] as const;

export const createEmptyVariant = (): VariantData => ({
  age: '',
  gender: 'man',
  location: '',
  company: '',
});

export const defaultVariants: VariantData[] = [
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

export const resolvePlaceholders = (
  template: string,
  data: Record<string, string>,
): string => {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
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

export const parseCsv = (input: string): VariantData[] => {
  const lines = input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  const headers = lines[0].split(',').map((header) => header.trim().toLowerCase());
  const required = ['age', 'gender', 'location', 'company'];
  const hasHeader = required.every((header) => headers.includes(header));
  const rows = hasHeader ? lines.slice(1) : lines;

  return rows.map((line) => {
    const values = line.split(',').map((value) => value.trim());
    const getValue = (key: string, index: number): string => {
      const valueIndex = hasHeader ? headers.indexOf(key) : index;
      return values[valueIndex] ?? '';
    };

    const gender = getValue('gender', 1).toLowerCase();

    return {
      age: getValue('age', 0),
      gender: gender === 'woman' ? 'woman' : 'man',
      location: getValue('location', 2),
      company: getValue('company', 3),
    };
  });
};
