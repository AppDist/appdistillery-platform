# Storage Reference

Complete guide to Supabase Storage for file uploads, downloads, and management.

## Quick Start

```typescript
// Upload file
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload('user-123/avatar.png', file)

// Download file
const { data, error } = await supabase
  .storage
  .from('avatars')
  .download('user-123/avatar.png')

// Get public URL
const { data } = supabase
  .storage
  .from('avatars')
  .getPublicUrl('user-123/avatar.png')
```

## Bucket Management

### Create Bucket

```typescript
const { data, error } = await supabase
  .storage
  .createBucket('avatars', {
    public: false,
    fileSizeLimit: 1024 * 1024 * 2, // 2MB
    allowedMimeTypes: ['image/png', 'image/jpeg']
  })
```

### List Buckets

```typescript
const { data, error } = await supabase
  .storage
  .listBuckets()
```

### Delete Bucket

```typescript
const { data, error } = await supabase
  .storage
  .deleteBucket('avatars')
```

## File Operations

### Upload File

```typescript
const file = event.target.files[0]
const fileExt = file.name.split('.').pop()
const fileName = `${Math.random()}.${fileExt}`
const filePath = `${userId}/${fileName}`

const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload(filePath, file, {
    cacheControl: '3600',
    upsert: false
  })
```

### Upload with Progress

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .upload(filePath, file, {
    onUploadProgress: (progress) => {
      const percent = (progress.loaded / progress.total) * 100
      console.log(`Upload: ${percent}%`)
    }
  })
```

### Download File

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .download('user-123/avatar.png')

// Convert to URL
const url = URL.createObjectURL(data)
```

### List Files

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .list('user-123', {
    limit: 100,
    offset: 0,
    sortBy: { column: 'name', order: 'asc' }
  })
```

### Delete Files

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .remove(['user-123/avatar.png', 'user-123/old-photo.jpg'])
```

### Move/Rename File

```typescript
const { data, error } = await supabase
  .storage
  .from('avatars')
  .move('user-123/old-name.png', 'user-123/new-name.png')
```

## Public vs Private Buckets

### Public Bucket

```typescript
// Files accessible via public URL
const { data } = supabase
  .storage
  .from('public-bucket')
  .getPublicUrl('path/to/file.jpg')

console.log(data.publicUrl)
// https://project.supabase.co/storage/v1/object/public/bucket/path
```

### Private Bucket with Signed URLs

```typescript
// Generate temporary signed URL (expires in 1 hour)
const { data, error } = await supabase
  .storage
  .from('private-bucket')
  .createSignedUrl('path/to/file.jpg', 3600)

console.log(data.signedUrl)
```

## Image Transformations

```typescript
const { data } = supabase
  .storage
  .from('avatars')
  .getPublicUrl('user-123/avatar.png', {
    transform: {
      width: 200,
      height: 200,
      resize: 'cover',
      quality: 80
    }
  })
```

## Storage Policies (RLS)

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read
CREATE POLICY "Public can read files"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'public-bucket');
```

## Common Patterns

### Avatar Upload

```typescript
async function uploadAvatar(file: File, userId: string) {
  const fileExt = file.name.split('.').pop()
  const fileName = `avatar.${fileExt}`
  const filePath = `${userId}/${fileName}`

  // Upload with upsert to replace existing
  const { error } = await supabase
    .storage
    .from('avatars')
    .upload(filePath, file, {
      upsert: true
    })

  if (error) throw error

  // Get public URL
  const { data } = supabase
    .storage
    .from('avatars')
    .getPublicUrl(filePath)

  return data.publicUrl
}
```

### React Upload Component

```typescript
function FileUpload() {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true)
      const file = event.target.files?.[0]
      if (!file) return

      const { error } = await supabase
        .storage
        .from('files')
        .upload(`${userId}/${file.name}`, file)

      if (error) throw error
      alert('Upload successful!')
    } catch (error) {
      alert(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <input
      type="file"
      onChange={handleUpload}
      disabled={uploading}
    />
  )
}
```

## Troubleshooting

**Issue**: "Bucket not found"
- Verify bucket name is correct
- Check bucket exists in dashboard
- Ensure proper permissions

**Issue**: "File size limit exceeded"
- Check bucket size limits
- Compress files before upload
- Adjust limits in bucket settings

**Issue**: RLS policy violations
- Verify storage policies are created
- Check auth.uid() matches folder structure
- Test with proper authentication
