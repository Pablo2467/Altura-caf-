import { useState } from 'react';

interface Props {
  src: string | null;
  alt: string;
  fallback: string;
  className?: string;
}

export default function ProductImage({ src, alt, fallback, className = '' }: Props) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  if (!src || failedSrc === src) {
    return (
      <div className={`flex items-center justify-center bg-linear-to-br from-caramelo/20 to-cafe/20 text-5xl ${className}`}>
        {fallback}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailedSrc(src)}
      className={`object-cover ${className}`}
    />
  );
}