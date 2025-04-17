'use client';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, X, Car } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogClose,
} from "@/components/ui/dialog";

interface CarImageGalleryProps {
    images: string[] | null;
    make: string;
    model: string;
    year: number | null;
    condition: string;
    bodyType?: string | null;
    listingType?: string | null;
}

export function CarImageGallery({
    images,
    make,
    model,
    year,
    condition,
    bodyType,
    listingType
}: CarImageGalleryProps) {
    const hasImages = images && Array.isArray(images) && images.length > 0;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalIndex, setModalIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);

    // Reset carousel when images change
    useEffect(() => {
        setCurrentIndex(0);
    }, [images]);

    // Set modal index to current carousel index when opening
    const openModal = () => {
        setModalIndex(currentIndex);
        setModalOpen(true);
    };

    // Navigation functions
    const nextImage = useCallback((isModal: boolean = false) => {
        if (!hasImages) return;
        const setter = isModal ? setModalIndex : setCurrentIndex;
        const current = isModal ? modalIndex : currentIndex;
        setter((current + 1) % images!.length);
    }, [hasImages, images, currentIndex, modalIndex]);

    const prevImage = useCallback((isModal: boolean = false) => {
        if (!hasImages) return;
        const setter = isModal ? setModalIndex : setCurrentIndex;
        const current = isModal ? modalIndex : currentIndex;
        setter((current - 1 + images!.length) % images!.length);
    }, [hasImages, images, currentIndex, modalIndex]);

    // Keyboard navigation for modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!modalOpen) return;

            if (e.key === 'ArrowLeft') prevImage(true);
            else if (e.key === 'ArrowRight') nextImage(true);
            else if (e.key === 'Escape') setModalOpen(false);
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [modalOpen, nextImage, prevImage]);

    // Touch swipe handlers
    const handleTouchStart = (e: React.TouchEvent, isModal: boolean = false) => {
        setTouchStart(e.targetTouches[0].clientX);
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const handleTouchEnd = (isModal: boolean = false) => {
        if (touchStart - touchEnd > 50) {
            // Swipe left - next image
            nextImage(isModal);
        } else if (touchEnd - touchStart > 50) {
            // Swipe right - previous image
            prevImage(isModal);
        }
    };

    // Placeholder display when no images
    if (!hasImages) {
        return (
            <div className="w-full h-80 bg-muted rounded-md flex items-center justify-center">
                <div className="text-center p-8">
                    <Car className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">{year} {make} {model}</h3>
                    <p className="text-muted-foreground mt-2">{condition === "new" ? "New" : "Used"} {bodyType || "Vehicle"}</p>
                    {listingType && (
                        <Badge className="mt-4">{listingType === "rent" ? "For Rent" : "For Sale"}</Badge>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Main image carousel */}
            <div
                className="relative w-full aspect-[16/9] max-h-[30rem] bg-muted rounded-md overflow-hidden group"
                onClick={openModal}
                onTouchStart={(e) => handleTouchStart(e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={() => handleTouchEnd()}
            >
                {/* Current image - Increased container height and added aspect ratio for better viewing */}
                <div className="w-full h-full">
                    <img
                        src={images[currentIndex]}
                        alt={`${year} ${make} ${model} - Image ${currentIndex + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                        }}
                    />
                </div>



                {/* Navigation arrows - only show if multiple images */}
                {images.length > 1 && (
                    <>
                        <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                prevImage();
                            }}
                            aria-label="Previous image"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100"
                            onClick={(e) => {
                                e.stopPropagation();
                                nextImage();
                            }}
                            aria-label="Next image"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </>
                )}

                {/* Image counter badge */}
                {images.length > 1 && (
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
                        {currentIndex + 1} / {images.length}
                    </div>
                )}
            </div>

            {/* Thumbnails row */}
            {images.length > 1 && (
                <div className="flex space-x-2 overflow-x-auto pb-2 px-1">
                    {images.map((image, index) => (
                        <button
                            key={index}
                            className={`h-16 w-16 flex-shrink-0 rounded overflow-hidden border-2 transition-all focus:outline-none
                ${index === currentIndex ? 'border-primary scale-105' : 'border-transparent hover:border-primary/50'}`}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`View image ${index + 1}`}
                        >
                            <img
                                src={image}
                                alt={`${make} ${model} thumbnail ${index + 1}`}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                                }}
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Fullscreen modal */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-5xl max-h-[90vh] p-0 overflow-hidden bg-black/95">
                    <DialogClose className="absolute top-4 right-4 rounded-full p-2 text-white bg-black/50 hover:bg-black/70 z-10">
                        <X className="h-5 w-5" />
                    </DialogClose>

                    {/* Modal image carousel */}
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onTouchStart={(e) => handleTouchStart(e, true)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={() => handleTouchEnd(true)}
                    >
                        <img
                            src={images[modalIndex]}
                            alt={`${year} ${make} ${model} - Full view`}
                            className="max-w-full max-h-[80vh] object-contain p-4"
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/car-placeholder.jpg';
                            }}
                        />

                        {/* Modal navigation arrows */}
                        {images.length > 1 && (
                            <>
                                <button
                                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                                    onClick={() => prevImage(true)}
                                    aria-label="Previous image"
                                >
                                    <ChevronLeft className="h-6 w-6" />
                                </button>
                                <button
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full"
                                    onClick={() => nextImage(true)}
                                    aria-label="Next image"
                                >
                                    <ChevronRight className="h-6 w-6" />
                                </button>

                                {/* Modal image counter */}
                                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                    {modalIndex + 1} / {images.length}
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
} 