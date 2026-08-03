/**
 * MediaFieldEditor — large mobile-friendly control for media URLs.
 *
 * Features: URL input, thumbnail preview, replace/remove buttons,
 * validation state, and clear error text.
 */

import React, {useState, useCallback} from 'react';
import type {MediaColumnInfo} from '../../utils/mediaFields';
import {validateMediaUrlClient} from '../../utils/mediaFields';

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

  return (
    <div className={`media-field-editor ${error ? 'media-field-editor--error' : ''}`}>
      <div className="media-field-editor__header">
        <label className="media-field-editor__label">
          {field.label}
          {field.required && <span className="media-field-editor__required">*</span>}
        </label>
      </div>

      {hasValue && !isEditing ? (
        <div className="media-field-editor__preview">
          <img
            src={value}
            alt={field.label}
            className="media-field-editor__thumb"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
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
          </div>
        </div>
      ) : (
        <div className="media-field-editor__input-group">
          <input
            type="url"
            className="media-field-editor__input"
            value={isEditing ? editValue : value}
            onChange={(e) => {
              if (isEditing) {
                setEditValue(e.target.value);
              } else {
                onChange(e.target.value);
              }
            }}
            onKeyDown={handleKeyDown}
            placeholder={`https://example.com/${field.kind}.jpg`}
            disabled={disabled}
            autoFocus={isEditing}
          />
          {isEditing && (
            <div className="media-field-editor__edit-actions">
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
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="media-field-editor__error">
          {error}
        </div>
      )}
    </div>
  );
};
