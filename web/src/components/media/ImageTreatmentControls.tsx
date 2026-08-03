/**
 * ImageTreatmentControls — segmented fit selector plus focal point,
 * horizontal/vertical position, dark overlay, blur, and gradient controls.
 */

import React from 'react';
import type {ImageTreatment, ImageFitMode} from '@vary/shared/capabilities/types';
import {FocalPointControl} from './FocalPointControl';

export type ImageTreatmentControlsProps = {
  treatment: ImageTreatment;
  onChange: (treatment: ImageTreatment) => void;
  imageUrl?: string;
  disabled?: boolean;
};

const FIT_MODES: {value: ImageFitMode; label: string}[] = [
  {value: 'cover', label: 'Cover'},
  {value: 'contain', label: 'Contain'},
  {value: 'fit-width', label: 'Fit Width'},
  {value: 'fit-height', label: 'Fit Height'},
];

export const ImageTreatmentControls: React.FC<ImageTreatmentControlsProps> = ({
  treatment,
  onChange,
  imageUrl,
  disabled = false,
}) => {
  const update = (partial: Partial<ImageTreatment>) => {
    onChange({...treatment, ...partial});
  };

  return (
    <div className="image-treatment-controls">
      {/* Fit mode selector */}
      <div className="image-treatment-controls__section">
        <label className="image-treatment-controls__label">Fit Mode</label>
        <div className="image-treatment-controls__fit-selector">
          {FIT_MODES.map((mode) => (
            <button
              key={mode.value}
              type="button"
              className={`image-treatment-controls__fit-btn ${
                treatment.fit === mode.value
                  ? 'image-treatment-controls__fit-btn--active'
                  : ''
              }`}
              onClick={() => update({fit: mode.value})}
              disabled={disabled}
            >
              {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Focal point */}
      <div className="image-treatment-controls__section">
        <label className="image-treatment-controls__label">Focal Point</label>
        <FocalPointControl
          x={treatment.focalPoint?.x ?? 0.5}
          y={treatment.focalPoint?.y ?? 0.5}
          onChange={(x, y) =>
            update({focalPoint: {x, y}})
          }
          imageUrl={imageUrl}
          disabled={disabled}
        />
      </div>

      {/* Position */}
      <div className="image-treatment-controls__section">
        <label className="image-treatment-controls__label">Position</label>
        <div className="image-treatment-controls__position-grid">
          <select
            value={treatment.horizontalPosition ?? 'center'}
            onChange={(e) =>
              update({
                horizontalPosition: e.target.value as 'left' | 'center' | 'right',
              })
            }
            disabled={disabled}
            className="image-treatment-controls__select"
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
          <select
            value={treatment.verticalPosition ?? 'center'}
            onChange={(e) =>
              update({
                verticalPosition: e.target.value as 'top' | 'center' | 'bottom',
              })
            }
            disabled={disabled}
            className="image-treatment-controls__select"
          >
            <option value="top">Top</option>
            <option value="center">Center</option>
            <option value="bottom">Bottom</option>
          </select>
        </div>
      </div>

      {/* Dark overlay */}
      <div className="image-treatment-controls__section">
        <label className="image-treatment-controls__label">
          Dark Overlay: {Math.round((treatment.darkOverlay ?? 0) * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={treatment.darkOverlay ?? 0}
          onChange={(e) =>
            update({darkOverlay: parseFloat(e.target.value)})
          }
          disabled={disabled}
          className="image-treatment-controls__range"
        />
      </div>

      {/* Blur */}
      <div className="image-treatment-controls__section">
        <label className="image-treatment-controls__label">
          Blur: {treatment.blur ?? 0}px
        </label>
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={treatment.blur ?? 0}
          onChange={(e) =>
            update({blur: parseInt(e.target.value, 10)})
          }
          disabled={disabled}
          className="image-treatment-controls__range"
        />
      </div>
    </div>
  );
};
