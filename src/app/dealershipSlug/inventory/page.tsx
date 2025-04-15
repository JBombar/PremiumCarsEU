export default function DealershipInventoryPage({ params }: { params: { dealershipSlug: string } }) {
  return (
    <div>
      <h1>Inventory Page: {params.dealershipSlug}</h1>
    </div>
  );
} 