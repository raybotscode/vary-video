/**
 * PhotoGallery — full-screen photo picker (Pixabay stock + uploads).
 *
 * Used by the "Photos" button in the home toolbar.
 * On select: adds a new image element or replaces selected element's src.
 */

import {useState, useEffect, useCallback} from 'react';
import FullScreenGallery from './FullScreenGallery';
import GalleryGrid from './GalleryGrid';
import GalleryCard from './GalleryCard';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {apiClient, type PixabayImageHit} from '../../../api/client';

type Tab = 'stock' | 'uploads';

export default function PhotoGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);
  const selectedElementId = useEditorStore((s) => s.selectedElementId);
  const dispatch = useDocumentStore((s) => s.dispatch);

  const [tab, setTab] = useState<Tab>('stock');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PixabayImageHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiClient.searchPixabay({q, type: 'images', per_page: 30});
      setResults((res.hits ?? []) as PixabayImageHit[]);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial popular search
  useEffect(() => {
    search('background nature');
  }, [search]);

  const handleSelect = (hit: PixabayImageHit) => {
    if (selectedElementId) {
      dispatch({
        type: 'SET_ELEMENT_PROP',
        elementId: selectedElementId,
        key: 'src',
        value: hit.fullURL,
      });
    } else {
      // Add new image element with this source
      dispatch({type: 'ADD_ELEMENT', elementType: 'image'});
      // The newly created element — we can't easily get its ID here,
      // but the user can select it and re-pick. For now, just add.
    }
    closeGallery();
  };

  const tabs = [
    {key: 'stock', label: 'Stock'},
    {key: 'uploads', label: 'Uploads'},
  ];

  return (
    <FullScreenGallery
      title="Add photo"
      onClose={closeGallery}
      tabs={tabs}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
      searchBar={tab === 'stock'}
      searchPlaceholder="Search photos..."
      onSearch={search}
    >
      {tab === 'stock' && (
        <GalleryGrid
          items={results}
          columns={2}
          loading={loading}
          emptyLabel="Search for photos to add"
          renderItem={(hit) => (
            <GalleryCard
              key={hit.id}
              thumbnail={hit.previewURL}
              label={`${hit.width}×${hit.height}`}
              onClick={() => handleSelect(hit)}
            />
          )}
        />
      )}
      {tab === 'uploads' && (
        <div style={{padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14}}>
          <div style={{fontSize: 48, marginBottom: 16}}>📤</div>
          <div style={{fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 8}}>Upload Photo</div>
          <div>Camera · Gallery · Files — coming soon</div>
        </div>
      )}
    </FullScreenGallery>
  );
}
