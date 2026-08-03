import {useCallback, useEffect, useRef, useState} from 'react';
import {apiClient, type PixabayImageHit, type PixabayVideoHit} from '../../api/client';

type PixabaySearchPickerProps = {
  mediaType: 'images' | 'video';
  onSelect: (url: string) => void;
  onClose: () => void;
};

export default function PixabaySearchPicker({
  mediaType,
  onSelect,
  onClose,
}: PixabaySearchPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<(PixabayImageHit | PixabayVideoHit)[]>([]);
  const [totalHits, setTotalHits] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchAvailable, setSearchAvailable] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const doSearch = useCallback(
    async (q: string, pageNum: number, append: boolean) => {
      if (!q.trim() || !searchAvailable) return;
      setLoading(true);
      setError(null);
      try {
        const result = await apiClient.searchPixabay({
          q: q.trim(),
          type: mediaType,
          page: pageNum,
          per_page: 20,
        });
        setResults((prev) => (append ? [...prev, ...result.hits] : result.hits));
        setTotalHits(result.totalHits);
        setPage(pageNum);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Search failed';
        if (msg.includes('PIXABAY_API_KEY') || msg.includes('not configured')) {
          setSearchAvailable(false);
          setError('Stock media search is not configured.');
        } else {
          setError(msg);
        }
      } finally {
        setLoading(false);
      }
    },
    [mediaType, searchAvailable],
  );

  // Debounced search on query change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setTotalHits(0);
      return;
    }
    debounceRef.current = setTimeout(() => doSearch(query, 1, false), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = (hit: PixabayImageHit | PixabayVideoHit) => {
    if ('previewURL' in hit) {
      onSelect(hit.fullURL);
    } else {
      onSelect(hit.videos.large?.url ?? hit.videos.medium?.url ?? hit.videos.small?.url);
    }
  };

  const hasMore = results.length < totalHits;

  return (
    <div className="pixabay-picker-overlay" onClick={onClose}>
      <div
        className="pixabay-picker"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Stock media browser"
      >
        <div className="pixabay-picker-header">
          <h3>{mediaType === 'video' ? 'Stock Videos' : 'Stock Images'}</h3>
          <button type="button" className="pixabay-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <input
          ref={searchInputRef}
          type="text"
          className="pixabay-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={mediaType === 'video' ? 'Search stock videos…' : 'Search stock images…'}
          aria-label="Search stock media"
        />

        {error && <div className="inline-error">{error}</div>}

        {!searchAvailable ? null : !loading && results.length === 0 && query.trim() ? (
          <div className="pixabay-empty">No results found. Try different keywords.</div>
        ) : !loading && results.length === 0 ? (
          <div className="pixabay-empty">
            Search for free {mediaType === 'video' ? 'stock videos' : 'stock photos'} from Pixabay
          </div>
        ) : null}

        {loading && results.length === 0 ? (
          <div className="pixabay-grid">
            {Array.from({length: 8}).map((_, i) => (
              <div key={i} className="pixabay-skeleton-cell" />
            ))}
          </div>
        ) : null}

        {results.length > 0 && (
          <div className="pixabay-grid">
            {results.map((hit) => (
              <button
                key={hit.id}
                type="button"
                className="pixabay-cell"
                onClick={() => handleSelect(hit)}
                aria-label={'tags' in hit ? hit.tags : `Video ${hit.id}`}
              >
                {'previewURL' in hit ? (
                  <img src={hit.previewURL} alt={hit.tags} loading="lazy" />
                ) : (
                  <div className="pixabay-video-cell">
                    <video src={hit.videos.small?.url} preload="metadata" muted />
                    <span className="pixabay-play-badge">▶</span>
                  </div>
                )}
                <span className="pixabay-user">{hit.user}</span>
              </button>
            ))}
          </div>
        )}

        {hasMore && (
          <button
            type="button"
            className="pixabay-load-more"
            onClick={() => doSearch(query, page + 1, true)}
            disabled={loading}
            aria-busy={loading}
          >
            {loading ? 'Loading…' : 'Load more'}
          </button>
        )}
      </div>
    </div>
  );
}
