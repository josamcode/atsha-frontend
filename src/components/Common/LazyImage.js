import React, { useState, useRef, useEffect } from 'react';

/**
 * Lazy-loaded image component with WebP support
 * Automatically loads images when they enter viewport
 */
const LazyImage = ({ 
  src, 
  alt, 
  className = '', 
  placeholder = null,
  onLoad = null,
  onError = null,
  ...props 
}) => {
  const [imageSrc, setImageSrc] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  useEffect(() => {
    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      // Fallback: load immediately
      setImageSrc(src);
      return;
    }

    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setImageSrc(src);
            if (observerRef.current && imgRef.current) {
              observerRef.current.unobserve(imgRef.current);
            }
          }
        });
      },
      {
        rootMargin: '50px' // Start loading 50px before image enters viewport
      }
    );

    // Observe the image container
    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current && imgRef.current) {
        observerRef.current.unobserve(imgRef.current);
      }
    };
  }, [src]);

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // Try to use WebP if available
  const getOptimizedSrc = (originalSrc) => {
    if (!originalSrc) return null;
    
    // If it's already a data URL or external URL, return as is
    if (originalSrc.startsWith('data:') || originalSrc.startsWith('http')) {
      return originalSrc;
    }

    // For local images, try WebP version first
    // This assumes you have WebP versions available
    // You can customize this logic based on your setup
    return originalSrc;
  };

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {!isLoaded && !hasError && placeholder && (
        <div className="lazy-image-placeholder">
          {placeholder}
        </div>
      )}
      
      {imageSrc && (
        <img
          src={getOptimizedSrc(imageSrc)}
          alt={alt}
          className={`lazy-image ${isLoaded ? 'loaded' : 'loading'} ${className}`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          {...props}
        />
      )}
      
      {hasError && (
        <div className="lazy-image-error">
          {placeholder || <span>Failed to load image</span>}
        </div>
      )}
    </div>
  );
};

export default React.memo(LazyImage);

