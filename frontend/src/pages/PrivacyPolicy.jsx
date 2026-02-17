import React from 'react';
import { ShieldCheck, Lock, Eye, Database } from 'lucide-react';

const sections = [
  {
    title: 'Information We Collect',
    body: 'We collect account details, delivery information, and order activity to provide reliable shopping and delivery services.',
    icon: Database,
  },
  {
    title: 'How We Use Data',
    body: 'Your data is used to process orders, improve recommendations, support customer service, and keep your account secure.',
    icon: Eye,
  },
  {
    title: 'Data Protection',
    body: 'We apply encryption, access controls, and monitoring to protect user information from unauthorized access.',
    icon: Lock,
  },
  {
    title: 'Your Privacy Rights',
    body: 'You can request updates or deletion of your data according to applicable laws and our internal retention policies.',
    icon: ShieldCheck,
  },
];

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
          <p className="max-w-3xl text-sm sm:text-base md:text-lg text-blue-100 leading-relaxed">
            Your privacy matters to us. This page explains what data we collect, why we collect it,
            and how we protect it when you use Fresh Market.
          </p>
        </div>
      </section>

      <section className="py-10 sm:py-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <article key={section.title} className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm">
                  <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{section.body}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};

export default PrivacyPolicy;
