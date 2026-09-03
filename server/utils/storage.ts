import { createHash, randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, extname, join } from 'node:path'

export interface PutObjectInput {
  body: Buffer | Uint8Array
  contentType: string
  /** Original file name - used to derive a nice key + extension. */
  filename: string
  /** Logical folder, e.g. "news", "documents/2026". */
  prefix?: string
}

export interface StoredObject {
  key: string
  url: string
  driver: string
  size: number
}

export interface StorageAdapter {
  driver: string
  put(input: PutObjectInput): Promise<StoredObject>
  delete(key: string): Promise<void>
  /** Public URL for a stored key (no signing). */
  publicUrl(key: string): string
}

function safeName(filename: string): string {
  const ext = extname(filename).toLowerCase().replace(/[^.a-z0-9]/g, '')
  const stamp = new Date().toISOString().slice(0, 10)
  return `${stamp}/${randomUUID()}${ext || ''}`
}

/* ----------------------------- Local disk ----------------------------- */
class LocalAdapter implements StorageAdapter {
  driver = 'local'
  constructor(private dir: string, private publicBase: string) {}

  async put(input: PutObjectInput): Promise<StoredObject> {
    const key = [input.prefix, safeName(input.filename)].filter(Boolean).join('/')
    const abs = join(this.dir, key)
    await mkdir(dirname(abs), { recursive: true })
    await writeFile(abs, input.body)
    return { key, url: this.publicUrl(key), driver: this.driver, size: input.body.byteLength }
  }

  async delete(key: string): Promise<void> {
    await unlink(join(this.dir, key)).catch(() => {})
  }

  publicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, '')}/${key}`
  }
}

/* ------------------------- S3 / S3-compatible ------------------------ */
class S3Adapter implements StorageAdapter {
  driver = 's3'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any
  constructor(
    private bucket: string,
    private publicBase: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    client: any,
  ) {
    this.client = client
  }

  static async create(): Promise<S3Adapter> {
    const cfg = useRuntimeConfig()
    const { S3Client } = await import('@aws-sdk/client-s3')
    const client = new S3Client({
      region: cfg.s3Region,
      endpoint: cfg.s3Endpoint || undefined,
      forcePathStyle: cfg.s3ForcePathStyle === 'true',
      credentials: { accessKeyId: cfg.s3AccessKeyId, secretAccessKey: cfg.s3SecretAccessKey },
    })
    const base = cfg.s3PublicBase || `${cfg.s3Endpoint}/${cfg.s3Bucket}`
    return new S3Adapter(cfg.s3Bucket, base, client)
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const { PutObjectCommand } = await import('@aws-sdk/client-s3')
    const key = [input.prefix, safeName(input.filename)].filter(Boolean).join('/')
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.body,
        ContentType: input.contentType,
      }),
    )
    return { key, url: this.publicUrl(key), driver: this.driver, size: input.body.byteLength }
  }

  async delete(key: string): Promise<void> {
    const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }))
  }

  publicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, '')}/${key}`
  }
}

/* --------------------------- Supabase Storage ---------------------------- */
class SupabaseAdapter implements StorageAdapter {
  driver = 'supabase'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any
  constructor(private bucket: string, private publicBase: string, client: unknown) {
    this.client = client
  }

  static async create(): Promise<SupabaseAdapter> {
    const cfg = useRuntimeConfig()
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(cfg.supabaseUrl, cfg.supabaseServiceKey, {
      auth: { persistSession: false },
    })
    const base = `${cfg.supabaseUrl}/storage/v1/object/public/${cfg.supabaseBucket}`
    return new SupabaseAdapter(cfg.supabaseBucket, base, client)
  }

  async put(input: PutObjectInput): Promise<StoredObject> {
    const key = [input.prefix, safeName(input.filename)].filter(Boolean).join('/')
    const { error } = await this.client.storage
      .from(this.bucket)
      .upload(key, input.body, { contentType: input.contentType, upsert: false })
    if (error) throw new Error(`[supabase] ${error.message}`)
    return { key, url: this.publicUrl(key), driver: this.driver, size: input.body.byteLength }
  }

  async delete(key: string): Promise<void> {
    await this.client.storage.from(this.bucket).remove([key])
  }

  publicUrl(key: string): string {
    return `${this.publicBase.replace(/\/$/, '')}/${key}`
  }
}

let _adapter: StorageAdapter | null = null

/** Returns the configured media-storage adapter (STORAGE_DRIVER). Swappable via env. */
export async function useMediaStorage(): Promise<StorageAdapter> {
  if (_adapter) return _adapter
  const cfg = useRuntimeConfig()
  switch (cfg.storageDriver) {
    case 's3':
      _adapter = await S3Adapter.create()
      break
    case 'supabase':
      _adapter = await SupabaseAdapter.create()
      break
    default:
      _adapter = new LocalAdapter(cfg.storageLocalDir, cfg.storagePublicBase)
  }
  return _adapter
}

export function fileChecksum(buf: Buffer | Uint8Array): string {
  return createHash('sha256').update(buf).digest('hex')
}
