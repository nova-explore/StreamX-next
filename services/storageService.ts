import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Media, StorageKey, AppSettings } from '../types';

// Lazy-initialized SQL client
let sqlInstance: NeonQueryFunction<boolean, boolean> | null = null;

const getSql = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("Neon Database: DATABASE_URL is missing. Operating in restricted mode.");
    return null;
  }
  if (!sqlInstance) {
    sqlInstance = neon(dbUrl);
  }
  return sqlInstance;
};

// Removed demo seed data as requested
const INITIAL_DATA_SEED: Omit<Media, 'id' | 'createdAt'>[] = [];

export const storageService = {
  // Initialize Database Tables
  init: async () => {
    const sql = getSql();
    if (!sql) return;

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
      // Seed if empty (currently seeding nothing to keep it clean)
      const count = await sql`SELECT COUNT(*) FROM media`;
      if (parseInt(count[0].count) === 0 && INITIAL_DATA_SEED.length > 0) {
        for (const item of INITIAL_DATA_SEED) {
          await storageService.addMedia(item);
        }
      }
    } catch (e) {
      console.error("DB Initialization failed:", e);
    }
  },

  getMedia: async (): Promise<Media[]> => {
    const sql = getSql();
    if (!sql) return [];

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

  addMedia: async (media: Omit<Media, 'id' | 'createdAt'>): Promise<Media | null> => {
    const sql = getSql();
    if (!sql) return null;

    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    await sql`
      INSERT INTO media (id, title, type, thumbnail_url, backdrop_url, video_url, seasons, description, year, genre, rating, created_at)
      VALUES (${id}, ${media.title}, ${media.type}, ${media.thumbnailUrl}, ${media.backdropUrl}, ${media.videoUrl || null}, ${JSON.stringify(media.seasons || [])}, ${media.description}, ${media.year}, ${media.genre}, ${media.rating}, ${createdAt})
    `;
    return { ...media, id, createdAt } as Media;
  },

  deleteMedia: async (id: string): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
    await sql`DELETE FROM media WHERE id = ${id}`;
  },

  updateMedia: async (media: Media): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
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
    const sql = getSql();
    if (!sql) return { isMaintenanceMode: false };

    try {
      const rows = await sql`SELECT * FROM settings WHERE id = 'global'`;
      if (rows.length === 0) return { isMaintenanceMode: false };
      return { isMaintenanceMode: rows[0].is_maintenance_mode };
    } catch {
      return { isMaintenanceMode: false };
    }
  },

  updateSettings: async (settings: AppSettings) => {
    const sql = getSql();
    if (!sql) return;
    await sql`
      INSERT INTO settings (id, is_maintenance_mode) 
      VALUES ('global', ${settings.isMaintenanceMode})
      ON CONFLICT (id) DO UPDATE SET is_maintenance_mode = ${settings.isMaintenanceMode}
    `;
  },

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