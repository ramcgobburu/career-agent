import Head from 'next/head';
import Link from 'next/link';

export default function Privacy() {
  return (
    <>
      <Head>
        <title>Privacy Policy | CareerPilot</title>
        <meta name="description" content="CareerPilot Privacy Policy - How we collect, use, and protect your personal information." />
      </Head>
      <div className="min-h-screen bg-gray-50">
        {/* Simple Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center">
              <img src="/logo.svg" alt="CareerPilot" className="h-10" />
            </Link>
          </div>
        </header>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed">
                CareerPilot ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered career assistant platform (the "Service").
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Information You Provide</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Account Information:</strong> Name, email address, and password when you create an account</li>
                <li><strong>Career Context:</strong> Resumes, cover letters, career history, and other professional documents you upload</li>
                <li><strong>Usage Data:</strong> Content you generate, job applications you track, and interactions with our Service</li>
                <li><strong>Payment Information:</strong> Processed securely through Stripe (we do not store full payment card details)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">2.2 Automatically Collected Information</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Usage Analytics:</strong> Pages visited, features used, and time spent on the Service</li>
                <li><strong>Device Information:</strong> Browser type, device type, IP address, and operating system</li>
                <li><strong>Cookies and Tracking:</strong> We use cookies to maintain your session and improve your experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide, maintain, and improve our Service</li>
                <li>Generate personalized career materials using AI</li>
                <li>Process payments and manage subscriptions</li>
                <li>Send you service-related communications</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Detect and prevent fraud or abuse</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. AI and Data Processing</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Your career context and generated content are processed using AI services (OpenAI) to provide personalized career assistance. We:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Store your data securely in our database</li>
                <li>Use AI models to analyze and generate content based on your information</li>
                <li>Do not share your personal data with third parties for marketing purposes</li>
                <li>Maintain strict access controls to protect your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Sharing and Disclosure</h2>
              <p className="text-gray-700 leading-relaxed mb-4">We do not sell your personal information. We may share your data only in these circumstances:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Service Providers:</strong> With trusted third parties who assist in operating our Service (e.g., hosting, payment processing, AI services)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
                <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets (with notice to users)</li>
                <li><strong>With Your Consent:</strong> When you explicitly authorize us to share your information</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We implement industry-standard security measures to protect your information:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Encryption in transit (HTTPS/TLS) and at rest</li>
                <li>Secure authentication and access controls</li>
                <li>Regular security audits and monitoring</li>
                <li>Data backup and disaster recovery procedures</li>
                <li>Compliance with industry security standards</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                However, no method of transmission over the Internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Export:</strong> Download your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Account Controls:</strong> Manage your privacy settings in your account dashboard</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                To exercise these rights, contact us at <a href="mailto:careerpilotconsulting@gmail.com" className="text-teal-600 hover:text-teal-700">careerpilotconsulting@gmail.com</a>
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Data Retention</h2>
              <p className="text-gray-700 leading-relaxed">
                We retain your personal information for as long as your account is active or as needed to provide our Service. When you delete your account, we will delete or anonymize your data within 30 days, except where we are required to retain it for legal or regulatory purposes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                Our Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700">
                  <strong>Email:</strong> <a href="mailto:careerpilotconsulting@gmail.com" className="text-teal-600 hover:text-teal-700">careerpilotconsulting@gmail.com</a>
                </p>
              </div>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/" className="text-teal-600 hover:text-teal-700">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}

