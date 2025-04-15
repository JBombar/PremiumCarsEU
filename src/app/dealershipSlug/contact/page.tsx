export default function DealershipContactPage({ params }: { params: { dealershipSlug: string } }) {
  return (
    <div>
      <h1>Contact Page: {params.dealershipSlug}</h1>
    </div>
  );
} 