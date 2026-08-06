/**
 * ObjectGallery — full-screen shape & object picker.
 *
 * Categories: Basic shapes, arrows, stars, decorative.
 */

import {useState} from 'react';
import FullScreenGallery from './FullScreenGallery';
import GalleryGrid from './GalleryGrid';
import GalleryCard from './GalleryCard';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';

interface ObjectPreset {
  id: string;
  icon: string;
  label: string;
  shapeType?: string;
  category: string;
}

const PRESETS: ObjectPreset[] = [
  // Basic
  {id: 'rect', icon: '▬', label: 'Rectangle', shapeType: 'rectangle', category: 'Basic'},
  {id: 'circle', icon: '●', label: 'Circle', shapeType: 'circle', category: 'Basic'},
  {id: 'line', icon: '—', label: 'Line', shapeType: 'line', category: 'Basic'},
  // Arrows
  {id: 'arrow-r', icon: '→', label: 'Arrow Right', shapeType: 'rectangle', category: 'Arrows'},
  {id: 'arrow-l', icon: '←', label: 'Arrow Left', shapeType: 'rectangle', category: 'Arrows'},
  // Stars
  {id: 'star', icon: '★', label: 'Star', shapeType: 'rectangle', category: 'Stars'},
  {id: 'star-outline', icon: '☆', label: 'Star Outline', shapeType: 'rectangle', category: 'Stars'},
  // Decorative
  {id: 'heart', icon: '♥', label: 'Heart', shapeType: 'rectangle', category: 'Decorative'},
  {id: 'diamond', icon: '◆', label: 'Diamond', shapeType: 'rectangle', category: 'Decorative'},
];

export default function ObjectGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);
  const dispatch = useDocumentStore((s) => s.dispatch);
  const [category, setCategory] = useState('Basic');

  const categories = ['Basic', 'Arrows', 'Stars', 'Decorative'];
  const filtered = PRESETS.filter((p) => p.category === category);

  const handleSelect = (preset: ObjectPreset) => {
    dispatch({type: 'ADD_ELEMENT', elementType: 'shape'});
    closeGallery();
  };

  return (
    <FullScreenGallery
      title="Add object"
      onClose={closeGallery}
      searchBar
      searchPlaceholder="Search objects..."
      onSearch={() => {}}
    >
      {/* Category chips */}
      <div style={{
        display: 'flex', gap: 8, padding: '8px 12px',
        overflowX: 'auto', scrollbarWidth: 'none',
      }}>
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)} style={{
            padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
            background: category === cat ? '#3B82F6' : '#1E293B',
            color: category === cat ? '#fff' : '#94A3B8',
            fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap',
          }}>{cat}</button>
        ))}
      </div>

      {/* Grid */}
      <GalleryGrid
        items={filtered}
        columns={3}
        renderItem={(preset) => (
          <GalleryCard
            key={preset.id}
            icon={preset.icon}
            label={preset.label}
            onClick={() => handleSelect(preset)}
          />
        )}
      />
    </FullScreenGallery>
  );
}
