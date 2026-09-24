import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaHeart } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import { WishlistContext } from '../context/WishlistContext';

export default function Wishlist() {
  const { items } = useContext(WishlistContext);

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center gap-3 border-b border-gray-200 pb-5">
          <FaHeart className="text-red-500" size={20} />
          <div>
            <h1 className="text-2xl font-black uppercase italic text-black">Save for Later</h1>
            <p className="mt-1 text-xs font-medium text-gray-500">Your saved sports gear</p>
          </div>
        </div>

        {items.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {items.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-12 text-center shadow-sm">
            <FaHeart className="mx-auto mb-4 text-gray-300" size={32} />
            <h2 className="text-lg font-black uppercase text-black">Nothing saved yet</h2>
            <p className="mt-2 text-xs text-gray-500">Tap the heart on any product to save it for later.</p>
            <Link to="/products" className="mt-5 inline-block rounded-xl bg-volt-500 px-5 py-3 text-xs font-black uppercase text-black">
              Browse Gear
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}