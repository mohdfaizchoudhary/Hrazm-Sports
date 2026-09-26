import { Link } from 'react-router-dom';
import { FaBolt, FaPhone, FaMapMarkerAlt } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-black text-gray-400 text-xs border-t border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        
        {/* Brand Column */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-volt-500 text-black rounded-lg flex items-center justify-center font-black">
              <FaBolt size={14} />
            </div>
            <span className="font-black text-xl tracking-tight text-white uppercase italic">
              HRAZM <span className="text-volt-500">SPORTS</span>
            </span>
          </div>
          <p className="text-gray-400 text-[11px] leading-relaxed">
            High-performance sports equipment, footwear & sportswear engineered for champions.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="font-black text-white uppercase mb-3">Athletic Categories</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/products?category=shoes" className="hover:text-volt-500">Footwear & Shoes</Link></li>
            <li><Link to="/products?category=clothing" className="hover:text-volt-500">Men & Women Sportswear</Link></li>
            <li><Link to="/products?category=cricket" className="hover:text-volt-500">Cricket Kits & Bats</Link></li>
            <li><Link to="/products?category=gym" className="hover:text-volt-500">Gym Equipment</Link></li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-black text-white uppercase mb-3">Customer Service</h4>
          <ul className="space-y-2 text-[11px]">
            <li><Link to="/orders" className="hover:text-volt-500">Track Orders</Link></li>
            <li><Link to="/cart" className="hover:text-volt-500">Bag & Checkout</Link></li>
            <li><a href="#" className="hover:text-volt-500">Returns & Exchanges</a></li>
            <li><a href="#" className="hover:text-volt-500">Size Guides</a></li>
          </ul>
        </div>

        {/* Contact Details */}
        <div>
          <h4 className="font-black text-white uppercase mb-3">Contact Details</h4>
          <div className="space-y-2 text-[11px] text-gray-500">
            <p className="font-bold text-gray-300">Zikrur Rehman</p>
            <a href="tel:9354225065" className="flex items-start gap-2 hover:text-volt-500">
              <FaPhone className="mt-0.5 shrink-0" /> 93542 25065
            </a>
            <p className="flex items-start gap-2 leading-relaxed">
              <FaMapMarkerAlt className="mt-0.5 shrink-0" />
              <span>New Delhi, 110025</span>
            </p>
          </div>
        </div>

      </div>

      <div className="border-t border-gray-900 py-4 text-center text-[10px] text-gray-600">
        © 2026 Hrazm Sports. All rights reserved. Designed for elite athletes.
      </div>
    </footer>
  );
}