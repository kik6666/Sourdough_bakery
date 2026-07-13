import { getSession } from "./auth-service.js";
import { supabase } from "./supabase-client.js";

const PUBLIC_BUCKETS = new Set(["products", "recipes", "articles"]);
const BUCKET_RULES = {
  products: {
    maxBytes: 5 * 1024 * 1024,
  },
  recipes: {
    maxBytes: 5 * 1024 * 1024,
  },
  articles: {
    maxBytes: 5 * 1024 * 1024,
  },
  avatars: {
    maxBytes: 2 * 1024 * 1024,
  },
};

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_EXTENSION_MAP = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

function toError(code, message, details = null) {
  return { code, message, details };
}

function ok(data) {
  return { ok: true, data, error: null };
}

function fail(code, message, details = null) {
  return { ok: false, data: null, error: toError(code, message, details) };
}

function hasFileShape(file) {
  return Boolean(file && typeof file === "object" && typeof file.size === "number" && typeof file.type === "string");
}

function safeFileNamePart(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

function resolveExtension(file) {
  const byMime = MIME_EXTENSION_MAP[file.type];
  if (byMime) {
    return byMime;
  }

  const sourceName = String(file?.name || "").toLowerCase();
  const index = sourceName.lastIndexOf(".");
  if (index >= 0 && index < sourceName.length - 1) {
    return sourceName.slice(index + 1);
  }

  return "bin";
}

function validateFile(file, bucket) {
  if (!BUCKET_RULES[bucket]) {
    return fail("INVALID_BUCKET", "Unsupported storage bucket.", { bucket });
  }

  if (!hasFileShape(file)) {
    return fail("INVALID_FILE", "A valid file object is required.");
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return fail("INVALID_FILE_TYPE", "Unsupported image file type.", {
      fileType: file.type,
      allowedTypes: [...ALLOWED_MIME_TYPES],
    });
  }

  if (file.size <= 0) {
    return fail("INVALID_FILE_SIZE", "File size must be greater than zero.");
  }

  if (file.size > BUCKET_RULES[bucket].maxBytes) {
    return fail("FILE_TOO_LARGE", "File exceeds the size limit for this bucket.", {
      maxBytes: BUCKET_RULES[bucket].maxBytes,
      actualBytes: file.size,
    });
  }

  return ok(true);
}

async function getAuthenticatedUserId() {
  const session = await getSession();
  return session?.user?.id || null;
}

function createUniqueObjectPath(bucket, file, userId = null) {
  const extension = resolveExtension(file);
  const sourceBase = safeFileNamePart(String(file?.name || "image").replace(/\.[^/.]+$/, "")) || "image";
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const fileName = `${sourceBase}-${uniqueSuffix}.${extension}`;

  if (bucket === "avatars") {
    return `${userId}/${fileName}`;
  }

  const dateFolder = new Date().toISOString().slice(0, 10);
  return `${dateFolder}/${fileName}`;
}

function parseStoragePath(path) {
  const raw = String(path || "").trim().replace(/^\/+/, "");
  if (!raw) {
    return null;
  }

  const firstSlash = raw.indexOf("/");
  if (firstSlash <= 0 || firstSlash === raw.length - 1) {
    return null;
  }

  const bucket = raw.slice(0, firstSlash);
  const objectPath = raw.slice(firstSlash + 1);
  return { bucket, objectPath };
}

function buildPublicUrl(bucket, objectPath) {
  if (!PUBLIC_BUCKETS.has(bucket)) {
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data?.publicUrl || null;
}

async function uploadImageToBucket(bucket, file) {
  try {
    const validation = validateFile(file, bucket);
    if (!validation.ok) {
      return validation;
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to upload images.");
    }

    const objectPath = createUniqueObjectPath(bucket, file, userId);
    const { error: uploadError } = await supabase.storage.from(bucket).upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

    if (uploadError) {
      return fail("UPLOAD_FAILED", "Image upload failed.", uploadError.message);
    }

    const fullPath = `${bucket}/${objectPath}`;
    return ok({
      bucket,
      path: objectPath,
      fullPath,
      publicUrl: buildPublicUrl(bucket, objectPath),
    });
  } catch (error) {
    return fail("UPLOAD_FAILED", "Image upload failed.", error.message);
  }
}

export async function uploadProductImage(file) {
  return uploadImageToBucket("products", file);
}

export async function uploadRecipeImage(file) {
  return uploadImageToBucket("recipes", file);
}

export async function uploadArticleImage(file) {
  return uploadImageToBucket("articles", file);
}

export async function uploadAvatar(file) {
  return uploadImageToBucket("avatars", file);
}

export async function deleteImage(path) {
  try {
    const parsed = parseStoragePath(path);
    if (!parsed) {
      return fail("INVALID_PATH", "Path must be in the format bucket/object-path.");
    }

    const { bucket, objectPath } = parsed;
    if (!BUCKET_RULES[bucket]) {
      return fail("INVALID_BUCKET", "Unsupported storage bucket.", { bucket });
    }

    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return fail("AUTH_REQUIRED", "You must be authenticated to delete images.");
    }

    const { error } = await supabase.storage.from(bucket).remove([objectPath]);
    if (error) {
      return fail("DELETE_FAILED", "Could not delete image.", error.message);
    }

    return ok({ bucket, path: objectPath, fullPath: `${bucket}/${objectPath}` });
  } catch (error) {
    return fail("DELETE_FAILED", "Could not delete image.", error.message);
  }
}

export function getPublicUrl(path) {
  const parsed = parseStoragePath(path);
  if (!parsed) {
    return fail("INVALID_PATH", "Path must be in the format bucket/object-path.");
  }

  const { bucket, objectPath } = parsed;
  if (!BUCKET_RULES[bucket]) {
    return fail("INVALID_BUCKET", "Unsupported storage bucket.", { bucket });
  }

  const publicUrl = buildPublicUrl(bucket, objectPath);
  if (!publicUrl) {
    return fail("NOT_PUBLIC", "This bucket does not expose public URLs.", { bucket });
  }

  return ok({ bucket, path: objectPath, fullPath: `${bucket}/${objectPath}`, publicUrl });
}
