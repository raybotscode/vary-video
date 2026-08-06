/**
 * V2 Image Renderer — renders an ImageElement as a DOM node.
 *
 * Shows a placeholder when no valid src is provided.
 */

import type {ImageElement} from '@vary/v2/schema/document';

interface ImageRendererProps {
  element: ImageElement;
}

export default function ImageRenderer({element}: ImageRendererProps) {
  const {props} = element;
  const hasSrc = props.src && props.src !== '{{imageUrl}}';

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        minWidth: 40,
        minHeight: 40,
        borderRadius: props.borderRadius,
        overflow: 'hidden',
        boxShadow: props.shadow ? '0 4px 20px rgba(0,0,0,0.25)' : undefined,
        filter: props.blur ? `blur(${props.blur}px)` : undefined,
      }}
    >
      {hasSrc ? (
        <>
          <img
            src={props.src}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: props.fit,
              objectPosition: `${props.objectPositionX * 100}% ${props.objectPositionY * 100}%`,
            }}
            draggable={false}
          />
          {props.overlayColor && props.overlayOpacity > 0 && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: props.overlayColor,
                opacity: props.overlayOpacity,
              }}
            />
          )}
        </>
      ) : (
        <div
          style={{
            width: '100%',
            height: '100%',
            background: '#2D3748',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9CA3AF',
            fontSize: 12,
          }}
        >
          🖼 Image
        </div>
      )}
    </div>
  );
}
