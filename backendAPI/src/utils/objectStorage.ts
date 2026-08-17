import { Storage } from '@google-cloud/storage';
import config from '../config/env';

/**
 * Single GCS storage module for the backend. Replaces the old local-disk imageStorage.
 * Credentials are supplied via GOOGLE_APPLICATION_CREDENTIALS (a mounted service-account key),
 * which the SDK picks up automatically — nothing to configure here.
 */
const storage = new Storage();

/** Object-key prefixes (folders) used within the buckets. */
export const PERSONA_PREFIX = 'personas';
export const PROFILE_PREFIX = 'profiles';
export const MODELS_PREFIX = 'models';

/** Uploads a buffer to the given bucket/key, setting the Content-Type so public reads serve it correctly. */
export const uploadObject = async (
  bucket: string,
  key: string,
  data: Buffer,
  contentType: string,
): Promise<void> => {
  await storage.bucket(bucket).file(key).save(data, {
    contentType,
    resumable: false,
  });
};

/** Downloads an object as a Buffer. Throws if the object does not exist. */
export const getObjectBuffer = async (bucket: string, key: string): Promise<Buffer> => {
  const [contents] = await storage.bucket(bucket).file(key).download();
  return contents;
};

/** Deletes an object. Missing objects are ignored so callers can use this for best-effort cleanup. */
export const deleteObject = async (bucket: string, key?: string): Promise<void> => {
  if (!key) return;
  await storage.bucket(bucket).file(key).delete({ ignoreNotFound: true });
};

/** Builds the public URL for a key in the public bucket (or via the configured CDN base). */
export const publicUrl = (key?: string): string | null => {
  if (!key) return null;
  if (config.GCS_PUBLIC_BASE_URL) {
    return `${config.GCS_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  return `https://storage.googleapis.com/${config.GCS_PUBLIC_BUCKET}/${key}`;
};

/** True when the stored profile image is one we manage in GCS (a bucket key), not an absolute
 *  external URL such as a Google avatar. */
export const isManagedProfileImage = (value?: string | null): value is string =>
  typeof value === 'string' && value.startsWith(`${PROFILE_PREFIX}/`);

/** Resolves a stored profile-image value for display: passes absolute http(s) URLs (Google
 *  avatars) through unchanged, otherwise treats it as a public-bucket object key. */
export const resolveProfileImageUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return publicUrl(value);
};
