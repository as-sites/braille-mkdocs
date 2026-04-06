interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | string,
    options?: { httpMetadata?: { contentType?: string } },
  ): Promise<unknown>;
  delete(key: string): Promise<void>;
}

interface StorageEnv {
  MEDIA_BUCKET?: R2BucketLike;
  R2_PUBLIC_URL?: string;
  S3_PUBLIC_URL?: string;
}

function resolveBucket(env: StorageEnv): R2BucketLike {
  const bucket = env.MEDIA_BUCKET;

  if (!bucket) {
    throw new Error("MEDIA_BUCKET binding is not configured");
  }

  return bucket;
}

export async function uploadObject(
  env: StorageEnv,
  key: string,
  body: ArrayBuffer | ArrayBufferView | string,
  contentType: string,
): Promise<void> {
  const bucket = resolveBucket(env);

  await bucket.put(key, body, {
    httpMetadata: {
      contentType,
    },
  });
}

export async function deleteObject(env: StorageEnv, key: string): Promise<void> {
  const bucket = resolveBucket(env);
  await bucket.delete(key);
}

export function getPublicUrl(env: StorageEnv, key: string): string {
  const publicUrl = env.R2_PUBLIC_URL ?? env.S3_PUBLIC_URL ?? process.env.R2_PUBLIC_URL ?? process.env.S3_PUBLIC_URL;

  if (publicUrl) {
    return `${publicUrl.replace(/\/$/, "")}/${key}`;
  }

  return key;
}