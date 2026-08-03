export type PixabayMediaType = 'images' | 'video';

export type PixabaySearchParams = {
  q: string;
  type: PixabayMediaType;
  page?: number;
  per_page?: number;
};

export type PixabayImageResult = {
  id: number;
  previewURL: string;
  fullURL: string;
  user: string;
  tags: string;
  width: number;
  height: number;
};

export type PixabayVideoResult = {
  id: number;
  user: string;
  tags: string;
  videos: {
    small: {url: string; width: number; height: number};
    medium: {url: string; width: number; height: number};
    large: {url: string; width: number; height: number};
  };
};

export type PixabaySearchResponse = {
  total: number;
  totalHits: number;
  page: number;
  perPage: number;
  hits: PixabayImageResult[] | PixabayVideoResult[];
};

export const searchPixabay = async (
  params: PixabaySearchParams,
): Promise<PixabaySearchResponse> => {
  const apiKey = process.env.PIXABAY_API_KEY;
  if (!apiKey) {
    throw new Error('PIXABAY_API_KEY environment variable is not set');
  }

  const perPage = Math.min(Math.max(params.per_page ?? 20, 3), 200);
  const page = params.page ?? 1;
  const q = encodeURIComponent(params.q.trim());

  const baseUrl =
    params.type === 'video'
      ? 'https://pixabay.com/api/videos/'
      : 'https://pixabay.com/api/';

  const url = params.type === 'video'
    ? `${baseUrl}?key=${apiKey}&q=${q}&per_page=${perPage}&page=${page}`
    : `${baseUrl}?key=${apiKey}&q=${q}&image_type=photo&per_page=${perPage}&page=${page}`;

  const response = await fetch(url);

  if (response.status === 429) {
    console.warn('[pixabay] Rate limited — 429 response');
    throw new Error('Rate limit exceeded. Please wait a moment and try again.');
  }

  if (!response.ok) {
    throw new Error(`Pixabay API returned ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as {
    total: number;
    totalHits: number;
    hits: Array<Record<string, unknown>>;
  };

  const hits =
    params.type === 'video'
      ? data.hits.map((hit) => ({
          id: hit.id as number,
          user: hit.user as string,
          tags: hit.tags as string,
          videos: hit.videos as PixabayVideoResult['videos'],
        }))
      : data.hits.map((hit) => ({
          id: hit.id as number,
          previewURL: hit.webformatURL as string,
          fullURL: hit.largeImageURL as string,
          user: hit.user as string,
          tags: hit.tags as string,
          width: hit.imageWidth as number,
          height: hit.imageHeight as number,
        }));

  return {
    total: data.total,
    totalHits: data.totalHits,
    page,
    perPage,
    hits: hits as PixabaySearchResponse['hits'],
  };
};
