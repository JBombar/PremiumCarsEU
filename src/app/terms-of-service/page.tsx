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
                <h2 className="text-2xl font-semibold">2. Terms of Service ("Terms")</h2>
                <p>
                    <strong>Last updated:</strong> [insert date]
                </p>
                <h3 className="text-xl font-medium">2.1 Acceptance</h3>
                <p>
                    By creating an account, clicking “I Agree,” or using CarBiz in any manner, you accept these Terms and our Privacy Policy.
                </p>

                <h3 className="text-xl font-medium">2.2 Eligibility & Account Responsibilities</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>You must be at least 18 years old and have authority to bind your dealership or company.</li>
                    <li>Keep credentials confidential; you are responsible for all activity under your account.</li>
                </ul>

                <h3 className="text-xl font-medium">2.3 Subscriptions, Fees & Payment</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>CarBiz is offered on a subscription-based licensing model with tiers (Starter, Pro, Enterprise).</li>
                    <li>Fees, billing periods, and renewal terms are displayed at checkout.</li>
                    <li>All fees are non-refundable except as required by law.</li>
                    <li>Failure to pay may result in account suspension or termination.</li>
                </ul>

                <h3 className="text-xl font-medium">2.4 License & Acceptable Use</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>We grant you a limited, non-exclusive, non-transferable license to access and use the Platform for your internal dealership operations.</li>
                    <li>No unlawful content or activity (e.g., fraud, money laundering, circumventing customs duties).</li>
                    <li>No reverse engineering or attempting to gain unauthorized access.</li>
                    <li>No scraping or bulk extraction except via our documented API.</li>
                    <li>Compliance with vehicle advertising laws and truth-in-pricing regulations.</li>
                </ul>

                <h3 className="text-xl font-medium">2.5 User-Generated Content & Listings</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>You retain ownership of vehicle photos, descriptions, and trademarks you upload (“Content”).</li>
                    <li>You grant CarBiz a worldwide, royalty-free license to host, display, and distribute Content to provide the service.</li>
                    <li>You warrant that Content is accurate, lawful, and does not infringe third-party rights.</li>
                </ul>

                <h3 className="text-xl font-medium">2.6 Intellectual Property</h3>
                <p>
                    CarBiz, its logo, code, and design are owned by [insert entity] and protected under copyright, trademark, and other laws. Except for the license above, no rights are granted.
                </p>

                <h3 className="text-xl font-medium">2.7 Third-Party Services</h3>
                <p>
                    The Platform integrates third-party tools (Supabase, n8n, payment processors, messaging providers). Their terms govern your use of those components.
                </p>

                <h3 className="text-xl font-medium">2.8 Termination</h3>
                <p>
                    You may cancel at any time from the billing portal; access continues until the end of the paid period. We may suspend or terminate if you breach these Terms, with or without notice.
                </p>

                <h3 className="text-xl font-medium">2.9 Disclaimers</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>The Platform is provided “as is” without warranties of any kind.</li>
                    <li>We do not guarantee sales, leads, or uninterrupted uptime.</li>
                    <li>You are solely responsible for compliance with motor-vehicle regulations and consumer-protection laws in your jurisdiction.</li>
                </ul>

                <h3 className="text-xl font-medium">2.10 Limitation of Liability</h3>
                <p>
                    To the maximum extent permitted by law, CarBiz will not be liable for indirect, incidental, special, consequential, or punitive damages or any loss of profits or revenues. Our total liability under these Terms will not exceed the fees paid by you in the 12 months preceding the event giving rise to the claim.
                </p>

                <h3 className="text-xl font-medium">2.11 Indemnification</h3>
                <p>
                    You agree to indemnify and hold harmless CarBiz, its affiliates, and personnel from any claim arising out of your use of the Platform or violation of these Terms.
                </p>

                <h3 className="text-xl font-medium">2.12 Governing Law & Jurisdiction</h3>
                <p>
                    These Terms are governed by the laws of Switzerland. Any dispute shall be resolved exclusively in the courts of [insert canton/city], Switzerland, unless another forum is mandated by consumer law.
                </p>

                <h3 className="text-xl font-medium">2.13 Changes to Terms</h3>
                <p>
                    We may revise these Terms with 30-days’ notice. Continued use after the effective date constitutes acceptance.
                </p>

                <h3 className="text-xl font-medium">2.14 Contact</h3>
                <p>
                    For questions, email info@premiumcarseu.com.
                </p>
            </section>

        </div>
    );
}
