import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import API from '../services/api';
import { FaStar, FaShoppingBag, FaHeart } from 'react-icons/fa';

export default function ProductCard({ product }) {
  const { addToCart } = useContext(CartContext);
  const { isWishlisted, toggleWishlist } = useContext(WishlistContext);

  const price = Number(product.price);
  const discountPrice = product.discount_price ? Number(product.discount_price) : null;
  const discount = product.discount_percentage || (discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0);
  const prefetchDetails = () => API.get(`/products/${product.id}/`).catch(() => {});

  return (
    <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between relative">
      
      {/* Wishlist Button */}
      <button
        onClick={() => toggleWishlist(product)}
        className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-white/90 shadow-sm border border-gray-100 flex items-center justify-center transition-colors ${isWishlisted(product.id) ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
        title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
        aria-label={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
      >
        <FaHeart size={13} />
      </button>

      {/* Image container */}
      <Link to={`/product/${product.id}`} onMouseEnter={prefetchDetails} className="block relative pt-[85%] bg-gray-50 overflow-hidden">
        <img
          src={product.display_image || product.image_url || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 mix-blend-multiply"
        />
      </Link>

      {/* Product Info */}
      <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
        <div>
          <h3 className="font-extrabold text-sm text-black group-hover:text-volt-600 transition-colors line-clamp-1">
            <Link to={`/product/${product.id}`} onMouseEnter={prefetchDetails}>{product.name}</Link>
          </h3>
          <p className="text-[11px] text-gray-400 capitalize mt-0.5">
            {product.category_details?.name || 'Athletic Wear'}
          </p>

          {/* Rating */}
          <div className="flex items-center gap-1.5 mt-2">
            <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded text-[11px] font-bold text-amber-700">
              <FaStar size={10} className="text-amber-500" />
              <span>{product.rating || '4.8'}</span>
            </div>
            <span className="text-[10px] text-gray-400">({product.rating_count || '85'})</span>
          </div>
        </div>

        {/* Pricing and Cart Action */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-black text-base">
                Rs {Number(discountPrice || price).toLocaleString()}
              </span>
              {discountPrice && (
                <span className="text-xs text-gray-400 line-through">
                  Rs {price.toLocaleString()}
                </span>
              )}
            </div>
            {discount > 0 && (
              <span className="text-[10px] font-bold text-red-600">
                -{discount}% OFF
              </span>
            )}
          </div>

          {/* Neon Volt Cart Button */}
          <button
            onClick={() => addToCart(product, 1)}
            className="w-9 h-9 rounded-xl bg-volt-500 hover:bg-volt-400 text-black flex items-center justify-center transition-all shadow-md active:scale-95"
            title="Add to Cart"
          >
            <FaShoppingBag size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}