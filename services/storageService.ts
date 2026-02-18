import { createClient } from '@libsql/client/web';
import { Media, StorageKey, AppSettings, AppNotification } from '../types';

let clientInstance: any = null;

const getClient = () => {
  // Directly access standard environment variables
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || "";
  
  if (!url) {
    console.error("Cloud Error: No database URL found in secure environment.");
    return null;
  }
  
  if (!clientInstance) {
    try {
      clientInstance = createClient({
        url,
        authToken
      });
    } catch (e) {
      console.error("Cloud Error: Failed to initialize LibSQL client.", e);
      return null;
    }
  }
  return clientInstance;
};

export const storageService = {
  init: async () => {
    const client = getClient();
    if (!client) return;

    try {
      await client.execute(`
        CREATE TABLE IF NOT EXISTS media (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          type TEXT NOT NULL,
          thumbnail_url TEXT,
          backdrop_url TEXT,
          video_url TEXT,
          seasons TEXT,
          description TEXT,
          year INTEGER,
          genre TEXT,
          rating REAL,
          created_at INTEGER
        )
      `);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS settings (
          id TEXT PRIMARY KEY,
          is_maintenance_mode INTEGER DEFAULT 0
        )
      `);
      await client.execute(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          thumbnail_url TEXT,
          created_at INTEGER
        )
      `);
    } catch (e) {
      console.error("Turso Init failed:", e);
    }
  },

  getMedia: async (): Promise<Media[]> => {
    const client = getClient();
    if (!client) return [];
    try {
      const result = await client.execute("SELECT * FROM media ORDER BY created_at DESC");
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
      console.error("Turso Fetch Error:", err);
      return []; 
    }
  },

  addMedia: async (media: Omit<Media, 'id' | 'createdAt'>): Promise<Media | null> => {
    const client = getClient();
    if (!client) return null;
    const id = Math.random().toString(36).substring(2, 11);
    const createdAt = Date.now();
    try {
      await client.execute({
        sql: `INSERT INTO media (id, title, type, thumbnail_url, backdrop_url, video_url, seasons, description, year, genre, rating, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          id, 
          media.title, 
          media.type, 
          media.thumbnailUrl, 
          media.backdropUrl || null, 
          media.videoUrl || null, 
          JSON.stringify(media.seasons || []), 
          media.description, 
          media.year, 
          media.genre, 
          media.rating, 
          createdAt
        ]
      });
      return { ...media, id, createdAt } as Media;
    } catch (e) {
      console.error("Turso Save Error:", e);
      return null;
    }
  },

  updateMedia: async (media: Media): Promise<void> => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute({
        sql: `UPDATE media 
              SET title = ?, type = ?, thumbnail_url = ?, backdrop_url = ?, video_url = ?, 
                  seasons = ?, description = ?, year = ?, genre = ?, rating = ?
              WHERE id = ?`,
        args: [
          media.title, 
          media.type, 
          media.thumbnailUrl, 
          media.backdropUrl || null, 
          media.videoUrl || null, 
          JSON.stringify(media.seasons || []), 
          media.description, 
          media.year, 
          media.genre, 
          media.rating, 
          media.id
        ]
      });
    } catch (e) {
      console.error("Turso Update Error:", e);
    }
  },

  deleteMedia: async (id: string): Promise<void> => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute({
        sql: "DELETE FROM media WHERE id = ?",
        args: [id]
      });
    } catch (e) {
      console.error("Turso Delete Error:", e);
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
        sql: `INSERT INTO notifications (id, title, message, thumbnail_url, created_at)
              VALUES (?, ?, ?, ?, ?)`,
        args: [id, n.title, n.message, n.thumbnailUrl || null, createdAt]
      });
    } catch (e) {
      console.error("Turso Notification Error:", e);
    }
  },

  clearNotifications: async () => {
    const client = getClient();
    if (!client) return;
    try {
      await client.execute("DELETE FROM notifications");
    } catch (e) {
      console.error("Turso Clear Error:", e);
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