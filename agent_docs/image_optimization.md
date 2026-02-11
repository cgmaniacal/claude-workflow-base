# Image Optimization

Read this when implementing any feature that displays images — hero banners, galleries, product cards, user avatars, or any image-heavy layout.

## Strategy Overview

Every image displayed on the site should go through two optimizations:

1. **Responsive variants** — Multiple resized versions served via `srcset` so the browser downloads only what it needs for the viewport.
2. **ThumbHash placeholder** — A ~25-byte hash stored inline that decodes to a blurry preview, shown while the full image loads.

## Libraries

| Library | Purpose | Install in |
|---------|---------|-----------|
| `sharp` | Resize images, generate responsive variants, extract metadata | `apps/api` or build script |
| `thumbhash` | Encode images to ThumbHash, decode hashes to placeholder images | Both `apps/web` and `apps/api` |

`sharp` is the standard Node.js image processing library — fast, well-maintained, no native binary headaches on common platforms.

`thumbhash` is a pure JS package (~2KB decoder) by Evan Wallace (esbuild/Figma). It produces a compact hash that encodes color, luminance, aspect ratio, and optional transparency.

## Responsive Image Variants

### Standard Breakpoints

Generate variants at these widths to align with Tailwind breakpoints:

```typescript
const WIDTHS = [320, 640, 768, 1024, 1280, 1920];
```

### Generation with sharp

```typescript
import sharp from 'sharp';

interface ImageVariant {
  buffer: Buffer;
  width: number;
  format: string;
}

async function generateVariants(
  input: Buffer,
  widths: number[] = [320, 640, 768, 1024, 1280, 1920],
): Promise<ImageVariant[]> {
  const metadata = await sharp(input).metadata();
  const originalWidth = metadata.width ?? 1920;

  // Only generate variants smaller than the original
  const targetWidths = widths.filter((w) => w <= originalWidth);

  return Promise.all(
    targetWidths.map(async (width) => {
      const buffer = await sharp(input)
        .resize(width)
        .webp({ quality: 80 })
        .toBuffer();
      return { buffer, width, format: 'webp' };
    }),
  );
}
```

### HTML Output

```html
<picture>
  <source
    type="image/webp"
    srcset="
      /images/hero-320w.webp   320w,
      /images/hero-640w.webp   640w,
      /images/hero-1024w.webp 1024w,
      /images/hero-1920w.webp 1920w
    "
    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
  />
  <img
    src="/images/hero-1024w.webp"
    alt="Descriptive alt text"
    width="1024"
    height="768"
    loading="lazy"
  />
</picture>
```

Always set explicit `width` and `height` to prevent Cumulative Layout Shift (CLS).

## ThumbHash Placeholders

### Why ThumbHash

| Property | Value |
|----------|-------|
| Hash size | ~25 bytes (~40 chars base64) |
| Encoding speed | Milliseconds |
| Decoder size | ~2KB (client-side JS) |
| Transparency | Supported |
| Aspect ratio | Encoded in hash |
| Dependencies | Zero (pure JS) |

### Encoding (Server-Side / Build-Time)

```typescript
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';

async function generateThumbHash(input: Buffer): Promise<string> {
  // Resize to max 100px on longest side for encoding
  const { data, info } = await sharp(input)
    .resize(100, 100, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const hash = rgbaToThumbHash(info.width, info.height, data);
  return Buffer.from(hash).toString('base64');
}
```

### Decoding (Client-Side)

```typescript
import { thumbHashToDataURL } from 'thumbhash';

function decodeThumbHash(base64Hash: string): string {
  const hash = Uint8Array.from(atob(base64Hash), (c) => c.charCodeAt(0));
  return thumbHashToDataURL(hash);
}
```

### React Component Pattern

```tsx
import { useState } from 'react';
import { thumbHashToDataURL } from 'thumbhash';

interface OptimizedImageProps {
  src: string;
  srcSet?: string;
  sizes?: string;
  thumbHash: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
}

export function OptimizedImage({
  src, srcSet, sizes, thumbHash, alt, width, height, className,
}: OptimizedImageProps): React.ReactElement {
  const [loaded, setLoaded] = useState(false);
  const hash = Uint8Array.from(atob(thumbHash), (c) => c.charCodeAt(0));
  const placeholder = thumbHashToDataURL(hash);

  return (
    <div className={className} style={{ position: 'relative', aspectRatio: `${width}/${height}` }}>
      <img
        src={placeholder}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', inset: 0, width: '100%', height: '100%',
          objectFit: 'cover', transition: 'opacity 0.3s',
          opacity: loaded ? 0 : 1,
        }}
      />
      <img
        src={src}
        srcSet={srcSet}
        sizes={sizes}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.3s',
        }}
      />
    </div>
  );
}
```

## Integration Points

### Build-Time (Static Assets)

For images known at build time (hero images, marketing assets, icons), process during the build step:

1. Place source images in a designated directory (e.g., `apps/web/src/assets/images/`)
2. A build script (Vite plugin or standalone) processes each image:
   - Generates responsive WebP variants at standard widths
   - Generates a ThumbHash
   - Outputs variants to the build output directory
   - Generates a manifest mapping original filenames to variants + ThumbHash
3. Components import from the manifest to get `srcSet` and `thumbHash` values

### Upload-Time (Full Stack — User/Admin Uploads)

For images uploaded at runtime (product photos, avatars, CMS content), process on the API:

1. Upload endpoint receives the image
2. API service processes with `sharp`:
   - Validates format and dimensions
   - Generates responsive variants, stores to disk or object storage
   - Generates ThumbHash
3. Store in the database alongside the image record:

```prisma
model Image {
  id         Int      @id @default(autoincrement())
  filename   String
  thumbHash  String   @db.VarChar(60)
  width      Int
  height     Int
  variants   Json     // [{ width: 640, url: "..." }, ...]
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

4. API returns the ThumbHash and variant URLs in the response
5. Frontend renders using the `OptimizedImage` component pattern above

### Upload Processing Service Pattern

```typescript
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';

const WIDTHS = [320, 640, 768, 1024, 1280, 1920];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ProcessedImage {
  thumbHash: string;
  width: number;
  height: number;
  variants: { width: number; buffer: Buffer; format: string }[];
}

export async function processUploadedImage(input: Buffer): Promise<ProcessedImage> {
  if (input.length > MAX_FILE_SIZE) {
    throw new AppError('VALIDATION_ERROR', 'Image exceeds maximum file size of 10MB', 400);
  }

  const metadata = await sharp(input).metadata();
  if (!metadata.width || !metadata.height) {
    throw new AppError('VALIDATION_ERROR', 'Could not read image dimensions', 400);
  }

  // Generate ThumbHash
  const { data, info } = await sharp(input)
    .resize(100, 100, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const hash = rgbaToThumbHash(info.width, info.height, data);
  const thumbHash = Buffer.from(hash).toString('base64');

  // Generate responsive variants
  const targetWidths = WIDTHS.filter((w) => w <= metadata.width!);
  const variants = await Promise.all(
    targetWidths.map(async (width) => ({
      width,
      buffer: await sharp(input).resize(width).webp({ quality: 80 }).toBuffer(),
      format: 'webp',
    })),
  );

  return {
    thumbHash,
    width: metadata.width,
    height: metadata.height,
    variants,
  };
}
```

## Image Format Strategy

| Format | Use case |
|--------|----------|
| **WebP** | Default output format — broad browser support, good compression |
| **AVIF** | Optional additional variant for newer browsers — better compression than WebP |
| **Original (JPEG/PNG)** | Fallback only — serve via `<picture>` element with WebP/AVIF as primary sources |

Generate WebP by default. Add AVIF generation only when the extra build/storage cost is justified by traffic volume.

## Checklist

When implementing an image-heavy feature:

- [ ] Responsive variants generated at standard widths
- [ ] Images served as WebP via `<picture>` or `srcset`
- [ ] ThumbHash generated and stored (in manifest or database)
- [ ] Placeholder shown during load with smooth fade transition
- [ ] Explicit `width`/`height` set to prevent CLS
- [ ] `loading="lazy"` on below-the-fold images
- [ ] `alt` text on all images (decorative images use `alt=""`)
- [ ] Upload endpoint validates file size and format (full stack)
