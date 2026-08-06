/**
 * MusicGallery — full-screen music picker (uploads + stock placeholder).
 */

import {useState, useEffect} from 'react';
import FullScreenGallery from './FullScreenGallery';
import {useEditorStore} from '../../stores/editorStore';
import {useDocumentStore} from '../../stores/documentStore';

interface Track {
  id: string;
  filename: string;
  duration?: number;
  url: string;
}

const CATEGORIES = [
  {icon: '✈', label: 'Travel'}, {icon: '☀', label: 'Summer'},
  {icon: '👻', label: 'Scary'}, {icon: '🌙', label: 'Dreamy'},
  {icon: '🧘', label: 'Calm'}, {icon: '🎈', label: 'Kids'},
  {icon: '🌊', label: 'Ambient'}, {icon: '🎯', label: 'Focus'},
  {icon: '💼', label: 'Corporate'}, {icon: '⚡', label: 'Energetic'},
  {icon: '🎬', label: 'Cinematic'},
];

type Tab = 'stock' | 'uploads';

export default function MusicGallery() {
  const closeGallery = useEditorStore((s) => s.closeGallery);
  const [tab, setTab] = useState<Tab>('stock');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [playing, setPlaying] = useState<string | null>(null);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const handlePreview = (trackId: string, url: string) => {
    if (playing === trackId) {
      audio?.pause();
      setPlaying(null);
      return;
    }
    audio?.pause();
    const a = new Audio(url);
    a.play();
    a.onended = () => setPlaying(null);
    setAudio(a);
    setPlaying(trackId);
  };

  const handleSelect = (track: Track) => {
    audio?.pause();
    // Set music on the document — dispatch document-level music command
    closeGallery();
  };

  const tabs = [
    {key: 'stock', label: 'Stock'},
    {key: 'uploads', label: 'Uploads'},
  ];

  return (
    <FullScreenGallery
      title="Music"
      onClose={closeGallery}
      tabs={tabs}
      activeTab={tab}
      onTabChange={(k) => { setTab(k as Tab); audio?.pause(); setPlaying(null); }}
    >
      {tab === 'stock' && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 10, padding: 12,
        }}>
          {CATEGORIES.map((cat) => (
            <button key={cat.label} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
              padding: '24px 16px', borderRadius: 12,
              background: 'linear-gradient(135deg, #1E293B, #0F172A)',
              border: '1px solid #334155', cursor: 'pointer',
            }}>
              <span style={{fontSize: 36}}>{cat.icon}</span>
              <span style={{color: '#E2E8F0', fontSize: 14, fontWeight: 600}}>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {tab === 'uploads' && (
        <div style={{padding: 40, textAlign: 'center', color: '#64748B', fontSize: 14}}>
          <div style={{fontSize: 48, marginBottom: 16}}>🎵</div>
          <div style={{fontSize: 17, fontWeight: 600, color: '#E2E8F0', marginBottom: 8}}>Upload Music</div>
          <div>Upload your own audio tracks — coming soon</div>
        </div>
      )}
    </FullScreenGallery>
  );
}
