import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Youtube } from 'lucide-react';

const socialLinks = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: Facebook },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: Instagram },
  { label: 'Twitter', href: 'https://x.com', icon: Twitter },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: Youtube },
];

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-fresh-green rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">FM</span>
              </div>
              <span className="text-xl font-bold text-gradient">Fresh Market</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              Your trusted source for fresh, organic, and locally-sourced produce.
              We are committed to bringing you the best quality fruits, vegetables, and groceries.
            </p>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm">Organic</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
                <span className="text-sm">Fresh</span>
              </div>
              <div className="flex items-center space-x-2 text-green-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm">Local</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/products" className="text-gray-400 hover:text-white transition-colors">Products</Link></li>
              <li><Link to="/cart" className="text-gray-400 hover:text-white transition-colors">Cart</Link></li>
              <li><Link to="/orders" className="text-gray-400 hover:text-white transition-colors">Orders</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Customer Service</h3>
            <ul className="space-y-2">
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
          <p className="text-gray-400 text-sm">
            (c) 2024 Fresh Market. All rights reserved.
          </p>

          <div className="flex items-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gray-700 bg-gray-800 text-gray-300 transition-colors hover:border-primary-400 hover:text-white"
                aria-label={label}
                title={label}
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>

          <div className="flex space-x-6">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
              Terms of Service
            </Link>
            
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



