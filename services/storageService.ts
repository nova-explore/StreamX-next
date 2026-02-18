import { Media, StorageKey, AppSettings } from '../types';

const INITIAL_DATA: Media[] = [
  {
    id: '1',
    title: 'Echoes of the Void',
    type: 'movie',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1280',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'In a distant future, a lone explorer discovers a forgotten frequency that could rewrite history.',
    year: 2024,
    genre: 'Sci-Fi',
    rating: 8.5,
    createdAt: Date.now()
  },
  {
    id: '2',
    title: 'Neon Nights',
    type: 'series',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?auto=format&fit=crop&q=80&w=1280',
    description: 'Crime runs deep in the shadows of Neo-Tokyo. Follow a rogue detective on a path of vengeance.',
    seasons: [
      {
        id: 's1',
        seasonNumber: 1,
        episodes: [
          { id: 'ep1', title: 'The Red Signal', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', order: 1, duration: '45m', description: 'Detective Sato encounters a mysterious transmission that leads to a hidden underground network.' },
          { id: 'ep2', title: 'Chrome Shadows', videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', order: 2, duration: '42m', description: 'The hunt intensifies as the Yakuza-tech hybrid soldiers start tracking Sato\'s every move.' }
        ]
      }
    ],
    year: 2023,
    genre: 'Cyberpunk',
    rating: 9.2,
    createdAt: Date.now() - 100000
  }
];

const DEFAULT_SETTINGS: AppSettings = {
  isMaintenanceMode: false
};

const isStorageAvailable = () => {
  try {
    const key = '__storage_test__';
    window.localStorage.setItem(key, key);
    window.localStorage.removeItem(key);
    return true;
  } catch (e) {
    return false;
  }
};

export const storageService = {
  getMedia: (): Media[] => {
    if (!isStorageAvailable()) return INITIAL_DATA;
    const data = localStorage.getItem(StorageKey.MEDIA);
    if (!data) {
      localStorage.setItem(StorageKey.MEDIA, JSON.stringify(INITIAL_DATA));
      return INITIAL_DATA;
    }
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Failed to parse media data", e);
      return INITIAL_DATA;
    }
  },

  addMedia: (media: Omit<Media, 'id' | 'createdAt'>): Media => {
    const current = storageService.getMedia();
    const newItem: Media = {
      ...media,
      id: Math.random().toString(36).substring(2, 11),
      createdAt: Date.now()
    };
    const updated = [newItem, ...current];
    if (isStorageAvailable()) {
      localStorage.setItem(StorageKey.MEDIA, JSON.stringify(updated));
    }
    return newItem;
  },

  deleteMedia: (id: string): Media[] => {
    const current = storageService.getMedia();
    const updated = current.filter(item => String(item.id) !== String(id));
    if (isStorageAvailable()) {
      localStorage.setItem(StorageKey.MEDIA, JSON.stringify(updated));
    }
    return updated;
  },

  updateMedia: (media: Media) => {
    if (!media.id) return;
    const current = storageService.getMedia();
    const updated = current.map(item => String(item.id) === String(media.id) ? media : item);
    if (isStorageAvailable()) {
      localStorage.setItem(StorageKey.MEDIA, JSON.stringify(updated));
    }
  },

  getWatchedProgress: (id: string): number => {
    if (!isStorageAvailable()) return 0;
    const progressData = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
    if (!progressData) return 0;
    try {
      const progressMap = JSON.parse(progressData);
      return progressMap[id] || 0;
    } catch (e) {
      return 0;
    }
  },

  setWatchedProgress: (id: string, progress: number) => {
    if (!isStorageAvailable()) return;
    const progressData = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
    const progressMap = progressData ? JSON.parse(progressData) : {};
    progressMap[id] = progress;
    localStorage.setItem(StorageKey.WATCHED_PROGRESS, JSON.stringify(progressMap));
  },

  getSettings: (): AppSettings => {
    if (!isStorageAvailable()) return DEFAULT_SETTINGS;
    const data = localStorage.getItem(StorageKey.SETTINGS);
    try {
      return data ? JSON.parse(data) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  },

  updateSettings: (settings: AppSettings) => {
    if (isStorageAvailable()) {
      localStorage.setItem(StorageKey.SETTINGS, JSON.stringify(settings));
    }
  }
};