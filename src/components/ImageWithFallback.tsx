'use client';

import { useState } from 'react';
import Image from 'next/image';

interface ImageWithFallbackProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
}

export function ImageWithFallback({
    src,
    alt,
    className,
    width,
    height,
    ...rest
}: ImageWithFallbackProps & Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'width' | 'height'>) {
    const [imgSrc, setImgSrc] = useState(src);
    const [imgLoaded, setImgLoaded] = useState(false);

    const handleError = () => {
        setImgSrc('/fallback.jpg');
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={className}
            width={width}
            height={height}
            onError={handleError}
            {...rest}
        />
    );
} 