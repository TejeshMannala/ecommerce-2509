import React from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Truck, ShieldCheck, HeartHandshake } from 'lucide-react';
import Button from '../components/common/Button';

const valueCards = [
  {
    id: 'organic',
    title: 'Fresh and Organic',
    description:
      'We partner with trusted growers to bring high-quality produce that is fresh every day.',
    icon: Leaf,
    color: 'text-green-600 bg-green-100',
  },
  {
    id: 'delivery',
    title: 'Fast Delivery',
    description:
      'Same-day and next-day delivery options help your groceries arrive on time.',
    icon: Truck,
    color: 'text-blue-600 bg-blue-100',
  },
  {
    id: 'quality',
    title: 'Quality Promise',
    description:
      'Every item is carefully selected and quality checked before dispatch.',
    icon: ShieldCheck,
    color: 'text-amber-600 bg-amber-100',
  },
  {
    id: 'community',
    title: 'Local Community',
    description:
      'We support local farms and small food producers in every region we serve.',
    icon: HeartHandshake,
    color: 'text-rose-600 bg-rose-100',
  },
];

const About = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-br from-primary-700 via-primary-600 to-fresh-green text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">About Fresh Market</h1>
            <p className="text-lg text-primary-100 leading-relaxed">
              Fresh Market helps families shop smarter with farm-fresh groceries, transparent
              pricing, and reliable doorstep delivery.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div
                    className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${card.color}`}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">{card.title}</h2>
                  <p className="text-gray-600">{card.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Start Shopping Fresh Today</h3>
            <p className="text-gray-600 mb-6">
              Browse products by category and get your groceries delivered quickly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/products">
                <Button variant="primary" size="lg">
                  Browse Products
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="lg">
                  Create Account
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
