import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { 
  Building, 
  Shield, 
  Users, 
  Sparkles, 
  Heart 
} from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-primary/90 to-primary/70 text-white">
        <div className="absolute inset-0 bg-black/30 mix-blend-multiply" />
        <div className="relative container max-w-7xl mx-auto px-6 sm:px-8 py-24 md:py-32 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl mb-6">
            Driven by Excellence
          </h1>
          <p className="max-w-2xl mx-auto text-xl font-medium text-white/90">
            Learn who we are and what drives our mission.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            Our Story
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-md text-muted-foreground mb-6">
                Founded in 2005, CarBiz began with a simple mission: to transform the car buying 
                experience in Switzerland. Our founder, Michael Brunner, was frustrated with the 
                traditional dealership model and envisioned a more transparent, customer-focused 
                approach to selling vehicles.
              </p>
              <p className="text-md text-muted-foreground mb-6">
                What started as a small showroom in Zurich has grown into Switzerland's most 
                trusted automotive marketplace, with three locations across the country and an 
                ever-expanding digital presence. Throughout our growth, we've remained committed 
                to our core principles: fair pricing, exceptional service, and absolute transparency.
              </p>
              <p className="text-md text-muted-foreground">
                Today, we're proud to have helped over 10,000 customers find their perfect vehicle, 
                earning a reputation as the dealership that truly puts customers first. Our journey 
                continues as we embrace new technologies and innovative approaches to make car buying 
                and selling simpler, more enjoyable, and more accessible than ever before.
              </p>
            </div>
            <div className="order-1 lg:order-2 bg-muted rounded-xl overflow-hidden h-[400px] relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Building size={64} className="opacity-20" />
              </div>
              {/* This would be replaced with an actual image */}
              {/* <Image 
                src="/images/about/our-story.jpg" 
                alt="CarBiz showroom and team"
                fill
                className="object-cover"
              /> */}
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="py-20 bg-muted/30">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            Our Values
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Trust */}
            <div className="bg-background rounded-lg p-8 text-center flex flex-col items-center shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Trust</h3>
              <p className="text-muted-foreground">
                We build lasting relationships based on honesty, integrity, and reliability
                at every step of the customer journey.
              </p>
            </div>
            
            {/* Transparency */}
            <div className="bg-background rounded-lg p-8 text-center flex flex-col items-center shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Transparency</h3>
              <p className="text-muted-foreground">
                We believe in clear communication, fair pricing, and providing 
                complete vehicle information with no hidden surprises.
              </p>
            </div>
            
            {/* Innovation */}
            <div className="bg-background rounded-lg p-8 text-center flex flex-col items-center shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Innovation</h3>
              <p className="text-muted-foreground">
                We continuously embrace new technologies and approaches to improve 
                the car buying and selling experience.
              </p>
            </div>
            
            {/* Customer First */}
            <div className="bg-background rounded-lg p-8 text-center flex flex-col items-center shadow-sm">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <Heart className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Customer First</h3>
              <p className="text-muted-foreground">
                Every decision we make prioritizes the needs, preferences, and 
                satisfaction of our customers above all else.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the Team */}
      <section className="py-20 bg-background">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8">
          <h2 className="text-3xl font-bold tracking-tight mb-12 text-center">
            Meet the Team
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Team Member 1 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="h-64 bg-muted relative">
                {/* This would be replaced with an actual image */}
                {/* <Image 
                  src="/images/team/michael-brunner.jpg" 
                  alt="Michael Brunner"
                  fill
                  className="object-cover"
                /> */}
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Users size={48} className="opacity-20" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">Michael Brunner</h3>
                <p className="text-primary font-medium mb-4">Founder & CEO</p>
                <p className="text-muted-foreground italic">
                  "Our goal is to reinvent how people buy and sell cars, making it 
                  the most enjoyable purchase they'll ever make."
                </p>
              </div>
            </div>
            
            {/* Team Member 2 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="h-64 bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Users size={48} className="opacity-20" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">Sarah Mueller</h3>
                <p className="text-primary font-medium mb-4">Sales Director</p>
                <p className="text-muted-foreground italic">
                  "I believe in building relationships, not just selling cars. Our customers 
                  become part of the CarBiz family."
                </p>
              </div>
            </div>
            
            {/* Team Member 3 */}
            <div className="bg-white rounded-lg overflow-hidden shadow-sm">
              <div className="h-64 bg-muted relative">
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                  <Users size={48} className="opacity-20" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-1">Thomas Weber</h3>
                <p className="text-primary font-medium mb-4">Chief Technology Officer</p>
                <p className="text-muted-foreground italic">
                  "Technology should make buying a car easier and more transparent. That's what 
                  drives our digital innovation."
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-muted">
        <div className="container max-w-7xl mx-auto px-6 sm:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            Want to join our journey?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            We're always looking for talented individuals who share our passion for 
            automotive excellence and customer service.
          </p>
          <Link href="/contact">
            <Button size="lg" className="px-8">
              Contact Us
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
} 