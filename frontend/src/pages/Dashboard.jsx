import { useState, useEffect, useContext } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import { 
  FaStar, FaBolt, FaShoppingBag, FaChevronLeft, 
  FaChevronRight, FaArrowRight, FaHeart
} from 'react-icons/fa';

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const { addToCart } = useContext(CartContext);
  const { isWishlisted, toggleWishlist } = useContext(WishlistContext);
  const [searchParams] = useSearchParams();
  const searchTerm = searchParams.get('search')?.trim().toLowerCase() || '';

  // ⚡ Dynamic Slider States
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Exact slugs mapped to database
  const sportsCircles = [
    { name: 'Running', slug: 'running', img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
    { name: 'Football', slug: 'football', img: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200' },
    { name: 'Cricket', slug: 'cricket', img: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=200' },
    { name: 'Gym & Fitness', slug: 'gym-fitness', img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=200' },
    { name: 'Badminton', slug: 'badminton', img: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=200' },
    { name: 'Trekking & Outdoor', slug: 'trekking-outdoor', img: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=200' },
    { name: 'Cycling', slug: 'cycling', img: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=200' },
    { name: 'Combat Sports', slug: 'combat-sports', img: 'https://images.unsplash.com/photo-1549719386-74dfcbf7dbed?w=200' },
  ];

  // Exact max_price query parameters
  const priceTiers = [
    { label: 'Under', price: '₹499', maxPrice: '499' },
    { label: 'Under', price: '₹999', maxPrice: '999' },
    { label: 'Under', price: '₹1,499', maxPrice: '1499' },
    { label: 'Under', price: '₹1,999', maxPrice: '1999' },
  ];

  useEffect(() => {
    API.get('/products/')
      .then((res) => {
        const prodList = Array.isArray(res.data) ? res.data : (res.data.results || []);
        setProducts(prodList);
      })
      .catch((err) => console.error(err));
  }, []);

  // 🎯 Filter only Admin-selected Featured Products (Fallback to top products if none featured)
  const featuredSlides = products.filter((p) => p.is_featured);
  const activeSlides = featuredSlides.length > 0 ? featuredSlides : products.slice(0, 5);

  // Auto-slide effect (3.5 seconds)
  useEffect(() => {
    if (isPaused || activeSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [isPaused, activeSlides.length]);

  // Index reset agar list update ho
  useEffect(() => {
    if (currentSlide >= activeSlides.length) {
      setCurrentSlide(0);
    }
  }, [activeSlides.length, currentSlide]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % activeSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);

  const currentProduct = activeSlides[currentSlide];
  const matchingProducts = searchTerm
    ? products.filter((product) => (
      product.name?.toLowerCase().includes(searchTerm) ||
      product.brand?.toLowerCase().includes(searchTerm) ||
      product.category_name?.toLowerCase().includes(searchTerm) ||
      product.description?.toLowerCase().includes(searchTerm)
    ))
    : [];

  return (
    <div className="space-y-8 pb-16 bg-white font-sans">
      
      {/* Coupon Banner */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <div className="bg-dark-900 text-white border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-volt-500 text-black rounded-xl flex items-center justify-center font-black text-xl italic">
              <FaBolt />
            </div>
            <div>
              <div className="text-sm font-black uppercase italic">Hrazm Performance Store</div>
              <div className="text-[11px] text-gray-400">Official tournament gear & match equipment with express dispatch</div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <div className="bg-dark-800 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="font-bold text-white">₹100 OFF</span>
              <span className="bg-volt-500 text-black px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">NC100</span>
            </div>
            <div className="bg-dark-800 border border-gray-700 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span className="font-bold text-white">₹200 OFF</span>
              <span className="bg-volt-500 text-black px-1.5 py-0.5 rounded font-mono font-bold text-[10px]">NC200</span>
            </div>
          </div>
        </div>
      </div>

      {searchTerm && (
        <section className="max-w-7xl mx-auto px-4 space-y-4" aria-label="Search results">
          <div className="flex items-center justify-between border-b border-gray-200 pb-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-volt-600">Live Search</span>
              <h2 className="text-xl font-black uppercase italic text-black">Results for “{searchTerm}”</h2>
            </div>
            <span className="text-xs font-bold text-gray-500">{matchingProducts.length} products</span>
          </div>

          {matchingProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {matchingProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg transition-all group">
                  <Link to={`/product/${product.id}`} className="block relative aspect-square bg-gray-50 rounded-xl overflow-hidden p-2">
                    <img src={product.display_image || product.image_url} alt={product.name} className="w-full h-full object-contain group-hover:scale-105 transition-transform" />
                  </Link>
                  <div className="pt-3 space-y-1.5">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{product.brand || 'HRAZM SPORTS'}</div>
                    <Link to={`/product/${product.id}`} className="block text-xs font-black text-gray-900 line-clamp-2 hover:text-volt-700">{product.name}</Link>
                    <div className="flex items-baseline gap-2 pt-1">
                      <span className="text-sm font-black text-black">₹{Number(product.discount_price || product.price).toLocaleString()}</span>
                      {product.discount_price && <span className="text-[11px] text-gray-400 line-through">₹{Number(product.price).toLocaleString()}</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => addToCart(product, 1)} className="flex-1 bg-gray-100 hover:bg-volt-500 hover:text-black text-gray-800 py-2 rounded-xl text-[11px] font-black uppercase">Add to Bag</button>
                      <button
                        onClick={() => toggleWishlist(product)}
                        className={`w-9 rounded-xl border ${isWishlisted(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:text-red-500'} flex items-center justify-center`}
                        title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        aria-label={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <FaHeart size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center text-sm font-bold text-gray-500">No products found.</div>
          )}
        </section>
      )}

      {/* 1. CATEGORY CIRCLES */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 scrollbar-none">
          {sportsCircles.map((c, i) => (
            <Link 
              key={i} 
              to={`/products?category=${c.slug}`} 
              className="flex flex-col items-center flex-shrink-0 group"
            >
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 group-hover:border-volt-500 transition-all p-1">
                <img 
                  src={c.img} 
                  alt={c.name} 
                  className="w-full h-full object-cover rounded-xl group-hover:scale-105 transition-transform" 
                />
              </div>
              <span className="text-[11px] font-black uppercase text-gray-700 mt-2 text-center max-w-[90px] leading-tight group-hover:text-black">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* ⚡ HERO SECTION (LEFT BANNER + RIGHT DYNAMIC FEATURED SLIDER) */}
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-black italic uppercase text-black mb-4">Top Trending Gears</h2>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          
          {/* ================= LEFT: HERO BANNER ================= */}
          <div className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-md bg-black min-h-[340px] sm:min-h-[400px] flex items-center">
            <img
              src="https://images.unsplash.com/photo-1517649763962-0c623266ddc0?w=1600&q=80"
              alt="Hero Banner"
              className="absolute inset-0 w-full h-full object-cover opacity-55 scale-105 transition-transform duration-700 hover:scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-transparent" />
            
            <div className="relative z-10 p-7 sm:p-10 text-white max-w-md space-y-3.5">
              <span className="inline-block bg-volt-500 text-black text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm">
                High Performance Series
              </span>
              
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black italic uppercase tracking-tight leading-none text-white">
                Gear Up <br />
                <span className="text-volt-400">Like A Pro</span>
              </h2>
              
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                English willow bats, tournament footballs, turf studs & training sportswear.
              </p>
              
              <div className="pt-2">
                <Link 
                  to="/products" 
                  className="inline-flex items-center gap-2 bg-volt-500 hover:bg-volt-400 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(180,240,0,0.3)] hover:shadow-none"
                >
                  Explore Catalog <FaArrowRight size={11} />
                </Link>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: DYNAMIC FEATURED SLIDER ================= */}
          {activeSlides.length > 0 && currentProduct ? (
            <div 
              className="lg:col-span-6 relative rounded-3xl overflow-hidden shadow-md bg-gray-950 border border-gray-800 min-h-[340px] sm:min-h-[400px] flex flex-col justify-between p-6 sm:p-7 group"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              
              {/* Product Background Image with Blur Overlay */}
              {activeSlides.map((slide, index) => (
                <div
                  key={slide.id}
                  className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                    index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={slide.display_image || slide.image_url}
                    alt={slide.name}
                    className="w-full h-full object-contain p-8 opacity-95 scale-100 transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/75 to-black/40" />
                </div>
              ))}

              {/* Top Controls & Category Badge */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-volt-500/20 backdrop-blur-md text-volt-400 border border-volt-400/40 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                    {currentProduct.category_name || currentProduct.category_details?.name || 'Featured Gear'}
                  </span>
                  {currentProduct.discount_percentage > 0 && (
                    <span className="bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-md">
                      {currentProduct.discount_percentage}% OFF
                    </span>
                  )}
                </div>

                {/* Navigation Buttons */}
                {activeSlides.length > 1 && (
                  <div className="flex items-center gap-1.5 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
                    <button
                      onClick={prevSlide}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-volt-500 hover:text-black text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Previous Slide"
                    >
                      <FaChevronLeft size={10} />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="w-7 h-7 rounded-full bg-white/10 hover:bg-volt-500 hover:text-black text-white flex items-center justify-center transition-all cursor-pointer"
                      title="Next Slide"
                    >
                      <FaChevronRight size={10} />
                    </button>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="relative z-10 space-y-3 pt-6">
                <div className="flex items-center gap-1 text-amber-400 text-xs">
                  <FaStar size={11} />
                  <span className="text-[11px] text-gray-200 font-bold ml-0.5">
                    {currentProduct.rating || '4.8'}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ({currentProduct.rating_count || 25} reviews)
                  </span>
                </div>

                <h3 className="text-xl sm:text-2xl font-black uppercase italic text-white leading-snug line-clamp-2">
                  {currentProduct.name}
                </h3>

                <p className="text-xs text-gray-400 line-clamp-2">
                  {currentProduct.material ? `Material: ${currentProduct.material} • ` : ''}
                  {currentProduct.brand ? `Brand: ${currentProduct.brand}` : 'Tournament Match Standard'}
                </p>

                {/* Price & Direct Link */}
                <div className="flex items-center justify-between pt-2 border-t border-white/10">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-volt-400">
                      ₹{Number(currentProduct.discount_price || currentProduct.price).toLocaleString()}
                    </span>
                    {currentProduct.discount_price && (
                      <span className="text-xs text-gray-500 line-through">
                        ₹{Number(currentProduct.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <Link
                    to={`/product/${currentProduct.id}`}
                    className="bg-white hover:bg-volt-500 hover:text-black text-black px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md"
                  >
                    View Gear <FaArrowRight size={10} />
                  </Link>
                </div>

                {/* Indicator Dots */}
                {activeSlides.length > 1 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {activeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentSlide(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          currentSlide === idx ? 'w-6 bg-volt-500' : 'w-2 bg-white/20 hover:bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="lg:col-span-6 rounded-3xl bg-gray-950 border border-gray-800 p-8 flex items-center justify-center text-center text-gray-500 text-xs">
              No featured products marked yet.
            </div>
          )}

        </div>
      </div>

      {/* 2. SHOP BY PRICE RANGE */}
      <div className="max-w-7xl mx-auto px-4 space-y-4">
        <h3 className="text-lg font-black uppercase italic text-black">Shop By Price Range</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {priceTiers.map((tier, idx) => (
            <Link
              key={idx}
              to={`/products?max_price=${tier.maxPrice}`}
              className="bg-dark-900 text-white border border-gray-800 hover:border-volt-500 p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center text-center shadow-md hover:scale-[1.02] transition-all group"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 group-hover:text-volt-400">
                {tier.label}
              </span>
              <span className="text-3xl sm:text-4xl font-black text-white group-hover:text-volt-400 mt-1">
                {tier.price}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Products Row */}
      <div className="max-w-7xl mx-auto px-4 space-y-4 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 uppercase font-black tracking-wider">Top Athlete Picks</span>
            <h3 className="text-xl font-black uppercase italic text-black">Featured Sports Products</h3>
          </div>
          <Link to="/products" className="text-xs font-bold text-volt-700 hover:underline">
            View All Products →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.slice(0, 10).map((prod) => (
            <div key={prod.id} className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-lg transition-all group">
              <Link to={`/product/${prod.id}`} className="block relative aspect-square bg-gray-50 rounded-xl overflow-hidden p-2">
                <img
                  src={prod.display_image || prod.image_url}
                  alt={prod.name}
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                />
                {prod.is_featured && (
                  <span className="absolute top-2 left-2 bg-black text-volt-400 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                    Featured
                  </span>
                )}
              </Link>

              <div className="pt-3 space-y-1.5">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {prod.category_details?.name || prod.brand || 'HRAZM'}
                </div>
                <Link to={`/product/${prod.id}`} className="block text-xs font-black text-gray-900 line-clamp-2 hover:text-volt-700">
                  {prod.name}
                </Link>

                <div className="flex items-center gap-1 text-[11px]">
                  <div className="flex text-amber-400"><FaStar size={10} /></div>
                  <span className="font-bold text-gray-700">{prod.rating || '4.8'}</span>
                  <span className="text-gray-400 text-[10px]">({prod.rating_count || '35'})</span>
                </div>

                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-sm font-black text-black">
                    ₹{Number(prod.discount_price || prod.price).toLocaleString()}
                  </span>
                  {prod.discount_price && (
                    <span className="text-[11px] text-gray-400 line-through font-bold">
                      ₹{Number(prod.price).toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="pt-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => addToCart(prod, 1)}
                      className="flex-1 bg-gray-100 hover:bg-volt-500 hover:text-black text-gray-800 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <FaShoppingBag size={10} /> Add to Bag
                    </button>
                    <button
                      onClick={() => toggleWishlist(prod)}
                      className={`w-9 rounded-xl border ${isWishlisted(prod.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:text-red-500'} flex items-center justify-center transition-colors`}
                      title={isWishlisted(prod.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      aria-label={isWishlisted(prod.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                    >
                      <FaHeart size={12} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}