import { Wrench, Car, CreditCard } from "lucide-react";

interface ServiceProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const ServiceCard = ({ icon, title, description }: ServiceProps) => (
  <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex flex-col items-center text-center">
    <div className="rounded-full bg-primary/10 p-4 mb-4">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

export function OurServices() {
  const services = [
    {
      icon: <Wrench className="h-6 w-6 text-primary" />,
      title: "Maintenance Packages",
      description: "Affordable service plans tailored for your car's needs."
    },
    {
      icon: <Car className="h-6 w-6 text-primary" />,
      title: "Trade-In Program",
      description: "Easily trade in your current vehicle for credit towards your next purchase."
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Flexible Financing",
      description: "We partner with leading financial institutions to get you the best rates."
    }
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <ServiceCard
              key={index}
              icon={service.icon}
              title={service.title}
              description={service.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
} 