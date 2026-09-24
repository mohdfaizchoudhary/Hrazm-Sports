import { useState, useEffect, useContext, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import { WishlistContext } from '../context/WishlistContext';
import Loading from '../components/Loading';
import { 
  FaChevronDown, 
  FaChevronUp, 
  FaChevronLeft, 
  FaStar, 
  FaTimes,
  FaShieldAlt,
  FaHeart
} from 'react-icons/fa';

const productResultsCache = new Map();

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const productsRequestId = useRef(0);
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { isWishlisted, toggleWishlist } = useContext(WishlistContext);

  // URL Query Parameters
  const categoryParam = searchParams.get('category') || '';
  const subcategoryParam = searchParams.get('subcategory') || '';
  const brandParam = searchParams.get('brand') || '';
  const genderParam = searchParams.get('gender') || '';
  const colorParam = searchParams.get('color') || '';
  const sizeParam = searchParams.get('size') || '';
  const minPriceParam = searchParams.get('min_price') || 'Min';
  const maxPriceParam = searchParams.get('max_price') || '3000+';
  const ratingParam = searchParams.get('rating') || '';
  const searchParam = searchParams.get('search') || '';
  const inStockParam = searchParams.get('in_stock') === 'true';
  const saleParam = searchParams.get('sale') === 'true';
  const replacementOrderId = searchParams.get('replace_order_id');

  // Section Accordion Toggles
  const [openSections, setOpenSections] = useState({
    brand: true,
    gender: true,
    color: true,
    size: false,
    price: true,
    rating: false,
    discount: false,
    availability: false
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const brandList = ['KIPSTA', 'KIPRUN', 'FLX', 'DOMYOS', 'PERFLY', 'QUECHUA', 'HRAZM'];
  const genderList = ['Men', 'Women', 'Unisex', 'Kids'];
  const colorList = ['Black', 'White', 'Navy Blue', 'Red', 'Blue', 'Olive', 'Grey'];
  const sizeList = ['6', '7', '8', '9', '10', '11', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    API.get('/categories/').then((res) => {
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setCategories(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const requestId = ++productsRequestId.current;
    const params = {};
    if (categoryParam) params.category = categoryParam;
    if (subcategoryParam) params.subcategory = subcategoryParam;
    if (brandParam) params.brand = brandParam;
    if (genderParam) params.gender = genderParam;
    if (colorParam) params.color = colorParam;
    if (sizeParam) params.size = sizeParam;
    if (minPriceParam && minPriceParam !== 'Min') params.min_price = minPriceParam;
    if (maxPriceParam && maxPriceParam !== '3000+') params.max_price = maxPriceParam;
    if (ratingParam) params.rating = ratingParam;
    if (searchParam) params.search = searchParam;
    if (inStockParam) params.in_stock = 'true';
    if (saleParam) params.sale = 'true';

    const cacheKey = JSON.stringify(params);
    const cachedProducts = productResultsCache.get(cacheKey);
    if (cachedProducts) {
      setProducts(cachedProducts);
      setLoading(false);
    } else {
      setProducts([]);
      setLoading(true);
    }

    API.get('/products/', { params })
      .then((res) => {
        if (requestId !== productsRequestId.current) return;
        const nextProducts = Array.isArray(res.data) ? res.data : (res.data.results || []);
        productResultsCache.set(cacheKey, nextProducts);
        setProducts(nextProducts);
      })
      .catch((error) => {
        if (error.name === 'CanceledError' || error.code === 'ERR_CANCELED') return;
        if (requestId === productsRequestId.current && !cachedProducts) setProducts([]);
      })
      .finally(() => {
        if (requestId === productsRequestId.current) setLoading(false);
      });

  }, [categoryParam, subcategoryParam, brandParam, genderParam, colorParam, sizeParam, minPriceParam, maxPriceParam, ratingParam, inStockParam, saleParam, searchParam]);

  const toggleCheckboxParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    const currentValues = next.get(key) ? next.get(key).split(',') : [];
    
    let updated;
    if (currentValues.includes(value)) {
      updated = currentValues.filter((v) => v !== value);
    } else {
      updated = [...currentValues, value];
    }

    if (updated.length > 0) {
      next.set(key, updated.join(','));
    } else {
      next.delete(key);
    }
    setSearchParams(next);
  };

  const handlePriceChange = (type, val) => {
    const next = new URLSearchParams(searchParams);
    if (type === 'min') {
      if (val === 'Min') next.delete('min_price');
      else next.set('min_price', val);
    } else {
      if (val === '3000+') next.delete('max_price');
      else next.set('max_price', val);
    }
    setSearchParams(next);
  };

  const clearAllFilters = () => setSearchParams({});

  const selectReplacement = async (product) => {
    await addToCart(product, 1, product.available_sizes?.split(',')[0]?.trim() || null);
    navigate(`/cart${window.location.search}`);
  };

  const prefetchDetails = (productId) => API.get(`/products/${productId}/`).catch(() => {});

  const activeCatObj = categories.find((c) => c.slug.toLowerCase() === categoryParam.toLowerCase());
  const activeSubObj = activeCatObj?.subcategories?.find((s) => s.slug.toLowerCase() === subcategoryParam.toLowerCase());

  return (
    <div className="min-h-screen bg-gray-100 font-sans pb-16 text-black">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
          
          {/* FLIPKART FILTER SIDEBAR */}
          <aside className="lg:col-span-3 bg-white border border-gray-200 shadow-xs text-xs">
            
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <span className="font-extrabold text-base text-gray-900 tracking-tight">Filters</span>
              {(categoryParam || subcategoryParam || brandParam || genderParam || colorParam || sizeParam || minPriceParam !== 'Min' || maxPriceParam !== '3000+') && (
                <button
                  onClick={clearAllFilters}
                  className="text-volt-700 font-bold uppercase text-[11px] hover:underline cursor-pointer"
                >
                  Clear All
                </button>
              )}
            </div>

            {/* BREADCRUMB CATEGORIES TREE */}
            <div className="p-4 border-b border-gray-200 space-y-2">
              <span className="text-[11px] font-black uppercase text-gray-600 tracking-wider block">
                CATEGORIES
              </span>

              <div className="space-y-1 text-gray-500 font-medium">
                {categoryParam ? (
                  <button
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.delete('category');
                      next.delete('subcategory');
                      setSearchParams(next);
                    }}
                    className="flex items-center gap-1.5 text-gray-500 hover:text-black"
                  >
                    <FaChevronLeft size={9} /> <span className="capitalize">All Sports</span>
                  </button>
                ) : (
                  <div className="space-y-1.5 pt-1">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.set('category', cat.slug);
                          next.delete('subcategory');
                          setSearchParams(next);
                        }}
                        className="block w-full text-left font-bold text-gray-700 hover:text-black"
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                )}

                {categoryParam && (
                  <div className="pl-3 space-y-1">
                    {subcategoryParam ? (
                      <button
                        onClick={() => {
                          const next = new URLSearchParams(searchParams);
                          next.delete('subcategory');
                          setSearchParams(next);
                        }}
                        className="flex items-center gap-1.5 text-gray-500 hover:text-black font-medium"
                      >
                        <FaChevronLeft size={9} /> <span>{activeCatObj?.name || categoryParam}</span>
                      </button>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <span className="font-black text-black block">{activeCatObj?.name || categoryParam}</span>
                        <div className="pl-2 space-y-1 pt-0.5">
                          {activeCatObj?.subcategories?.map((sub) => (
                            <button
                              key={sub.id}
                              onClick={() => {
                                const next = new URLSearchParams(searchParams);
                                next.set('subcategory', sub.slug);
                                setSearchParams(next);
                              }}
                              className="block w-full text-left text-gray-600 hover:text-black text-[11px]"
                            >
                              {sub.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {subcategoryParam && (
                      <div className="pl-3 pt-1">
                        <span className="font-extrabold text-black text-xs block">
                          {activeSubObj?.name || subcategoryParam.replace(/-/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* PRICE ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('price')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>PRICE</span>
                {openSections.price ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.price && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="h-1 bg-blue-600 rounded-full w-full"></div>

                  <div className="flex items-center justify-between gap-2 text-xs">
                    <select
                      value={minPriceParam}
                      onChange={(e) => handlePriceChange('min', e.target.value)}
                      className="border border-gray-300 rounded p-1.5 bg-white text-gray-700 w-full focus:outline-none"
                    >
                      <option value="Min">Min</option>
                      <option value="499">₹499</option>
                      <option value="999">₹999</option>
                      <option value="1499">₹1499</option>
                    </select>

                    <span className="text-gray-400 font-medium">to</span>

                    <select
                      value={maxPriceParam}
                      onChange={(e) => handlePriceChange('max', e.target.value)}
                      className="border border-gray-300 rounded p-1.5 bg-white text-gray-700 w-full focus:outline-none"
                    >
                      <option value="999">₹999</option>
                      <option value="1999">₹1999</option>
                      <option value="2999">₹2999</option>
                      <option value="3000+">₹3000+</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* BRAND ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('brand')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>BRAND</span>
                {openSections.brand ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.brand && (
                <div className="px-4 pb-4 space-y-2 max-h-48 overflow-y-auto">
                  {brandList.map((brand) => {
                    const isChecked = brandParam.split(',').includes(brand);
                    return (
                      <label key={brand} className="flex items-center gap-2.5 cursor-pointer text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckboxParam('brand', brand)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs uppercase">{brand}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* GENDER ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('gender')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>GENDER</span>
                {openSections.gender ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.gender && (
                <div className="px-4 pb-4 space-y-2">
                  {genderList.map((gen) => {
                    const isChecked = genderParam.split(',').includes(gen);
                    return (
                      <label key={gen} className="flex items-center gap-2.5 cursor-pointer text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckboxParam('gender', gen)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs">{gen}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* COLOR ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('color')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>COLOR</span>
                {openSections.color ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.color && (
                <div className="px-4 pb-4 space-y-2">
                  {colorList.map((col) => {
                    const isChecked = colorParam.split(',').includes(col);
                    return (
                      <label key={col} className="flex items-center gap-2.5 cursor-pointer text-gray-700 font-medium">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCheckboxParam('color', col)}
                          className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-0"
                        />
                        <span className="text-xs">{col}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SIZE ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('size')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>SIZE</span>
                {openSections.size ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.size && (
                <div className="px-4 pb-4 grid grid-cols-3 gap-2">
                  {sizeList.map((sz) => {
                    const isSelected = sizeParam.split(',').includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => toggleCheckboxParam('size', sz)}
                        className={`py-1.5 px-2 text-center rounded border font-bold text-[11px] ${
                          isSelected ? 'bg-black text-volt-400 border-black' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RATING ACCORDION */}
            <div className="border-b border-gray-200">
              <button
                onClick={() => toggleSection('rating')}
                className="w-full p-4 flex items-center justify-between font-black uppercase text-xs text-gray-800 hover:bg-gray-50"
              >
                <span>CUSTOMER RATINGS</span>
                {openSections.rating ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>

              {openSections.rating && (
                <div className="px-4 pb-4 space-y-2">
                  {[4, 3, 2].map((star) => (
                    <label key={star} className="flex items-center gap-2 cursor-pointer text-gray-700">
                      <input
                        type="radio"
                        name="rating_filter"
                        checked={ratingParam === String(star)}
                        onChange={() => {
                          const next = new URLSearchParams(searchParams);
                          if (ratingParam === String(star)) next.delete('rating');
                          else next.set('rating', String(star));
                          setSearchParams(next);
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="flex items-center gap-1 font-bold text-xs">
                        {star}★ & above
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* ASSURED BADGE */}
            <div className="p-4 border-b border-gray-200">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-xs">
                <input
                  type="checkbox"
                  checked={inStockParam}
                  onChange={(e) => {
                    const next = new URLSearchParams(searchParams);
                    if (e.target.checked) next.set('in_stock', 'true');
                    else next.delete('in_stock');
                    setSearchParams(next);
                  }}
                  className="w-4 h-4 rounded text-blue-600"
                />
                <span className="flex items-center gap-1 text-black font-black uppercase italic">
                  <FaShieldAlt className="text-volt-600" /> HRAZM Assured
                </span>
              </label>
            </div>

          </aside>

          {/* PRODUCT LISTING MAIN GRID */}
          <main className="lg:col-span-9 space-y-3">
            <div className="bg-white p-3.5 border border-gray-200 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700">
                Showing <strong className="text-black">{products.length}</strong> items
              </span>

              <div className="flex flex-wrap gap-1.5 text-[11px]">
                {categoryParam && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    {categoryParam}
                    <FaTimes
                      className="cursor-pointer text-gray-400 hover:text-black"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('category');
                        next.delete('subcategory');
                        setSearchParams(next);
                      }}
                    />
                  </span>
                )}
                {subcategoryParam && (
                  <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded flex items-center gap-1 font-bold">
                    {subcategoryParam}
                    <FaTimes
                      className="cursor-pointer text-gray-400 hover:text-black"
                      onClick={() => {
                        const next = new URLSearchParams(searchParams);
                        next.delete('subcategory');
                        setSearchParams(next);
                      }}
                    />
                  </span>
                )}
              </div>
            </div>

            {loading ? (
              <Loading message="Fetching products..." />
            ) : products.length === 0 ? (
              <div className="bg-white border border-gray-200 p-12 text-center space-y-3">
                <span className="text-2xl font-black text-gray-400">No Products Found</span>
                <p className="text-xs text-gray-500">Try clearing active filters or price limits.</p>
                <button
                  onClick={clearAllFilters}
                  className="bg-volt-500 text-black px-4 py-2 rounded-xl text-xs font-black uppercase"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-gray-200 p-3 flex flex-col justify-between hover:shadow-lg transition-all group"
                  >
                    <Link
                      to={replacementOrderId ? '#' : `/product/${p.id}`}
                      onMouseEnter={() => prefetchDetails(p.id)}
                      onClick={replacementOrderId ? (e) => { e.preventDefault(); selectReplacement(p); } : undefined}
                      className="block relative aspect-square bg-gray-50 p-2 overflow-hidden"
                    >
                      <img
                        src={p.display_image || p.image_url}
                        alt=""
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                      />
                    </Link>

                    <div className="pt-2 space-y-1">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {p.brand} • {p.gender}
                      </div>

                      <Link
                        to={replacementOrderId ? '#' : `/product/${p.id}`}
                        onMouseEnter={() => prefetchDetails(p.id)}
                        onClick={replacementOrderId ? (e) => { e.preventDefault(); selectReplacement(p); } : undefined}
                        className="block text-xs font-bold text-gray-900 line-clamp-1 hover:text-blue-600"
                      >
                        {p.name}
                      </Link>

                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="bg-emerald-700 text-white text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          {p.rating || 4.5} <FaStar size={8} />
                        </span>
                        <span className="text-[10px] text-gray-400">({p.rating_count || 24})</span>
                      </div>

                      <div className="flex items-baseline gap-2 pt-1">
                        <span className="text-sm font-black text-black">
                          ₹{Number(p.discount_price || p.price).toLocaleString()}
                        </span>
                        {p.discount_price && (
                          <>
                            <span className="text-[11px] text-gray-400 line-through font-medium">
                              ₹{Number(p.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600">
                              {p.discount_percentage}% off
                            </span>
                          </>
                        )}
                      </div>

                      {p.available_sizes && (
                        <div className="text-[10px] text-gray-500 font-medium truncate pt-1">
                          Size: {p.available_sizes}
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => toggleWishlist(p)}
                        className={`mt-2 w-full rounded-xl border py-2 text-[10px] font-black uppercase transition-colors ${isWishlisted(p.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-gray-50 text-gray-500 hover:border-red-200 hover:text-red-500'}`}
                        title={isWishlisted(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                        aria-label={isWishlisted(p.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                      >
                        <FaHeart className="mr-1 inline" size={10} />
                        {isWishlisted(p.id) ? 'Saved' : 'Add to Wishlist'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

        </div>
      </div>
    </div>
  );
}