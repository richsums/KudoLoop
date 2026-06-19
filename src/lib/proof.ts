import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { PROOF_BUCKET } from './env';
import { requireSupabase } from './supabase';

export type UploadedProof = {
  storagePath: string;
  thumbnailPath: string;
  mediaType: string;
};

/** Launch the OS image picker and return the chosen image URI, or null if cancelled/denied. */
export async function pickProofImage(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 1,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0]?.uri ?? null;
}

/**
 * Pick an image and return a persistable URI for local/demo mode (no backend).
 * Prefers a base64 data URL so it survives a reload via persisted storage;
 * falls back to the asset URI. Returns null if cancelled/denied.
 */
export async function pickLocalProof(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.4,
    base64: true,
  });

  if (result.canceled) {
    return null;
  }

  const asset = result.assets[0];
  if (!asset) {
    return null;
  }
  if (asset.base64) {
    const mime = asset.mimeType ?? 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri ?? null;
}

/** Resize + JPEG-compress an image. Best-effort: returns the original URI on failure. */
async function compress(uri: string, width: number, quality: number): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width } }], {
      compress: quality,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return result.uri;
  } catch {
    return uri;
  }
}

async function toArrayBuffer(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  return response.arrayBuffer();
}

/**
 * Compress a proof photo, upload a full-size and thumbnail copy to the PRIVATE
 * proofs bucket, then insert the proof_assets metadata row. Returns the storage
 * paths (never public URLs — viewing requires a short-lived signed URL).
 */
export async function uploadProofImage(params: {
  familyId: string;
  taskId: string;
  uploaderId: string;
  localUri: string;
}): Promise<UploadedProof> {
  const client = requireSupabase();
  const base = `private/${params.familyId}/${params.taskId}`;
  const storagePath = `${base}/original.jpg`;
  const thumbnailPath = `${base}/thumb.jpg`;
  const mediaType = 'image/jpeg';

  const [fullUri, thumbUri] = await Promise.all([
    compress(params.localUri, 1280, 0.7),
    compress(params.localUri, 240, 0.5),
  ]);

  const bucket = client.storage.from(PROOF_BUCKET);

  const fullUpload = await bucket.upload(storagePath, await toArrayBuffer(fullUri), {
    contentType: mediaType,
    upsert: true,
  });
  if (fullUpload.error) {
    throw fullUpload.error;
  }

  const thumbUpload = await bucket.upload(thumbnailPath, await toArrayBuffer(thumbUri), {
    contentType: mediaType,
    upsert: true,
  });
  if (thumbUpload.error) {
    throw thumbUpload.error;
  }

  const { error } = await client.from('proof_assets').insert({
    task_instance_id: params.taskId,
    uploader_id: params.uploaderId,
    storage_path: storagePath,
    thumbnail_path: thumbnailPath,
    media_type: mediaType,
    moderation_status: 'pending',
  });
  if (error) {
    throw error;
  }

  return { storagePath, thumbnailPath, mediaType };
}

/** Create a short-lived signed URL to view a private proof asset. */
export async function getProofSignedUrl(path: string, expiresInSeconds = 3600): Promise<string> {
  const client = requireSupabase();
  const { data, error } = await client.storage.from(PROOF_BUCKET).createSignedUrl(path, expiresInSeconds);

  if (error) {
    throw error;
  }

  return data.signedUrl;
}
