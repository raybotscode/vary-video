/**
 * CreateTagInline — inline form to create a new merge tag.
 *
 * Used inside BindingSheet when no suitable tag exists.
 * Creates a tag via document store dispatch, returns the new tag to the parent.
 */

import {useState} from 'react';
import type {MergeTag, MergeTagType} from '@vary/v2/schema/document';
import {generateTagId} from '@vary/v2/schema/bindable';

interface CreateTagInlineProps {
  /** Suggested key for the new tag (derived from property name) */
  suggestedKey: string;
  /** Property type to pre-fill the tag type */
  propertyType: string;
  /** Called when the tag is created via dispatch */
  onCreated: (tag: MergeTag) => void;
  /** Cancel creating */
  onCancel: () => void;
}

/** Map property types to suggested merge tag types */
const PROPERTY_TO_TAG_TYPE: Record<string, MergeTagType> = {
  text: 'text',
  color: 'color',
  number: 'number',
  image: 'url',
  boolean: 'boolean',
};

export default function CreateTagInline({
  suggestedKey,
  propertyType,
  onCreated,
  onCancel,
}: CreateTagInlineProps) {
  const [key, setKey] = useState(suggestedKey || 'new_tag');
  const [type, setType] = useState<MergeTagType>(
    PROPERTY_TO_TAG_TYPE[propertyType] ?? 'text',
  );
  const [label, setLabel] = useState('');
  const [defaultValue, setDefaultValue] = useState('');

  const handleSubmit = () => {
    const newTag: MergeTag = {
      id: generateTagId(),
      key: key.trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '') || 'new_tag',
      type,
      label: label.trim() || key,
      defaultValue,
      required: false,
      description: '',
    };
    onCreated(newTag);
  };

  const isValid = key.trim().length > 0;

  return (
    <div>
      <label style={{
        fontSize: 12, fontWeight: 600, color: '#6B7280',
        display: 'block', marginBottom: 8,
      }}>
        Create New Merge Tag
      </label>

      <div style={{display: 'flex', flexDirection: 'column', gap: 12}}>
        {/* Key */}
        <div>
          <label style={fieldLabel}>Key</label>
          <input type="text" value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="e.g. headline"
            style={inputStyle} />
          <div style={hintStyle}>
            Used as {'{{key}}'} in text content. Letters, numbers, and underscores only.
          </div>
        </div>

        {/* Type */}
        <div>
          <label style={fieldLabel}>Type</label>
          <select value={type} onChange={(e) => setType(e.target.value as MergeTagType)}
            style={{...inputStyle, WebkitAppearance: 'none'}}>
            {(['text', 'number', 'currency', 'color', 'image', 'boolean', 'url', 'date'] as MergeTagType[]).map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Label */}
        <div>
          <label style={fieldLabel}>Label</label>
          <input type="text" value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Display name (optional)"
            style={inputStyle} />
        </div>

        {/* Default Value */}
        <div>
          <label style={fieldLabel}>Default Value</label>
          <input type="text" value={defaultValue}
            onChange={(e) => setDefaultValue(e.target.value)}
            placeholder="Fallback value (optional)"
            style={inputStyle} />
        </div>

        {/* Actions */}
        <div style={{display: 'flex', gap: 8, marginTop: 8}}>
          <button onClick={onCancel} style={{
            flex: 1, padding: '12px', borderRadius: 8,
            background: '#F3F4F6', border: '1px solid #E5E7EB',
            color: '#374151', fontSize: 14, fontWeight: 500,
            cursor: 'pointer',
          }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={!isValid} style={{
            flex: 1, padding: '12px', borderRadius: 8,
            background: isValid ? '#3B82F6' : '#E5E7EB',
            color: isValid ? '#fff' : '#9CA3AF',
            border: 'none', fontSize: 14, fontWeight: 600,
            cursor: isValid ? 'pointer' : 'not-allowed',
          }}>
            Create Tag
          </button>
        </div>
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 500, color: '#9CA3AF',
  display: 'block', marginBottom: 4,
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 14,
  border: '1px solid #E5E7EB', borderRadius: 8,
  background: '#F9FAFB', boxSizing: 'border-box',
};

const hintStyle: React.CSSProperties = {
  fontSize: 11, color: '#9CA3AF', marginTop: 4,
};
