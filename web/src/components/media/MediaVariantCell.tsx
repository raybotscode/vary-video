/**
 * MediaVariantCell — variant table cell for per-row media URL fields.
 *
 * Shows URL input, thumbnail preview, validation state, and
 * replace/remove buttons. Designed for mobile-first editing.
 */

import React, {useState, useCallback} from 'react';
import type {MediaColumnInfo} from '../../utils/mediaFields';
import {validateMediaUrlClient} from '../../utils/mediaFields';

export type MediaVariantCellProps = {
  column: MediaColumnInfo;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
};

export const MediaVariantCell: React.FC<MediaVariantCellProps> = ({
  column,
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

  if (isEditing) {
    return (
      <div className="media-variant-cell media-variant-cell--editing">
        <input
          type="url"
          className="media-variant-cell__input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`https://example.com/${column.kind}.jpg`}
          autoFocus
          disabled={disabled}
        />
        <div className="media-variant-cell__actions">
          <button
            type="button"
            className="media-variant-cell__btn media-variant-cell__btn--save"
            onClick={handleSave}
            disabled={disabled}
          >
            Save
          </button>
          <button
            type="button"
            className="media-variant-cell__btn media-variant-cell__btn--cancel"
            onClick={() => {
              setEditValue(value);
              setIsEditing(false);
            }}
            disabled={disabled}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="media-variant-cell">
      {hasValue ? (
        <div className="media-variant-cell__preview">
          <img
            src={value}
            alt={column.label}
            className="media-variant-cell__thumb"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          <div className="media-variant-cell__info">
            <span className="media-variant-cell__url" title={value}>
              {value.length > 40 ? value.slice(0, 40) + '…' : value}
            </span>
            {error && (
              <span className="media-variant-cell__error">{error}</span>
            )}
          </div>
        </div>
      ) : (
        <span className="media-variant-cell__empty">
          {column.required ? 'Required' : 'Optional'}
        </span>
      )}
      <div className="media-variant-cell__actions">
        <button
          type="button"
          className="media-variant-cell__btn media-variant-cell__btn--edit"
          onClick={() => setIsEditing(true)}
          disabled={disabled}
        >
          {hasValue ? 'Replace' : 'Add'}
        </button>
        {hasValue && (
          <button
            type="button"
            className="media-variant-cell__btn media-variant-cell__btn--remove"
            onClick={handleRemove}
            disabled={disabled}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
};
