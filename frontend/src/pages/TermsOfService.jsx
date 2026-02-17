import React from 'react';
import { FileText, Receipt, Ban, Scale } from 'lucide-react';

const terms = [
  {
    title: 'Account Responsibility',
    body: 'Keep your login credentials safe and ensure the information in your account is accurate and current.',
    icon: FileText,
  },
  {
    title: 'Orders and Payments',
    body: 'All orders are subject to availability and successful payment verification before processing and dispatch.',
    icon: Receipt,
  },
  {
    title: 'Prohibited Use',
    body: 'Users must not abuse the platform, interfere with services, or use fraudulent methods for purchases.',
    icon: Ban,
  },
  {
    title: 'Legal Compliance',
    body: 'By using this platform, you agree to applicable laws and regulations and accept these service terms.',
    icon: Scale,
  },
];

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-gray-900 via-gray-800 to-primary-700 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
          <p className="max-w-3xl text-sm sm:text-base md:text-lg text-gray-200 leading-relaxed">
            Please read these terms carefully before using Fresh Market. They define acceptable use,
            rights, responsibilities, and service conditions.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
          {terms.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-1.5">{item.title}</h2>
                    <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default TermsOfService;
