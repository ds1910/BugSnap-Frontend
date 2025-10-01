import React from 'react';

/**
 * OptimizedImage Component - Performance Optimized Image Loading
 * 
 * Features:
 * - Lazy loading with loading="lazy"
 * - Responsive images with srcSet
 * - Proper alt text for accessibility
 * - Error handling with fallback
 * - Loading placeholder
 * - WebP support with fallback
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = true,
  fallback = '/images/fallback.png',
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  // Generate responsive image sources
  const generateSrcSet = (baseSrc, baseWidth) => {
    const widths = [320, 640, 768, 1024, 1280, 1920];
    return widths
      .filter(w => w <= baseWidth * 2) // Don't upscale beyond 2x
      .map(w => {
        // For WebP format
        const webpSrc = baseSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp');
        return `${webpSrc}?w=${w}&q=${quality} ${w}w`;
      })
      .join(', ');
  };

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  // Use fallback image if error occurs
  const imageSrc = imageError ? fallback : src;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading Placeholder */}
      {placeholder && !imageLoaded && (
        <div 
          className="absolute inset-0 bg-gray-700 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <svg 
            className="w-8 h-8 text-gray-500" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}

      {/* Optimized Image with WebP support */}
      <picture>
        {/* WebP format for modern browsers */}
        <source
          type="image/webp"
          srcSet={generateSrcSet(src, width)}
          sizes={sizes}
        />
        
        {/* Fallback for browsers that don't support WebP */}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          loading={loading}
          onLoad={handleLoad}
          onError={handleError}
          className={`transition-opacity duration-300 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            aspectRatio: width && height ? `${width}/${height}` : 'auto'
          }}
          {...props}
        />
      </picture>
    </div>
  );
};

export default OptimizedImage;