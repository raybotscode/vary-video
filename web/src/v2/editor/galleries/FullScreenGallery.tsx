/**
 * FullScreenGallery — reusable full-screen portal overlay for all galleries.
 *
 * Props:
 * - title: header title
 * - onClose: close callback
 * - children: gallery content (scrollable)
 * - tabs?: optional tab bar (e.g. Background: Photos | Videos | Colors)
 * - searchBar?: show a search input
 * - onSearch?: search callback (debounced externally)
 */

import {createPortal} from 'react-dom';
import SearchBar from './SearchBar';

export interface GalleryTab {
  key: string;
  label: string;
}

interface FullScreenGalleryProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  tabs?: GalleryTab[];
  activeTab?: string;
  onTabChange?: (key: string) => void;
  searchBar?: boolean;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function FullScreenGallery({
  title, onClose, children,
  tabs, activeTab, onTabChange,
  searchBar, searchPlaceholder, onSearch,
}: FullScreenGalleryProps) {
  const content = (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 11100,
      background: '#0F172A',
      display: 'flex', flexDirection: 'column',
      animation: 'gallery-slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '12px 16px', flexShrink: 0,
        borderBottom: '1px solid #1E293B',
        minHeight: 56,
      }}>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', color: '#F87171',
          fontSize: 22, cursor: 'pointer', padding: '8px 12px 8px 0',
          minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center',
        }}>✕</button>
        <span style={{color: '#fff', fontSize: 17, fontWeight: 600, flex: 1}}>{title}</span>
      </div>

      {/* Optional tabs */}
      {tabs && (
        <div style={{
          display: 'flex', borderBottom: '1px solid #1E293B',
          overflowX: 'auto', flexShrink: 0,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {tabs.map((tab) => (
            <button key={tab.key} onClick={() => onTabChange?.(tab.key)} style={{
              padding: '10px 20px', background: 'none', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #3B82F6' : '2px solid transparent',
              color: activeTab === tab.key ? '#fff' : '#9CA3AF',
              fontSize: 14, fontWeight: activeTab === tab.key ? 600 : 400,
              cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
            }}>{tab.label}</button>
          ))}
        </div>
      )}

      {/* Optional search bar */}
      {searchBar && (
        <div style={{padding: '10px 16px', flexShrink: 0}}>
          <SearchBar
            placeholder={searchPlaceholder ?? 'Search...'}
            onChange={onSearch ?? (() => {})}
          />
        </div>
      )}

      {/* Scrollable content */}
      <div style={{
        flex: 1, overflow: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}>
        {children}
      </div>

      <style>{`
        @keyframes gallery-slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  return createPortal(content, document.body);
}
