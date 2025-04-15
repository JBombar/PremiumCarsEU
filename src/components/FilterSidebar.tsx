// Add proper typing for your FilterSidebar component
interface FilterSidebarProps {
  filters: {
    make: string;
    model: string;
    yearMin: number;
    yearMax: number;
    priceMin: number;
    priceMax: number;
    mileageMin: number;
    mileageMax: number;
    fuelType: string;
    transmission: string;
    condition: string;
    bodyType: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<any>>;
  onClose: () => void;
}

export default function FilterSidebar({ filters, setFilters, onClose }: FilterSidebarProps) {
  // Your FilterSidebar implementation...
} 