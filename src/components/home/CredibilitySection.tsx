"use client";

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';

// Sample testimonial data
const testimonials = [
  {
    id: 1,
    name: "Thomas Weber",
    quote: "CarBiz helped me find the perfect car for my family. Their team was professional and made the process stress-free.",
    rating: 5,
  },
  {
    id: 2,
    name: "Laura Schmid",
    quote: "I was impressed with how quickly they found exactly what I was looking for. Great selection and excellent service.",
    rating: 5,
  },
  {
    id: 3,
    name: "Daniel Meier",
    quote: "The team at CarBiz went above and beyond to help me find a car within my budget. Highly recommend!",
    rating: 4,
  },
];

export function CredibilitySection() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [direction, setDirection] = useState('next'); // 'next' or 'prev' for animation direction

  // Auto-rotate testimonials
  useEffect(() => {
    const interval = setInterval(() => {
      setDirection('next');
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Handle manual navigation
  const goToTestimonial = (index: number) => {
    setDirection(index > activeTestimonial ? 'next' : 'prev');
    setActiveTestimonial(index);
  };

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column: Reviews & Testimonials */}
          <div className="space-y-10">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
              What Customers Are Saying
            </h2>
            
            {/* Third-party review widgets */}
            <div className="space-y-6">
              {/* TrustPilot widget placeholder */}
              <div className="trustpilot-widget h-32 bg-muted/30 rounded-md flex items-center justify-center border border-gray-100 shadow-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">TrustPilot Reviews Widget</p>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Google Reviews widget placeholder */}
              <div className="google-reviews-widget h-32 bg-muted/30 rounded-md flex items-center justify-center border border-gray-100 shadow-sm">
                <div className="text-center">
                  <p className="text-muted-foreground">Google Reviews Widget</p>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Testimonials carousel with slide animation */}
            <div className="relative bg-muted/30 p-6 rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="testimonial-carousel h-[180px] relative">
                {testimonials.map((testimonial, index) => (
                  <div 
                    key={testimonial.id} 
                    className={`absolute w-full transition-all duration-500 ease-in-out ${
                      index === activeTestimonial 
                        ? 'transform translate-x-0 opacity-100 z-10' 
                        : direction === 'next'
                          ? index < activeTestimonial 
                            ? 'transform -translate-x-full opacity-0 z-0' 
                            : 'transform translate-x-full opacity-0 z-0'
                          : index < activeTestimonial 
                            ? 'transform -translate-x-full opacity-0 z-0' 
                            : 'transform translate-x-full opacity-0 z-0'
                    }`}
                  >
                    <blockquote className="text-lg italic mb-4">"{testimonial.quote}"</blockquote>
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{testimonial.name}</div>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < testimonial.rating ? 'fill-primary text-primary' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Carousel indicators */}
              <div className="flex justify-center space-x-2 mt-6">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToTestimonial(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === activeTestimonial ? 'bg-primary' : 'bg-gray-300'
                    }`}
                    aria-label={`View testimonial ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {/* Right Column: Stats Panel */}
          <div className="flex flex-col justify-center">
            <h2 className="text-2xl md:text-3xl font-bold text-center lg:text-left mb-10">
              Trusted by Thousands
            </h2>
            
            <div className="space-y-8">
              {/* Cars Sold Stat */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M19 9l-7 7-7-7" 
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">2,300+</div>
                  <div className="text-muted-foreground">Cars Sold</div>
                </div>
              </div>
              
              {/* Average Rating Stat */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">4.9/5</div>
                  <div className="text-muted-foreground">Average Rating</div>
                </div>
              </div>
              
              {/* Locations Stat */}
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="bg-primary/10 p-4 rounded-full">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-8 w-8 text-primary" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                    />
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                    />
                  </svg>
                </div>
                <div>
                  <div className="text-3xl font-bold">3</div>
                  <div className="text-muted-foreground">Locations in Switzerland</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 