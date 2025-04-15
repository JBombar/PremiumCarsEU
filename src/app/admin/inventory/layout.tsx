import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inventory | CarBiz Admin",
};

export default function InventoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
} 