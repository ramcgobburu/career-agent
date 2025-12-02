import Head from 'next/head';
import Link from 'next/link';
import AppShell from '../components/AppShell';

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service | CareerPilot</title>
        <meta name="description" content="CareerPilot Terms of Service - Legal agreement for using our AI-powered career assistant platform." />
      </Head>
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

          <div className="prose prose-lg max-w-none space-y-8">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Agreement to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing or using CareerPilot ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of these terms, you may not access the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                CareerPilot is an AI-powered platform that helps users create career materials including:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Resumes and cover letters</li>
                <li>LinkedIn profile optimization</li>
                <li>Interview preparation materials</li>
                <li>Job application tracking</li>
                <li>Career-related content generation</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">3.1 Account Creation</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                To use certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as necessary</li>
                <li>Maintain the security of your account credentials</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">3.2 Account Eligibility</h3>
              <p className="text-gray-700 leading-relaxed">
                You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="text-gray-700 leading-relaxed mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use the Service for any illegal purpose or in violation of any laws</li>
                <li>Upload malicious code, viruses, or harmful content</li>
                <li>Attempt to gain unauthorized access to the Service or other users' accounts</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Impersonate any person or entity</li>
                <li>Violate intellectual property rights of others</li>
                <li>Upload false, misleading, or fraudulent information</li>
                <li>Resell or redistribute the Service without authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Subscription and Payment</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">5.1 Subscription Plans</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                We offer free and paid subscription plans. Paid subscriptions are billed weekly or monthly as selected.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.2 Payment Terms</h3>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Payments are processed securely through Stripe</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You authorize us to charge your payment method for renewal periods</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We reserve the right to change pricing with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">5.3 Cancellation</h3>
              <p className="text-gray-700 leading-relaxed">
                You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period. You will continue to have access until the period ends.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Intellectual Property</h2>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">6.1 Our Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                The Service, including its original content, features, and functionality, is owned by CareerPilot and protected by international copyright, trademark, and other intellectual property laws.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.2 Your Content</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                You retain ownership of content you upload or create. By using the Service, you grant us a license to:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Store, process, and display your content to provide the Service</li>
                <li>Use AI services to analyze and generate content based on your information</li>
                <li>Create backups and ensure data security</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                You represent that you have the right to grant this license and that your content does not violate any third-party rights.
              </p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">6.3 Generated Content</h3>
              <p className="text-gray-700 leading-relaxed">
                Content generated by our AI tools is provided for your use. You are responsible for reviewing, editing, and ensuring the accuracy of all generated content before use.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. AI-Generated Content Disclaimer</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Our Service uses artificial intelligence to generate content. You acknowledge that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>AI-generated content may contain errors or inaccuracies</li>
                <li>You are responsible for reviewing and verifying all generated content</li>
                <li>We do not guarantee the accuracy, completeness, or suitability of AI-generated content</li>
                <li>You should not rely solely on AI-generated content without human review</li>
                <li>We are not liable for any consequences resulting from use of generated content</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Service Availability</h2>
              <p className="text-gray-700 leading-relaxed">
                We strive to maintain Service availability but do not guarantee uninterrupted access. The Service may be unavailable due to maintenance, updates, or circumstances beyond our control. We are not liable for any downtime or service interruptions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>The Service is provided "as is" and "as available" without warranties of any kind</li>
                <li>We disclaim all warranties, express or implied, including merchantability and fitness for a particular purpose</li>
                <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
                <li>Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim</li>
                <li>We are not responsible for job application outcomes or career decisions made using our Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless CareerPilot, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from your use of the Service, violation of these Terms, or infringement of any rights of another.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We may terminate or suspend your account and access to the Service immediately, without prior notice, for:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Violation of these Terms</li>
                <li>Fraudulent, abusive, or illegal activity</li>
                <li>Non-payment of fees</li>
                <li>Extended account inactivity</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-4">
                Upon termination, your right to use the Service ceases immediately. We may delete your account and data in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by posting the updated Terms on this page and updating the "Last updated" date. Your continued use of the Service after changes constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which CareerPilot operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have questions about these Terms, please contact us:
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
      </AppShell>
    </>
  );
}

