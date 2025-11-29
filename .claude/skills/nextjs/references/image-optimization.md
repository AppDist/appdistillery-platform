# Image Optimization

Next.js provides the `next/image` component for automatic image optimization, lazy loading, and responsive images.

## Basic Usage

```tsx
import Image from 'next/image'

export default function Page() {
  return (
    <Image
      src="/profile.jpg"
      alt="Profile picture"
      width={500}
      height={500}
    />
  )
}
```

## Remote Images

Configure allowed domains in `next.config.ts`:

```typescript
import type { NextConfig } from 'next'

const config: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',
        port: '',
        pathname: '/images/**',
      },
    ],
  },
}

export default config
```

Then use remote images:

```tsx
<Image
  src="https://example.com/images/photo.jpg"
  alt="Remote image"
  width={800}
  height={600}
/>
```

## Responsive Images

### Using fill with Sizes

```tsx
<div style={{ position: 'relative', width: '100%', height: '400px' }}>
  <Image
    src="/hero.jpg"
    alt="Hero image"
    fill
    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Responsive Sizes Explained

The `sizes` prop tells the browser what size image to load:
- `(max-width: 768px) 100vw` - On mobile, image is 100% of viewport width
- `(max-width: 1200px) 50vw` - On tablet, image is 50% of viewport width
- `33vw` - On desktop, image is 33% of viewport width

## Priority Loading

Use `priority` for above-the-fold images to prevent Largest Contentful Paint (LCP) issues:

```tsx
<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority
/>
```

## Image Quality

Control JPEG/WebP quality (1-100, default 75):

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  quality={90}
/>
```

## Loading Behavior

### Lazy Loading (Default)

Images lazy load by default:

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  loading="lazy" // default
/>
```

### Eager Loading

For critical images:

```tsx
<Image
  src="/logo.jpg"
  alt="Logo"
  width={200}
  height={50}
  loading="eager"
/>
```

## Placeholder

### Blur Placeholder

```tsx
import Image from 'next/image'
import profilePic from '../public/profile.jpg'

<Image
  src={profilePic}
  alt="Profile"
  placeholder="blur"
  // blurDataURL is automatically provided for static imports
/>
```

### Custom Blur Data URL

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..."
/>
```

## Background Images

```tsx
<div
  style={{
    position: 'relative',
    width: '100%',
    minHeight: '400px'
  }}
>
  <Image
    src="/background.jpg"
    alt="Background"
    fill
    style={{
      objectFit: 'cover',
      objectPosition: 'center',
    }}
    quality={75}
  />
  <div style={{ position: 'relative', zIndex: 1 }}>
    <h1>Content over background</h1>
  </div>
</div>
```

## Image Formats

Next.js automatically serves modern formats (WebP, AVIF) when supported:

```typescript
// next.config.ts
const config: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
}
```

## Device Sizes

Configure device breakpoints:

```typescript
const config: NextConfig = {
  images: {
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  },
}
```

## Image Sizes

Configure image width breakpoints for responsive images:

```typescript
const config: NextConfig = {
  images: {
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
}
```

## Loader Configuration

### Custom Loader

```typescript
const config: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './my-loader.ts',
  },
}
```

```typescript
// my-loader.ts
export default function myImageLoader({ src, width, quality }) {
  return `https://cdn.example.com/${src}?w=${width}&q=${quality || 75}`
}
```

### Cloudinary Loader

```typescript
const config: NextConfig = {
  images: {
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/demo/image/upload/',
  },
}
```

## Styling

### Using className

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  className="rounded-lg shadow-lg"
/>
```

### Using style

```tsx
<Image
  src="/photo.jpg"
  alt="Photo"
  width={800}
  height={600}
  style={{
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
  }}
/>
```

## Common Patterns

### Profile Avatar

```tsx
<div className="relative w-24 h-24 rounded-full overflow-hidden">
  <Image
    src="/avatar.jpg"
    alt="User avatar"
    fill
    style={{ objectFit: 'cover' }}
  />
</div>
```

### Hero Section

```tsx
<div className="relative w-full h-screen">
  <Image
    src="/hero.jpg"
    alt="Hero"
    fill
    priority
    sizes="100vw"
    style={{
      objectFit: 'cover',
      objectPosition: 'center',
    }}
    quality={90}
  />
  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
    <h1 className="text-white text-6xl">Welcome</h1>
  </div>
</div>
```

### Gallery Grid

```tsx
<div className="grid grid-cols-3 gap-4">
  {images.map((image) => (
    <div key={image.id} className="relative aspect-square">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        style={{ objectFit: 'cover' }}
      />
    </div>
  ))}
</div>
```

### Thumbnail List

```tsx
<div className="flex gap-2">
  {thumbnails.map((thumb) => (
    <Image
      key={thumb.id}
      src={thumb.src}
      alt={thumb.alt}
      width={80}
      height={80}
      className="rounded"
    />
  ))}
</div>
```

## Performance Tips

1. **Always specify width and height** to prevent layout shift
2. **Use `priority` for LCP images** (hero images, above-the-fold)
3. **Use appropriate `sizes`** for responsive images
4. **Optimize quality** - default 75 is usually sufficient
5. **Use blur placeholders** for better perceived performance
6. **Configure proper caching** in production

## Troubleshooting

### Image not loading

- Check `remotePatterns` configuration
- Verify image path is correct
- Check file permissions
- Ensure image dimensions are specified

### Layout shift

- Always provide `width` and `height` or use `fill`
- Use `placeholder="blur"` for static imports
- Reserve space for images in CSS

### Slow loading

- Reduce `quality` if images are large
- Ensure proper `sizes` configuration
- Use appropriate image formats (WebP/AVIF)
- Enable CDN caching

## Advanced: Image Generation

Generate images at build time:

```tsx
// app/api/og/route.tsx
import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 128,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Hello World!
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  )
}
```
