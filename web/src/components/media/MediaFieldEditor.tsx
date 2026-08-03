/**
 * MediaFieldEditor — large mobile-friendly control for media URLs.
 *
 * Features: URL input, thumbnail preview, replace/remove buttons,
 * validation state, clear error text, and stock media search.
 */

import React, {useState, useCallback} from 'react';
import type {MediaColumnInfo} from '../../utils/mediaFields';
import {validateMediaUrlClient} from '../../utils/mediaFields';
import PixabaySearchPicker from './PixabaySearchPicker';

export type MediaFieldEditorProps = {
  field: MediaColumnInfo;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const MediaFieldEditor: React.FC<MediaFieldEditorProps> = ({
  field,
  value,
  onChange,
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [showPicker, setShowPicker] = useState(false);
  const error = validateMediaUrlClient(value);
  const hasValue = value !== '' && value !== undefined;

  const handleSave = useCallback(() => {
    onChange(editValue);
    setIsEditing(false);
  }, [editValue, onChange]);

  const handleRemove = useCallback(() => {
    onChange('');
    setIsEditing(false);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSave();
      } else if (e.key === 'Escape') {
        setEditValue(value);
        setIsEditing(false);
      }
    },
    [handleSave, value],
  );

  if (!hasValue && !isEditing) {
    return (
      <div className="media-field-editor media-field-editor--empty">
        <div className="media-field-editor__placeholder">
          <span className="media-field-editor__label">{field.label}</span>
          <span className="media-field-editor__hint">No image set</span>
        </div>
        <div className="media-field-editor__actions">
          <button
            type="button"
            className="media-field-editor__btn media-field-editor__btn--add"
            onClick={() => setIsEditing(true)}
            disabled={disabled}
          >
            Add URL
          </button>
          <button
            type="button"
            className="media-field-editor__btn media-field-editor__btn--stock"
            onClick={() => setShowPicker(true)}
            disabled={disabled}
          >
            🔍 Search stock
          </button>
        </div>
        {showPicker && (
          <PixabaySearchPicker
            mediaType="images"
            onSelect={(url) => {
              onChange(url);
              setEditValue(url);
              setShowPicker(false);
              setIsEditing(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="media-field-editor media-field-editor--editing">
        <label className="media-field-editor__label">{field.label}</label>
        <div className="media-field-editor__input-group">
          <input
            type="url"
            className="media-field-editor__input"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="https://example.com/image.jpg"
            disabled={disabled}
            autoFocus
          />
        </div>
        <div className="media-field-editor__actions">
          <button
            type="button"
            className="media-field-editor__btn media-field-editor__btn--save"
            onClick={handleSave}
            disabled={disabled}
          >
            Save
          </button>
          <button
            type="button"
            className="media-field-editor__btn media-field-editor__btn--cancel"
            onClick={() => {
              setEditValue(value);
              setIsEditing(false);
            }}
            disabled={disabled}
          >
            Cancel
          </button>
          <button
            type="button"
            className="media-field-editor__btn media-field-editor__btn--stock"
            onClick={() => setShowPicker(true)}
            disabled={disabled}
          >
            🔍 Stock
          </button>
        </div>
        {error && <span className="media-field-editor__error">{error}</span>}
        {showPicker && (
          <PixabaySearchPicker
            mediaType="images"
            onSelect={(url) => {
              onChange(url);
              setEditValue(url);
              setShowPicker(false);
              setIsEditing(false);
            }}
            onClose={() => setShowPicker(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="media-field-editor media-field-editor--filled">
      <span className="media-field-editor__label">{field.label}</span>
      <div className="media-field-editor__preview">
        <img src={value} alt={field.label} className="media-field-editor__thumb" />
      </div>
      <div className="media-field-editor__actions">
        <button
          type="button"
          className="media-field-editor__btn media-field-editor__btn--replace"
          onClick={() => setIsEditing(true)}
          disabled={disabled}
        >
          Replace
        </button>
        <button
          type="button"
          className="media-field-editor__btn media-field-editor__btn--remove"
          onClick={handleRemove}
          disabled={disabled}
        >
          Remove
        </button>
        <button
          type="button"
          className="media-field-editor__btn media-field-editor__btn--stock"
          onClick={() => setShowPicker(true)}
          disabled={disabled}
        >
          🔍 Stock
        </button>
      </div>
      {showPicker && (
        <PixabaySearchPicker
          mediaType="images"
          onSelect={(url) => {
            onChange(url);
            setEditValue(url);
            setShowPicker(false);
            setIsEditing(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
};
