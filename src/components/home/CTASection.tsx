import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-16 bg-primary/5">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Drive Your Dream Car?</h2>
        <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get in touch with us today and let us help you find the perfect ride.
        </p>
        <Button
          size="lg"
          className="px-8 py-6 text-base font-medium"
          asChild
        >
          <Link href="#request-car-form">Request a Car</Link>
        </Button>
      </div>
    </section>
  );
} 