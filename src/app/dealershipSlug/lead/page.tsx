export default function DealershipLeadFormPage({ params }: { params: { dealershipSlug: string } }) {
  return (
    <div>
      <h1>Lead Form Page: {params.dealershipSlug}</h1>
    </div>
  );
} 