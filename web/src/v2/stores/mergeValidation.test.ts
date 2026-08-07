import {describe, it, expect} from 'vitest';
import {
  validateMergeTagCoverage,
  countWarnings,
  hasValidationWarnings,
  type ValidationState,
  type MergeTagWarning,
} from './mergeValidation';
import type {V2Document, MergeTag} from '@vary/v2/schema/document';

// ─── Test Helpers ──────────────────────────────────────────────────

function makeTag(id: string, key: string, opts?: Partial<MergeTag>): MergeTag {
  return {
    id,
    key,
    type: 'text',
    label: key,
    defaultValue: '',
    required: false,
    description: '',
    ...opts,
  };
}

function makeDoc(
  mergeTags: MergeTag[],
  elements: Array<{name: string; props: Record<string, unknown>}>,
): V2Document {
  return {
    schemaVersion: 3,
    id: 'test-doc',
    name: 'Test Document',
    fps: 30,
    defaultAspectRatio: '16:9',
    mergeTags,
    scenes: [
      {
        id: 'scene-1',
        name: 'Scene 1',
        durationFrames: 90,
        background: {type: 'solid', color: '#FFFFFF'},
        elements: elements.map((el, i) => ({
          id: `el-${i}`,
          name: el.name,
          type: 'text' as const,
          visible: true,
          locked: false,
          props: el.props,
          transform: {
            x: 0, y: 0, width: 0.5, height: 0.1,
            anchorX: 0, anchorY: 0, rotation: 0,
            opacity: 1, zIndex: i,
          },
          timing: {startFrame: 0, endFrame: 90},
        })),
      },
    ],
  };
}

function makeState(
  headers: string[],
  rows: Record<string, string>[],
  columnMapping?: Record<string, string>,
): ValidationState {
  return {
    headers,
    rows,
    columnMapping: columnMapping ?? {},
  };
}

function findWarning(
  warnings: MergeTagWarning[],
  type: string,
  tagKey?: string,
): MergeTagWarning | undefined {
  return warnings.find(
    (w) => w.type === type && (tagKey === undefined || w.tagKey === tagKey),
  );
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('validateMergeTagCoverage', () => {
  it('returns empty array when no merge data is imported', () => {
    const doc = makeDoc([makeTag('t1', 'Name')], [
      {name: 'Title', props: {content: 'Hello {{Name}}'}},
    ]);
    const state = makeState([], []);
    expect(validateMergeTagCoverage(doc, state)).toEqual([]);
  });

  it('returns empty array when all tags match perfectly', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name'), makeTag('t2', 'Age')],
      [
        {name: 'Title', props: {content: 'Hello {{Name}}'}},
        {name: 'Subtitle', props: {content: 'Age: {{Age}}'}},
      ],
    );
    const state = makeState(
      ['Name', 'Age'],
      [{Name: 'Ray', Age: '34'}],
      {Name: 't1', Age: 't2'},
    );
    expect(validateMergeTagCoverage(doc, state)).toEqual([]);
  });

  it('detects missing column for a tag', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name')],
      [{name: 'Title', props: {content: 'Hello {{Name}}'}}],
    );
    // No Name column at all
    const state = makeState(
      ['OtherColumn'],
      [{OtherColumn: 'foo'}],
      {},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    const w = findWarning(warnings, 'missing_column', 'Name');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
    expect(w!.message).toContain('Name');
  });

  it('detects case mismatch between tag key and CSV column', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name')],
      [{name: 'Title', props: {content: 'Hello {{Name}}'}}],
    );
    // CSV has "name" lowercase — no column mapping set, so tag→column lookup fails
    // But the function checks for case-insensitive match
    const state = makeState(
      ['name'],
      [{name: 'Ray'}],
      {},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    const w = findWarning(warnings, 'case_mismatch', 'Name');
    expect(w).toBeDefined();
    expect(w!.suggestion).toContain('name');
  });

  it('works when CSV column directly matches tag key (no column mapping)', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name')],
      [{name: 'Title', props: {content: 'Hello {{Name}}'}}],
    );
    // CSV column "Name" matches tag key — no column mapping needed
    const state = makeState(
      ['Name'],
      [{Name: 'Ray'}],
      {},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    // Name column exists with exact match → no missing column warning
    // But also no column mapping → tagToColumn doesn't have 't1' → no empty check either
    // So it should be clean since the column matches case-insensitively
    const missingWarning = findWarning(warnings, 'missing_column', 'Name');
    expect(missingWarning).toBeUndefined();
  });

  it('detects empty column for required tag', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name', {required: true})],
      [{name: 'Title', props: {content: 'Hello {{Name}}'}}],
    );
    const state = makeState(
      ['Name'],
      [{Name: ''}, {Name: '  '}], // all rows empty/whitespace
      {Name: 't1'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    const w = findWarning(warnings, 'empty_column', 'Name');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('error');
  });

  it('detects empty column for non-required tag as warning', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name', {required: false})],
      [{name: 'Title', props: {content: 'Hello {{Name}}'}}],
    );
    const state = makeState(
      ['Name'],
      [{Name: ''}],
      {Name: 't1'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    const w = findWarning(warnings, 'empty_column', 'Name');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('warning');
  });

  it('handles plain string {{key}} patterns in props', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Color')],
      [{name: 'Box', props: {fill: '{{Color}}'}}],
    );
    const state = makeState(
      ['Color'],
      [{Color: '#FF0000'}],
      {Color: 't1'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    expect(warnings).toEqual([]);
  });

  it('handles BindableText tokens', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name'), makeTag('t2', 'Age')],
      [
        {
          name: 'Intro',
          props: {
            content: {
              _type: 'bindableText',
              tokens: [
                {_type: 'literal', id: 'tok1', text: 'Hello '},
                {_type: 'tag', id: 'tok2', tagId: 't1', raw: '{{Name}}'},
                {_type: 'literal', id: 'tok3', text: ', age '},
                {_type: 'tag', id: 'tok4', tagId: 't2', raw: '{{Age}}'},
              ],
            },
          },
        },
      ],
    );
    const state = makeState(
      ['Name', 'Age'],
      [{Name: 'Ray', Age: '34'}],
      {Name: 't1', Age: 't2'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    expect(warnings).toEqual([]);
  });

  it('handles BindableValue tag references', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Accent')],
      [
        {
          name: 'Shape',
          props: {
            fill: {_type: 'tag', tagId: 't1', fallback: '#3182CE'},
          },
        },
      ],
    );
    const state = makeState(
      ['Accent'],
      [{Accent: '#FF0000'}],
      {Accent: 't1'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    expect(warnings).toEqual([]);
  });

  it('detects dangling tag (tagId not in mergeTags)', () => {
    const doc = makeDoc(
      [],
      [
        {
          name: 'Title',
          props: {
            content: {
              _type: 'bindableText',
              tokens: [
                {_type: 'tag', id: 'tok1', tagId: 'unknown:MissingTag', raw: '{{MissingTag}}'},
              ],
            },
          },
        },
      ],
    );
    const state = makeState(
      ['MissingTag'],
      [{MissingTag: 'value'}],
      {},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    const w = findWarning(warnings, 'dangling_tag', 'MissingTag');
    expect(w).toBeDefined();
    expect(w!.severity).toBe('error');
  });

  it('deduplicates warnings for the same tagId across elements', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Name')],
      [
        {name: 'Title', props: {content: 'Hello {{Name}}'}},
        {name: 'Footer', props: {content: 'By {{Name}}'}},
      ],
    );
    // No column for Name
    const state = makeState(
      ['Other'],
      [{Other: 'foo'}],
      {},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    // Should have one warning for 'Name' (deduplicated), with 2 affected elements
    const nameWarnings = warnings.filter((w) => w.tagKey === 'Name');
    expect(nameWarnings.length).toBe(1);
    expect(nameWarnings[0].affectedElements).toEqual(['Title', 'Footer']);
  });

  it('detects spelling variants (case differences) across elements', () => {
    // Same concept but different casing
    const doc = makeDoc(
      [makeTag('t1', 'name'), makeTag('t2', 'Name')],
      [
        {name: 'Title', props: {content: 'Hello {{name}}'}},
        {name: 'Subtitle', props: {content: 'Welcome {{Name}}'}},
      ],
    );
    const state = makeState(
      ['name', 'Name'],
      [{name: 'Ray', Name: 'Raymond'}],
      {name: 't1', Name: 't2'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    // Should detect that "name" and "Name" are case variants
    const caseWarnings = warnings.filter((w) => w.type === 'case_mismatch');
    expect(caseWarnings.length).toBeGreaterThan(0);
  });

  it('orders errors before warnings', () => {
    const doc = makeDoc(
      [makeTag('t1', 'Required', {required: true}), makeTag('t2', 'Optional')],
      [
        {name: 'A', props: {content: '{{Required}}'}},
        {name: 'B', props: {content: '{{Optional}}'}},
      ],
    );
    // Optional has no column at all, Required has column but empty values
    const state = makeState(
      ['Required'],
      [{Required: ''}],
      {Required: 't1'},
    );
    const warnings = validateMergeTagCoverage(doc, state);
    if (warnings.length >= 2) {
      expect(warnings[0].severity).toBe('error');
    }
  });
});

describe('countWarnings', () => {
  it('counts errors and warnings', () => {
    const warnings: MergeTagWarning[] = [
      {type: 'dangling_tag', severity: 'error', tagKey: 'X', tagId: 't1', message: ''},
      {type: 'missing_column', severity: 'warning', tagKey: 'Y', tagId: 't2', message: ''},
      {type: 'case_mismatch', severity: 'warning', tagKey: 'Z', tagId: 't3', message: ''},
    ];
    const counts = countWarnings(warnings);
    expect(counts).toEqual({errors: 1, warnings: 2});
  });

  it('returns zeros for empty array', () => {
    expect(countWarnings([])).toEqual({errors: 0, warnings: 0});
  });
});

describe('hasValidationWarnings', () => {
  it('returns true when warnings exist', () => {
    const warnings: MergeTagWarning[] = [
      {type: 'missing_column', severity: 'warning', tagKey: 'X', tagId: 't1', message: ''},
    ];
    expect(hasValidationWarnings(warnings)).toBe(true);
  });

  it('returns false for empty array', () => {
    expect(hasValidationWarnings([])).toBe(false);
  });
});
