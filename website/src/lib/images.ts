// Cloudinary delivers resized, modern-format (WebP/AVIF) copies when a transformation
// is inserted after "/image/upload/". The originals are several megabytes each, so
// every archive thumbnail should go through these helpers.
const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;
const RESPONSIVE_WIDTHS = [400, 800, 1200, 1600];

export function cloudinaryImage(url: string, width: number): string {
  const match = CLOUDINARY_UPLOAD.exec(url);
  if (!match) return url;
  return `${match[1]}f_auto,q_auto,c_limit,w_${width}/${match[2]}`;
}

export function responsiveImage(
  url: string,
  sizes: string,
  defaultWidth = 800,
): { src: string; srcSet?: string; sizes?: string } {
  if (!CLOUDINARY_UPLOAD.test(url)) return { src: url };
  return {
    src: cloudinaryImage(url, defaultWidth),
    srcSet: RESPONSIVE_WIDTHS.map((width) => `${cloudinaryImage(url, width)} ${width}w`).join(", "),
    sizes,
  };
}
