export default function DealershipAboutPage({ params }: { params: { dealershipSlug: string } }) {
  return (
    <div>
      <h1>About Us Page: {params.dealershipSlug}</h1>
    </div>
  );
} 