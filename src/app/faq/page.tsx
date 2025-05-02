import React from 'react';

export default function LegalPage() {
    return (
        <div className="container mx-auto max-w-3xl p-6 space-y-12">
            <header className="text-center">
                <h1 className="text-4xl font-bold">CarBiz Legal & Help Center</h1>
                <p className="mt-2 text-gray-600">
                    This single document contains three sections:
                </p>
                <ul className="mt-4 list-disc list-inside text-gray-700 space-y-1">
                    <li>
                        <strong>Privacy Policy</strong> – how we collect, use, and protect personal data.
                    </li>
                    <li>
                        <strong>Terms of Service</strong> – the rules that govern use of the CarBiz platform.
                    </li>
                    <li>
                        <strong>Frequently Asked Questions (FAQ)</strong> – quick answers for users and dealers.
                    </li>
                </ul>
                <p className="mt-4 text-sm text-red-600 font-semibold">
                    Important Notice
                    <br />
                    These materials are provided for information only and do not constitute legal advice. Review them with qualified counsel and insert your official company details before publishing.
                </p>
            </header>

            {/* Privacy Policy Section */}
            <section id="privacy-policy" className="space-y-8">
                {/* ... existing Privacy Policy content ... */}
            </section>

            {/* Terms of Service Section */}
            <section id="terms-of-service" className="space-y-6">
                {/* ... existing Terms of Service content ... */}
            </section>

            {/* FAQ Section */}
            <section id="faq" className="space-y-6">
                <h2 className="text-2xl font-semibold">3. Frequently Asked Questions (FAQ)</h2>
                <dl className="space-y-4">
                    <div>
                        <dt className="font-medium">What is CarBiz?</dt>
                        <dd className="ml-4 text-gray-700">
                            CarBiz is a white‑label SaaS platform that lets premium car dealers list, sell, or rent vehicles online, run AI‑powered search, and automate outreach – all under their own brand.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Who can sign up?</dt>
                        <dd className="ml-4 text-gray-700">
                            Licensed dealerships in Switzerland and the broader EEA, plus trusted partner resellers. Buyer accounts (read‑only) are free.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">How does pricing work?</dt>
                        <dd className="ml-4 text-gray-700">
                            We offer tiered monthly or annual subscriptions per dealership. Each tier unlocks additional inventory slots, user seats, analytics, and automation credits. See your Admin → Billing page for details.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Is my data secure?</dt>
                        <dd className="ml-4 text-gray-700">
                            Yes. Data are stored in Supabase (PostgreSQL) with row‑level security, encrypted at rest and in transit. We follow GDPR and Swiss FADP standards.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Can I migrate my data if I leave?</dt>
                        <dd className="ml-4 text-gray-700">
                            Absolutely – you can export listings, images, and analytics as CSV/JSON at any time, or ask support for a full data dump.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Does CarBiz handle payments between buyers and sellers?</dt>
                        <dd className="ml-4 text-gray-700">
                            No. CarBiz facilitates listings and communications; payment and delivery logistics are handled directly between the dealer and buyer.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">How do I list a vehicle?</dt>
                        <dd className="ml-4 text-gray-700">
                            Go to Inventory → Add New Vehicle, upload photos (max 5 MB each), fill in make, model, year, mileage, price, and choose “Sale,” “Rent,” or “Both.”
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">What’s the AI search feature?</dt>
                        <dd className="ml-4 text-gray-700">
                            Shoppers can type or speak a request (e.g., “family SUV under CHF 50k, hybrid”) and our LLM parses it into filters applied client‑side, returning relevant inventory instantly.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Can I connect my own domain?</dt>
                        <dd className="ml-4 text-gray-700">
                            Yes – on Pro and Enterprise tiers you can map a custom sub‑domain (e.g., cars.my‑dealer.ch) via CNAME.
                        </dd>
                    </div>
                    <div>
                        <dt className="font-medium">Where do I get support?</dt>
                        <dd className="ml-4 text-gray-700">
                            Email info@premiumcarseu.com.
                        </dd>
                    </div>
                </dl>
            </section>
        </div>
    );
}
