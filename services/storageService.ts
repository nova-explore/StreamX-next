
import { neon } from '@neondatabase/serverless';
import { Media, StorageKey, AppSettings, AppNotification } from '../types';

// Using 'any' for the SQL instance to avoid complex type conflicts with Neon's serverless driver return types
let sqlInstance: any = null;

const getSql = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) return null;
  if (!sqlInstance) sqlInstance = neon(dbUrl);
  return sqlInstance;
};

export const storageService = {
  // Initialize database tables with the required schema
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
      console.error("DB Initialization failed:", e);
    }
  },

  // Fix: Cast database results to any[] to resolve the error where 'map' is not recognized on the query result type
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
        rating: parseFloat(r.rating),
        createdAt: parseInt(r.created_at)
      }));
    } catch (err) { 
      console.error("Error fetching media:", err);
      return []; 
    }
  },

  // Add a new media entry to the database
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

  // Fix: Added missing updateMedia method to allow content editing in AdminDashboard
  updateMedia: async (media: Media): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
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
  },

  // Delete a media entry by its ID
  deleteMedia: async (id: string): Promise<void> => {
    const sql = getSql();
    if (!sql) return;
    await sql`DELETE FROM media WHERE id = ${id}`;
  },

  // Fix: Added missing getSettings method to support maintenance mode logic in the UI
  getSettings: async (): Promise<AppSettings> => {
    const sql = getSql();
    if (!sql) return { isMaintenanceMode: false };
    try {
      const rows = (await sql`SELECT * FROM settings LIMIT 1`) as any[];
      if (rows.length === 0) return { isMaintenanceMode: false };
      return { isMaintenanceMode: rows[0].is_maintenance_mode };
    } catch { return { isMaintenanceMode: false }; }
  },

  // Fix: Cast notification query results to any[] to resolve the error where 'map' is not recognized
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
        createdAt: parseInt(r.created_at)
      }));
    } catch { return []; }
  },

  // Add a notification to the system
  addNotification: async (n: Omit<AppNotification, 'id' | 'createdAt'>) => {
    const sql = getSql();
    if (!sql) return;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    await sql`
      INSERT INTO notifications (id, title, message, thumbnail_url, created_at)
      VALUES (${id}, ${n.title}, ${n.message}, ${n.thumbnailUrl}, ${createdAt})
    `;
  },

  // Clear all system notifications
  clearNotifications: async () => {
    const sql = getSql();
    if (!sql) return;
    await sql`DELETE FROM notifications`;
  },

  // Fix: Added missing setWatchedProgress method using LocalStorage for client-side persistence
  setWatchedProgress: (id: string, progress: number) => {
    try {
      const stored = localStorage.getItem(StorageKey.WATCHED_PROGRESS);
      const data = stored ? JSON.parse(stored) : {};
      data[id] = progress;
      localStorage.setItem(StorageKey.WATCHED_PROGRESS, JSON.stringify(data));
    } catch (e) {
      console.error("Failed to set watch progress:", e);
    }
  },

  // Fix: Added missing getWatchedProgress method to track viewing progress across sessions
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
