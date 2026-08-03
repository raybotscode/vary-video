/**
 * FocalPointControl — click/tap target over a thumbnail.
 *
 * Edits normalized {x, y} focal point values (0..1).
 */

import React, {useCallback, useRef} from 'react';

export type FocalPointControlProps = {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  imageUrl?: string;
  disabled?: boolean;
};

export const FocalPointControl: React.FC<FocalPointControlProps> = ({
  x,
  y,
  onChange,
  imageUrl,
  disabled = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const newX = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newY = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

      onChange(newX, newY);
    },
    [onChange, disabled],
  );

  return (
    <div className="focal-point-control">
      <div
        ref={containerRef}
        className="focal-point-control__target"
        onClick={handleClick}
        style={{
          cursor: disabled ? 'default' : 'crosshair',
          backgroundImage: imageUrl ? `url(${imageUrl})` : undefined,
        }}
      >
        <div
          className="focal-point-control__marker"
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
          }}
        />
      </div>
      <div className="focal-point-control__values">
        <span>X: {Math.round(x * 100)}%</span>
        <span>Y: {Math.round(y * 100)}%</span>
      </div>
    </div>
  );
};
