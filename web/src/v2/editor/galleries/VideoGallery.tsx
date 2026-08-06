/**
 * VideoGallery — full-screen video picker (Pixabay stock + uploads).
 */

import {useState, useEffect, useCallback} from 'react';
import FullScreenGallery from './FullScreenGallery';
import GalleryGrid from './GalleryGrid';
import GalleryCard from './GalleryCard';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {apiClient, type PixabayVideoHit} from '../../../api/client';

type Tab = 'stock' | 'uploads';

export default function VideoGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);
  const dispatch = useDocumentStore((s) => s.dispatch);

  const [tab, setTab] = useState<Tab>('stock');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PixabayVideoHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.searchPixabay({q, type: 'video', per_page: 30});
      setResults((res.hits ?? []) as PixabayVideoHit[]);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { search('background abstract'); }, [search]);

  const handleSelect = (hit: PixabayVideoHit) => {
    const url = hit.videos.medium?.url ?? hit.videos.small?.url ?? '';
    dispatch({type: 'ADD_ELEMENT', elementType: 'image'});
    closeGallery();
  };

  const tabs = [{key: 'stock', label: 'Stock'}, {key: 'uploads', label: 'Uploads'}];

  return (
    <FullScreenGallery
      title="Add video"
      onClose={closeGallery}
      tabs={tabs}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
      searchBar={tab === 'stock'}
      searchPlaceholder="Search videos..."
      onSearch={search}
    >
      {tab === 'stock' && (
        <GalleryGrid
          items={results}
          columns={2}
          loading={loading}
          emptyLabel="Search for videos"
          renderItem={(hit) => {
            const thumbUrl = hit.videos.small?.url ?? '';
            return (
              <GalleryCard
                key={hit.id}
                thumbnail={thumbUrl}
                icon="▶"
                label={hit.user}
                onClick={() => handleSelect(hit)}
              />
            );
          }}
        />
      )}
      {tab === 'uploads' && (
        <div style={{padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14}}>
          <div style={{fontSize: 48, marginBottom: 16}}>📤</div>
          <div style={{fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 8}}>Upload Video</div>
          <div>Camera · Gallery · Files — coming soon</div>
        </div>
      )}
    </FullScreenGallery>
  );
}
