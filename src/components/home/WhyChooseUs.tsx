import { ShieldCheck, Clock, SmileIcon } from "lucide-react";

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature = ({ icon, title, description }: FeatureProps) => (
  <div className="flex flex-col items-center text-center">
    <div className="rounded-full bg-primary/10 p-4 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 max-w-sm">{description}</p>
  </div>
);

export function WhyChooseUs() {
  const features = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-primary" />,
      title: "Certified Quality",
      description: "All our cars go through a 150-point inspection to ensure safety and performance."
    },
    {
      icon: <Clock className="h-6 w-6 text-primary" />,
      title: "Quick & Easy Process",
      description: "Get approved and drive away in less than 24 hours with our streamlined process."
    },
    {
      icon: <SmileIcon className="h-6 w-6 text-primary" />,
      title: "Customer First",
      description: "We prioritize transparency and support — before, during, and after your purchase."
    }
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 