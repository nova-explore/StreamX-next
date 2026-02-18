
export type ContentType = 'movie' | 'series';

export interface Episode {
  id: string;
  title: string;
  videoUrl: string;
  order: number;
  duration?: string;
  description?: string;
}

export interface Season {
  id: string;
  seasonNumber: number;
  episodes: Episode[];
}

export interface Media {
  id: string;
  title: string;
  type: ContentType;
  thumbnailUrl: string;
  backdropUrl?: string; // Cinematic wide background
  videoUrl?: string; // Used for movies
  seasons?: Season[]; // Used for series
  description: string;
  year: number;
  genre: string;
  rating: number;
  createdAt: number;
}

export interface User {
  id: string;
  role: 'admin' | 'user';
  username: string;
}

export interface AppSettings {
  isMaintenanceMode: boolean;
}

export enum StorageKey {
  MEDIA = 'streamx_media_content',
  ADMIN_AUTH = 'streamx_admin_session',
  MY_LIST = 'streamx_user_favorites',
  WATCHED_PROGRESS = 'streamx_watched_progress',
  SETTINGS = 'streamx_app_settings'
}
