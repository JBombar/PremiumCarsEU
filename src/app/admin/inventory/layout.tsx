import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory | PremiumCarsEU Admin",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 