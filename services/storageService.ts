
import { neon } from '@neondatabase/serverless';
import { Media, StorageKey, AppSettings, AppNotification } from '../types';

let sqlInstance: any = null;

const getSql = () => {
  // Support both standard DATABASE_URL and Vercel's automatic POSTGRES_URL
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!dbUrl || dbUrl === "") {
    console.error("Cloud Error: No database connection URL found in environment (Checked DATABASE_URL and POSTGRES_URL).");
    return null;
  }
  
  if (!sqlInstance) {
    try {
      sqlInstance = neon(dbUrl);
    } catch (e) {
      console.error("Cloud Error: Failed to initialize database client.", e);
      return null;
    }
  }
  return sqlInstance;
};

export const storageService = {
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
      await sql`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          thumbnail_url TEXT,
          created_at BIGINT
        )
      `;
    } catch (e) {
      console.error("Cloud Init failed:", e);
    }
  },

  getMedia: async (): Promise<Media[]> => {
    const sql = getSql();
    if (!sql) return [];
    try {
      const rows = (await sql`SELECT * FROM media ORDER BY created_at DESC`) as any[];
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        type: r.type as any,
        thumbnailUrl: r.thumbnail_url,
        backdropUrl: r.backdrop_url,
        videoUrl: r.video_url,
        seasons: typeof r.seasons === 'string' ? JSON.parse(r.seasons) : r.seasons,
        description: r.description,
        year: r.year,
        genre: r.genre,
        rating: parseFloat(r.rating || "0"),
        createdAt: parseInt(r.created_at || "0")
      }));
    } catch (err) { 
      console.error("Cloud Fetch Error:", err);
      return []; 
    }
  },

  addMedia: async (media: Omit<Media, 'id' | 'createdAt'>): Promise<Media | null> => {
    const sql = getSql();
    if (!sql) return null;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    try {
      // Fix: Use camelCase property names from the media object to match Media type definition in types.ts
      await sql`
        INSERT INTO media (id, title, type, thumbnail_url, backdrop_url, video_url, seasons, description, year, genre, rating, created_at)
        VALUES (${id}, ${media.title}, ${media.type}, ${media.thumbnailUrl}, ${media.backdropUrl}, ${media.videoUrl || null}, ${JSON.stringify(media.seasons || [])}, ${media.description}, ${media.year}, ${media.genre}, ${media.rating}, ${createdAt})
      `;
      return { ...media, id, createdAt } as Media;
    } catch (e) {
      console.error("Cloud Save Error:", e);
      return null;
    }
  },

  updateMedia: async (media: Media): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
    try {
      await sql`
        UPDATE media 
        SET title = ${media.title}, 
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
    } catch (e) {
      console.error("Cloud Update Error:", e);
    }
  },

  deleteMedia: async (id: string): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
    try {
      await sql`DELETE FROM media WHERE id = ${id}`;
    } catch (e) {
      console.error("Cloud Delete Error:", e);
    }
  },

  getSettings: async (): Promise<AppSettings> => {
    const sql = getSql();
    if (!sql) return { isMaintenanceMode: false };
    try {
      const rows = (await sql`SELECT * FROM settings LIMIT 1`) as any[];
      if (!rows || rows.length === 0) return { isMaintenanceMode: false };
      return { isMaintenanceMode: rows[0].is_maintenance_mode };
    } catch { return { isMaintenanceMode: false }; }
  },

  getNotifications: async (): Promise<AppNotification[]> => {
    const sql = getSql();
    if (!sql) return [];
    try {
      const rows = (await sql`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 10`) as any[];
      return rows.map(r => ({
        id: r.id,
        title: r.title,
        message: r.message,
        thumbnailUrl: r.thumbnail_url,
        createdAt: parseInt(r.created_at || "0")
      }));
    } catch { return []; }
  },

  addNotification: async (n: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const sql = getSql();
    if (!sql) return;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    try {
      // Fix: Use camelCase property name from the notification object to match AppNotification type definition in types.ts
      await sql`
        INSERT INTO notifications (id, title, message, thumbnail_url, created_at)
        VALUES (${id}, ${n.title}, ${n.message}, ${n.thumbnailUrl}, ${createdAt})
      `;
    } catch (e) {
      console.error("Cloud Notification Error:", e);
    }
  },

  clearNotifications: async () => {
    const sql = getSql();
    if (!sql) return;
    try {
      await sql`DELETE FROM notifications`;
    } catch (e) {
      console.error("Cloud Clear Error:", e);
    }
  },

  setWatchedProgress: (id: string, progress: number) => {
    try {
      const stored = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
      const data = stored ? JSON.parse(stored) : {};
      data[id] = progress;
      localStorage.setItem(StorageKey.WATCHED_PROGRESS, JSON.stringify(data));
    } catch (e) {
      console.error("Local Progress Error:", e);
    }
  },

  getWatchedProgress: (id: string): number => {
    try {
      const stored = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
      const data = stored ? JSON.parse(stored) : {};
      return data[id] || 0;
    } catch {
      return 0;
    }
  }
};
