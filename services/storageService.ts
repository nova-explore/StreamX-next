import { createClient } from '@libsql/client/web';
import { Media, AppSettings, AppNotification } from '../types';

let clientInstance: any = null;

const DEMO_MEDIA: Media[] = [
  {
    id: 'demo-movie-1',
    title: 'The Midnight Sky',
    type: 'movie',
    thumbnailUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1000',
    backdropUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'A lonely scientist in the Arctic races to stop a group of astronauts from returning home to a mysterious global catastrophe.',
    year: 2024,
    genre: 'Sci-Fi, Drama',
    rating: 8.4,
    createdAt: Date.now() - 10000
  },
  {
    id: 'demo-movie-2',
    title: 'Neon Odyssey',
    type: 'movie',
    thumbnailUrl: 'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&q=80&w=1000',
    backdropUrl: 'https://images.unsplash.com/photo-1514539079130-25950c84af65?auto=format&fit=crop&q=80&w=1920',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    description: 'In a world where memories can be traded like currency, a memory thief discovers a secret that could collapse the global economy.',
    year: 2023,
    genre: 'Cyberpunk, Thriller',
    rating: 8.9,
    createdAt: Date.now() - 15000
  },
  {
    id: 'demo-series-1',
    title: 'Horizon Alpha',
    type: 'series',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614850523296-e8c041de83a4?auto=format&fit=crop&q=80&w=1000',
    backdropUrl: 'https://images.unsplash.com/photo-1605810230434-7631ac76ec81?auto=format&fit=crop&q=80&w=1920',
    description: 'The first colony on Mars faces an internal crisis when a mysterious illness begins affecting the artificial intelligence running the life-support systems.',
    year: 2023,
    genre: 'Sci-Fi, Mystery',
    rating: 9.1,
    createdAt: Date.now() - 20000,
    seasons: [
      {
        id: 's1',
        seasonNumber: 1,
        episodes: [
          {
            id: 'e1',
            title: 'Descent',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
            order: 1,
            duration: '42m',
            description: 'The crew of Horizon Alpha makes their final approach to the red planet.'
          },
          {
            id: 'e2',
            title: 'Static',
            videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
            order: 2,
            duration: '38m',
            description: 'Communication with Earth is lost, and the colony must decide who to trust.'
          }
        ]
      }
    ]
  }
];

const getClient = () => {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || "";
  if (!url) return null;
  if (!clientInstance) {
    try {
      clientInstance = createClient({ url, authToken });
    } catch (e) {
      return null;
    }
  }
  return clientInstance;
};

export const storageService = {
  isProduction: () => !!process.env.TURSO_DATABASE_URL && !!process.env.TURSO_AUTH_TOKEN,
  
  init: async () => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute(`CREATE TABLE IF NOT EXISTS media (id TEXT PRIMARY KEY, title TEXT NOT NULL, type TEXT NOT NULL, thumbnail_url TEXT, backdrop_url TEXT, video_url TEXT, seasons TEXT, description TEXT, year INTEGER, genre TEXT, rating REAL, created_at INTEGER)`);
      await client.execute(`CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, is_maintenance_mode INTEGER DEFAULT 0)`);
      await client.execute(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, title TEXT NOT NULL, message TEXT NOT NULL, thumbnail_url TEXT, created_at INTEGER)`);
    } catch (e) {
      console.warn("Storage Initialization: Database layer bypassed.");
    }
  },

  getMedia: async (): Promise<Media[]> => {
    const client = getClient();
    if (!client) return DEMO_MEDIA;
    try {
      const result = await client.execute("SELECT * FROM media ORDER BY created_at DESC");
      if (result.rows.length === 0) return DEMO_MEDIA;
      return result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.type as any,
        thumbnailUrl: r.thumbnail_url,
        backdropUrl: r.backdrop_url,
        videoUrl: r.video_url,
        seasons: r.seasons ? JSON.parse(r.seasons) : [],
        description: r.description,
        year: r.year,
        genre: r.genre,
        rating: parseFloat(r.rating || "0"),
        createdAt: Number(r.created_at || "0")
      }));
    } catch (err) { 
      return DEMO_MEDIA; 
    }
  },

  addMedia: async (media: Omit<Media, 'id' | 'createdAt'>): Promise<Media | null> => {
    const client = getClient();
    if (!client) return null;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    try {
      await client.execute({
        sql: `INSERT INTO media (id, title, type, thumbnail_url, backdrop_url, video_url, seasons, description, year, genre, rating, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [id, media.title, media.type, media.thumbnailUrl, media.backdropUrl || null, media.videoUrl || null, JSON.stringify(media.seasons || []), media.description, media.year, media.genre, media.rating, createdAt]
      });
      return { ...media, id, createdAt } as Media;
    } catch (e) {
      return null;
    }
  },

  updateMedia: async (media: Media): Promise<void> => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute({
        sql: `UPDATE media SET title = ?, type = ?, thumbnail_url = ?, backdrop_url = ?, video_url = ?, seasons = ?, description = ?, year = ?, genre = ?, rating = ? WHERE id = ?`,
        args: [media.title, media.type, media.thumbnailUrl, media.backdropUrl || null, media.videoUrl || null, JSON.stringify(media.seasons || []), media.description, media.year, media.genre, media.rating, media.id]
      });
    } catch (e) {
      console.error("Update failed", e);
    }
  },

  deleteMedia: async (id: string): Promise<void> => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute({ sql: "DELETE FROM media WHERE id = ?", args: [id] });
    } catch (e) {
      console.error("Delete failed", e);
    }
  },

  getSettings: async (): Promise<AppSettings> => {
    const client = getClient();
    if (!client) return { isMaintenanceMode: false };
    try {
      const result = await client.execute("SELECT * FROM settings LIMIT 1");
      if (result.rows.length === 0) return { isMaintenanceMode: false };
      return { isMaintenanceMode: result.rows[0].is_maintenance_mode === 1 };
    } catch { return { isMaintenanceMode: false }; }
  },

  setMaintenanceMode: async (enabled: boolean): Promise<void> => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute({
        sql: "INSERT OR REPLACE INTO settings (id, is_maintenance_mode) VALUES ('global', ?)",
        args: [enabled ? 1 : 0]
      });
    } catch (e) {
      console.error("Settings update failed", e);
    }
  },

  getNotifications: async (): Promise<AppNotification[]> => {
    const client = getClient();
    if (!client) return [];
    try {
      const result = await client.execute("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10");
      return result.rows.map((r: any) => ({
        id: r.id,
        title: r.title,
        message: r.message,
        thumbnailUrl: r.thumbnail_url,
        createdAt: Number(r.created_at || "0")
      }));
    } catch { return []; }
  },

  addNotification: async (n: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const client = getClient();
    if (!client) return;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    try {
      await client.execute({
        sql: `INSERT INTO notifications (id, title, message, thumbnail_url, created_at) VALUES (?, ?, ?, ?, ?)`,
        args: [id, n.title, n.message, n.thumbnailUrl || null, createdAt]
      });
    } catch (e) {
      console.error("Notification failed", e);
    }
  },

  clearNotifications: async () => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute("DELETE FROM notifications");
    } catch (e) {
      console.error("Clear notifications failed", e);
    }
  },

  setWatchedProgress: (id: string, progress: number) => {
    try {
      const data = JSON.parse(localStorage.getItem('streamx_watched_progress') || '{}');
      data[id] = progress;
      localStorage.setItem('streamx_watched_progress', JSON.stringify(data));
    } catch {}
  },

  getWatchedProgress: (id: string): number => {
    try {
      const data = JSON.parse(localStorage.getItem('streamx_watched_progress') || '{}');
      return data[id] || 0;
    } catch { return 0; }
  }
};