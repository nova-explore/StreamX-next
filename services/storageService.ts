import { neon } from '@neondatabase/serverless';
import { Media, StorageKey, AppSettings } from '../types';

// Connect to Neon
const sql = neon(process.env.DATABASE_URL || '');

const INITIAL_DATA_SEED: Omit<Media, 'id' | 'createdAt'>[] = [
  {
    title: 'Echoes of the Void',
    type: 'movie',
    thumbnailUrl: 'https://images.unsplash.com/photo-1614850523296-d8c1af93d400?auto=format&fit=crop&q=80&w=1280',
    videoUrl: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    description: 'In a distant future, a lone explorer discovers a forgotten frequency that could rewrite history.',
    year: 2024,
    genre: 'Sci-Fi',
    rating: 8.5
  }
];

export const storageService = {
  // Initialize Database Tables
  init: async () => {
    if (!process.env.DATABASE_URL) return;
    try {
      await sql`
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          thumbnail_url TEXT,
          backdrop_url TEXT,
          video_url TEXT,
          seasons JSONB,
          description TEXT,
          year INTEGER,
          genre TEXT,
          rating DECIMAL,
          created_at BIGINT
        )
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          is_maintenance_mode BOOLEAN DEFAULT FALSE
        )
      `;
      // Seed if empty
      const count = await sql`SELECT COUNT(*) FROM media`;
      if (parseInt(count[0].count) === 0) {
        for (const item of INITIAL_DATA_SEED) {
          await storageService.addMedia(item);
        }
      }
    } catch (e) {
      console.error("DB Initialization failed:", e);
    }
  },

  getMedia: async (): Promise<Media[]> => {
    try {
      const rows = await sql`SELECT * FROM media ORDER BY created_at DESC`;
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type as any,
        thumbnailUrl: r.thumbnail_url,
        backdropUrl: r.backdrop_url,
        videoUrl: r.video_url,
        seasons: r.seasons,
        description: r.description,
        year: r.year,
        genre: r.genre,
        rating: parseFloat(r.rating),
        createdAt: parseInt(r.created_at)
      }));
    } catch (e) {
      console.error("Fetch failed", e);
      return [];
    }
  },

  addMedia: async (media: Omit<Media, 'id' | 'createdAt'>): Promise<Media> => {
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    await sql`
      INSERT INTO media (id, title, type, thumbnail_url, backdrop_url, video_url, seasons, description, year, genre, rating, created_at)
      VALUES (${id}, ${media.title}, ${media.type}, ${media.thumbnailUrl}, ${media.backdropUrl}, ${media.videoUrl || null}, ${JSON.stringify(media.seasons || [])}, ${media.description}, ${media.year}, ${media.genre}, ${media.rating}, ${createdAt})
    `;
    return { ...media, id, createdAt };
  },

  deleteMedia: async (id: string): Promise<void> => {
    await sql`DELETE FROM media WHERE id = ${id}`;
  },

  updateMedia: async (media: Media): Promise<void> => {
    await sql`
      UPDATE media SET 
        title = ${media.title},
        type = ${media.type},
        thumbnail_url = ${media.thumbnailUrl},
        backdrop_url = ${media.backdropUrl},
        video_url = ${media.videoUrl || null},
        seasons = ${JSON.stringify(media.seasons || [])},
        description = ${media.description},
        year = ${media.year},
        genre = ${media.genre},
        rating = ${media.rating}
      WHERE id = ${media.id}
    `;
  },

  getSettings: async (): Promise<AppSettings> => {
    try {
      const rows = await sql`SELECT * FROM settings WHERE id = 'global'`;
      if (rows.length === 0) return { isMaintenanceMode: false };
      return { isMaintenanceMode: rows[0].is_maintenance_mode };
    } catch {
      return { isMaintenanceMode: false };
    }
  },

  updateSettings: async (settings: AppSettings) => {
    await sql`
      INSERT INTO settings (id, is_maintenance_mode) 
      VALUES ('global', ${settings.isMaintenanceMode})
      ON CONFLICT (id) DO UPDATE SET is_maintenance_mode = ${settings.isMaintenanceMode}
    `;
  },

  // Helper for local preferences
  getWatchedProgress: (id: string): number => {
    const data = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
    if (!data) return 0;
    try {
      return JSON.parse(data)[id] || 0;
    } catch { return 0; }
  },

  setWatchedProgress: (id: string, progress: number) => {
    const data = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
    const map = data ? JSON.parse(data) : {};
    map[id] = progress;
    localStorage.setItem(StorageKey.WATCHED_PROGRESS, JSON.stringify(map));
  }
};