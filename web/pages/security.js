import Head from 'next/head';
import Link from 'next/link';
import AppShell from '../components/AppShell';
import { Shield, Lock, Eye, Server, Key, CheckCircle2 } from 'lucide-react';

export default function Security() {
  return (
    <>
      <Head>
        <title>Security | CareerPilot</title>
        <meta name="description" content="CareerPilot Security - Learn about our security measures and data protection practices." />
      </Head>
      <AppShell>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-6">
              <Shield className="w-8 h-8 text-teal-600" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Security & Data Protection</h1>
            <p className="text-xl text-gray-600">
              Your data security is our top priority. Learn how we protect your information.
            </p>
          </div>

          <div className="space-y-12">
            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <Lock className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Encryption</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    All data is encrypted to protect your information:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>In Transit:</strong> All communications use HTTPS/TLS 1.3 encryption</li>
                    <li><strong>At Rest:</strong> Database and file storage are encrypted using industry-standard AES-256 encryption</li>
                    <li><strong>Authentication:</strong> Passwords are hashed using bcrypt with salt</li>
                    <li><strong>API Security:</strong> All API requests require authentication tokens</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-green-100 p-3 rounded-lg">
                  <Server className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Infrastructure Security</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Our infrastructure is built with security in mind:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Hosting:</strong> Services hosted on secure, compliant cloud infrastructure</li>
                    <li><strong>Network Security:</strong> Firewalls, DDoS protection, and intrusion detection systems</li>
                    <li><strong>Access Controls:</strong> Role-based access control (RBAC) for all systems</li>
                    <li><strong>Monitoring:</strong> 24/7 security monitoring and alerting</li>
                    <li><strong>Backups:</strong> Regular automated backups with encrypted storage</li>
                    <li><strong>Disaster Recovery:</strong> Comprehensive disaster recovery and business continuity plans</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-purple-100 p-3 rounded-lg">
                  <Key className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Authentication & Access</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We implement multiple layers of access protection:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>Secure Authentication:</strong> OAuth 2.0 and secure session management</li>
                    <li><strong>Multi-Factor Authentication:</strong> Available for enhanced account security</li>
                    <li><strong>Session Management:</strong> Secure, time-limited sessions with automatic logout</li>
                    <li><strong>API Keys:</strong> Unique API keys for programmatic access</li>
                    <li><strong>Account Isolation:</strong> Strict data isolation between user accounts</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="bg-orange-100 p-3 rounded-lg">
                  <Eye className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-3">Data Privacy & Compliance</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    We are committed to protecting your privacy and complying with regulations:
                  </p>
                  <ul className="list-disc pl-6 space-y-2 text-gray-700">
                    <li><strong>GDPR Compliance:</strong> We comply with General Data Protection Regulation requirements</li>
                    <li><strong>Data Minimization:</strong> We only collect data necessary for service provision</li>
                    <li><strong>User Rights:</strong> You can access, correct, export, or delete your data at any time</li>
                    <li><strong>Third-Party Services:</strong> We use only trusted, compliant service providers</li>
                    <li><strong>Data Processing:</strong> Clear documentation of how your data is processed</li>
                    <li><strong>Privacy by Design:</strong> Security and privacy built into our architecture</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Security Best Practices</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">What We Do</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Regular security audits and penetration testing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Employee security training and background checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Incident response and breach notification procedures</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>Vulnerability management and patching</span>
                    </li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">What You Can Do</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Use a strong, unique password</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Enable two-factor authentication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Keep your login credentials secure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                      <span>Log out when using shared devices</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="bg-teal-50 rounded-xl border border-teal-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Payment Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                We use Stripe, a PCI-DSS Level 1 certified payment processor, for all payment transactions. This means:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We never store your full payment card details</li>
                <li>All payment data is encrypted and handled by Stripe's secure infrastructure</li>
                <li>Payment processing complies with PCI-DSS standards</li>
                <li>Your payment information is tokenized for secure transactions</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">AI Service Security</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                When we use AI services (like OpenAI) to process your data:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>We only send necessary data to AI services</li>
                <li>AI providers have strict data protection and privacy policies</li>
                <li>Data is not used to train AI models without your explicit consent</li>
                <li>We use secure API connections for all AI service communications</li>
              </ul>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Reporting Security Issues</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                If you discover a security vulnerability, please report it responsibly:
              </p>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-gray-700 mb-2">
                  <strong>Email:</strong> <a href="mailto:careerpilotconsulting@gmail.com" className="text-teal-600 hover:text-teal-700">careerpilotconsulting@gmail.com</a>
                </p>
                <p className="text-sm text-gray-600">
                  Please include details about the vulnerability and steps to reproduce. We appreciate responsible disclosure and will respond promptly.
                </p>
              </div>
            </section>

            <section className="bg-white rounded-xl border border-gray-200 p-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Security Updates</h2>
              <p className="text-gray-700 leading-relaxed">
                We continuously improve our security measures. This page is updated regularly to reflect our current security practices. For the most up-to-date information, please check back periodically.
              </p>
            </section>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4">
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700">
              Privacy Policy →
            </Link>
            <Link href="/terms" className="text-teal-600 hover:text-teal-700">
              Terms of Service →
            </Link>
            <Link href="/" className="text-teal-600 hover:text-teal-700 ml-auto">
              ← Back to Home
            </Link>
          </div>
        </div>
      </AppShell>
    </>
  );
}

