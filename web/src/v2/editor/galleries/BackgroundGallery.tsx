/**
 * BackgroundGallery — full-screen background picker.
 *
 * Tabs: Photos (Pixabay), Videos (Pixabay), Colors (palette), Uploads.
 */

import {useState, useEffect, useCallback} from 'react';
import FullScreenGallery from './FullScreenGallery';
import GalleryGrid from './GalleryGrid';
import GalleryCard from './GalleryCard';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';
import {apiClient, type PixabayImageHit} from '../../../api/client';

type Tab = 'photos' | 'videos' | 'colors' | 'uploads';

const BG_COLORS = [
  '#0F172A', '#1E293B', '#334155', '#475569',
  '#1A365D', '#2D3748', '#1A202C', '#000000',
  '#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0',
  '#FEF3C7', '#FDE68A', '#FCD34D', '#FBBF24',
  '#FECACA', '#F87171', '#DC2626', '#991B1B',
  '#BBF7D0', '#4ADE80', '#16A34A', '#14532D',
  '#BFDBFE', '#60A5FA', '#3B82F6', '#1E40AF',
  '#DDD6FE', '#A78BFA', '#7C3AED', '#4C1D95',
  '#FBCFE8', '#F472B6', '#DB2777', '#831843',
];

export default function BackgroundGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);
  const dispatch = useDocumentStore((s) => s.dispatch);

  const [tab, setTab] = useState<Tab>('colors');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PixabayImageHit[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    try {
      const res = await apiClient.searchPixabay({q, type: 'images', per_page: 30});
      setResults((res.hits ?? []) as PixabayImageHit[]);
    } catch { setResults([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { search('abstract background'); }, [search]);

  const setBgImage = (url: string) => {
    dispatch({
      type: 'SET_SCENE_BACKGROUND' as any,
      background: {type: 'image', src: url},
    } as any);
    closeGallery();
  };

  const setBgColor = (color: string) => {
    dispatch({
      type: 'SET_SCENE_BACKGROUND' as any,
      background: {type: 'solid', color},
    } as any);
    closeGallery();
  };

  const tabs = [
    {key: 'photos', label: 'Photos'},
    {key: 'videos', label: 'Videos'},
    {key: 'colors', label: 'Colors'},
    {key: 'uploads', label: 'Uploads'},
  ];

  return (
    <FullScreenGallery
      title="Background"
      onClose={closeGallery}
      tabs={tabs}
      activeTab={tab}
      onTabChange={(k) => setTab(k as Tab)}
      searchBar={tab === 'photos'}
      searchPlaceholder="Search backgrounds..."
      onSearch={search}
    >
      {(tab === 'photos' || tab === 'videos') && (
        <GalleryGrid
          items={results}
          columns={2}
          loading={loading}
          emptyLabel="Search for backgrounds"
          renderItem={(hit) => (
            <GalleryCard
              key={hit.id}
              thumbnail={(hit as PixabayImageHit).previewURL}
              label={`${hit.id}`}
              onClick={() => setBgImage((hit as PixabayImageHit).fullURL ?? (hit as PixabayImageHit).previewURL)}
            />
          )}
        />
      )}

      {tab === 'colors' && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8, padding: 12,
        }}>
          {BG_COLORS.map((color) => (
            <button key={color} onClick={() => setBgColor(color)} style={{
              aspectRatio: '1', borderRadius: 10, background: color,
              border: '2px solid #334155', cursor: 'pointer', padding: 0,
            }} />
          ))}
        </div>
      )}

      {tab === 'uploads' && (
        <div style={{padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14}}>
          <div style={{fontSize: 48, marginBottom: 16}}>📤</div>
          <div style={{fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 8}}>Upload Background</div>
          <div>Coming soon</div>
        </div>
      )}
    </FullScreenGallery>
  );
}
