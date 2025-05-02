import React from 'react';

export default function LegalPage() {
    return (
        <div className="container mx-auto max-w-3xl p-6 space-y-8">
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

            <section id="privacy-policy" className="space-y-4">
                <h2 className="text-2xl font-semibold">1. Privacy Policy</h2>
                <p>
                    <strong>Effective date:</strong> 01.02.2025
                </p>
                <h3 className="text-xl font-medium">1.1 Who We Are</h3>
                <p>
                    CarBiz (the “Platform”) is a Software‑as‑a‑Service solution that lets premium car dealers and dealerships create white‑label storefronts, manage inventory, and automate communication and analytics.
                    <br />
                    <br />
                    <strong>Contact:</strong> info@premiumcarseu.com
                </p>
                <h3 className="text-xl font-medium">1.2 Summary of Key Points</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>We collect only the information needed to run the service, support users, and improve the product.</li>
                    <li>We never sell personal data.</li>
                    <li>Data are stored on trusted infrastructure partners (Supabase EU region, AWS Amplify, n8n Cloud) with industry‑standard security.</li>
                    <li>You can access, correct, delete, or export your data at any time.</li>
                </ul>
                <h3 className="text-xl font-medium">1.3 Data We Collect</h3>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border px-4 py-2 text-left">Category</th>
                                <th className="border px-4 py-2 text-left">Examples</th>
                                <th className="border px-4 py-2 text-left">Purpose & Legal Basis*</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[
                                { cat: 'Account Data', ex: 'Name, email, phone, password hash, role', pur: 'Create and secure your account (Contract)' },
                                { cat: 'Dealer Profile Data', ex: 'Dealership name, address, VAT/ID, branding assets', pur: 'Provide white‑label site (Contract)' },
                                { cat: 'Listing Data', ex: 'Vehicle details, images, price, status, rental terms', pur: 'Publish inventory (Contract)' },
                                { cat: 'Transaction & Payment Data', ex: 'Subscription tier, invoices, payment method', pur: 'Billing & accounting (Contract / Legal Obligation)' },
                                { cat: 'Usage Data', ex: 'Listing views, search interactions, click stream, session logs, device & browser info, IP address', pur: 'Service optimization, analytics (Legitimate Interest)' },
                                { cat: 'Communication Data', ex: 'Messages, contact‑inquiry forms, support tickets, outreach logs', pur: 'Respond to requests, prevent abuse (Contract / Legitimate Interest)' },
                                { cat: 'Marketing Preferences', ex: 'Opt‑in consents, unsubscribes', pur: 'Send newsletters and offers (Consent)' },
                            ].map((row, idx) => (
                                <tr key={idx}>
                                    <td className="border px-4 py-2 align-top">{row.cat}</td>
                                    <td className="border px-4 py-2">{row.ex}</td>
                                    <td className="border px-4 py-2">{row.pur}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-sm italic">*Parenthetical text indicates the primary GDPR legal basis.</p>

                <h3 className="text-xl font-medium">1.4 How We Use Data</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Provide and maintain the Platform.</li>
                    <li>Personalize dashboards, recommendations, and search results.</li>
                    <li>Process payments and manage subscriptions.</li>
                    <li>Communicate service updates, security alerts, and marketing (if opted‑in).</li>
                    <li>Analyze performance and improve features.</li>
                    <li>Detect and prevent fraud or misuse.</li>
                    <li>Comply with law and enforce our Terms.</li>
                </ul>

                <h3 className="text-xl font-medium">1.5 Sharing & Disclosure</h3>
                <div className="overflow-x-auto">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-100">
                                <th className="border px-4 py-2 text-left">Recipient</th>
                                <th className="border px-4 py-2 text-left">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {[
                                { rec: 'Infrastructure providers (Supabase, AWS)', rea: 'Hosting, storage, backups' },
                                { rec: 'Automation platform (n8n)', rea: 'Intent parsing, email/WhatsApp workflows' },
                                { rec: 'Payment processor ([insert])', rea: 'Subscription billing' },
                                { rec: 'Analytics & error-tracking services ([insert])', rea: 'Product diagnostics' },
                                { rec: 'Professional advisers & auditors', rea: 'Legal, accounting, compliance' },
                                { rec: 'Authorities', rea: 'When required by law or court order' },
                            ].map((row, idx) => (
                                <tr key={idx}>
                                    <td className="border px-4 py-2 align-top">{row.rec}</td>
                                    <td className="border px-4 py-2">{row.rea}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p>We sign Data Processing Agreements (DPAs) with all sub‑processors and publish an up‑to‑date list at [insert URL].</p>

                <h3 className="text-xl font-medium">1.6 International Transfers</h3>
                <p>
                    Data may be transferred outside your home jurisdiction where our partners operate. We rely on adequacy decisions, Standard Contractual Clauses, or equivalent safeguards under GDPR Art. 46.
                </p>

                <h3 className="text-xl font-medium">1.7 Retention</h3>
                <p>
                    We keep personal data:
                    <ul className="list-disc list-inside ml-6">
                        <li>For active accounts: as long as you use the Platform.</li>
                        <li>After closure: generally 30 days, then securely delete or anonymize, unless longer retention is required for legal claims or bookkeeping.</li>
                    </ul>
                </p>

                <h3 className="text-xl font-medium">1.8 Security</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Encryption in transit (HTTPS/TLS 1.2+)</li>
                    <li>Encryption at rest</li>
                    <li>Row‑Level Security in Supabase</li>
                    <li>Least‑privilege access controls</li>
                    <li>Regular backups</li>
                    <li>Third‑party penetration testing</li>
                </ul>

                <h3 className="text-xl font-medium">1.9 Your Rights (GDPR & Swiss FADP)</h3>
                <ul className="list-disc list-inside space-y-1">
                    <li>Access a copy of your personal data</li>
                    <li>Correct inaccurate data</li>
                    <li>Delete (“right to be forgotten”)</li>
                    <li>Port data to another provider</li>
                    <li>Restrict or object to processing</li>
                    <li>Withdraw consent at any time (marketing)</li>
                    <li>Lodge a complaint with your local supervisory authority (e.g., EDÖB or your EU DPA)</li>
                </ul>

                <h3 className="text-xl font-medium">1.10 Children</h3>
                <p>The Platform is intended for users 18 years and older. We do not knowingly collect data from children.</p>

                <h3 className="text-xl font-medium">1.11 Changes</h3>
                <p>We will notify users of material changes via email or in-app notice at least 30 days before they take effect.</p>
            </section>

            {/* TODO: Add Terms of Service and FAQ sections similarly */}

        </div>
    );
}
