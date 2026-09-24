import { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import API from '../services/api';
import { CartContext } from '../context/CartContext';
import { AuthContext } from '../context/AuthContext';
import { WishlistContext } from '../context/WishlistContext';
import Loading from '../components/Loading';
import { 
  FaStar, FaHeart, FaShieldAlt, FaTruck, 
  FaMoneyBillWave, FaChevronDown, FaChevronUp,
  FaShoppingBag, FaFlag, FaCheck, FaTimes, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);
  const { isWishlisted, toggleWishlist } = useContext(WishlistContext);
  const { user } = useContext(AuthContext);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState(false);

  // Accordion Toggles for Product Information Section
  const [openSections, setOpenSections] = useState({
    measurements: true,
    materials: true,
    additional: true,
    itemDetails: false,
  });

  const toggleAccordion = (key) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  useEffect(() => {
    setLoading(true);
    API.get(`/products/${id}/`)
      .then((res) => {
        const data = res.data;
        setProduct(data);
        setCurrentImageIndex(0);
        setIsAdded(false);

        if (data.sizes_list?.length > 0) setSelectedSize(data.sizes_list[0]);

        let allColors = data.colors_list || [];
        if (data.color_map && Array.isArray(data.color_map)) {
          const mapColors = data.color_map.map(c => c.color).filter(Boolean);
          allColors = Array.from(new Set([...allColors, ...mapColors]));
        }
        if (allColors.length > 0) setSelectedColor(allColors[0]);

        setLoading(false);

        // Related products are non-blocking; the main product can render immediately.
        const catSlug = data.category_details?.slug || data.category || '';
        return API.get(`/products/?category=${catSlug}`)
          .then((relatedRes) => {
            const list = Array.isArray(relatedRes.data) ? relatedRes.data : (relatedRes.data.results || []);
            setRelatedProducts(list.filter((p) => String(p.id) !== String(id)));
          })
          .catch((err) => console.error('Related products failed:', err));
      })
      .catch((err) => console.error(err))
      .catch(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) return <Loading message="Loading product specifications..." />;
  if (!product) return <div className="p-12 text-center text-gray-500 font-bold">Product not found.</div>;

  const images = product.images_list?.length > 0 
    ? product.images_list 
    : [product.display_image || product.image_url];

  const colorMap = product.color_map || [];
  
  // "About this item" Points Parser
  const aboutPoints = product.about_points?.length > 0 
    ? product.about_points 
    : (product.about_item ? product.about_item.split('\n').map(s => s.trim()).filter(Boolean) : []);

  // Description Points Parser (Converts long strings with newlines or semicolons into clean bullet points)
  const parseDescriptionPoints = (desc) => {
    if (!desc) return [];
    if (desc.includes('\n')) {
      return desc.split('\n').map(s => s.trim()).filter(Boolean);
    }
    if (desc.includes(';')) {
      return desc.split(';').map(s => s.trim()).filter(Boolean);
    }
    // Agar single dense string ho toh period ya separator se split karein
    return desc.split('. ').map(s => s.trim()).filter(Boolean);
  };

  const descriptionPoints = parseDescriptionPoints(product.description);

  const whatsInBox = product.whats_in_box_list?.length > 0 
    ? product.whats_in_box_list 
    : (product.whats_in_the_box ? product.whats_in_the_box.split('\n').map(s => s.trim()).filter(Boolean) : ['1 x Item']);

  const handleColorSelect = (color) => {
    setSelectedColor(color);
    const matched = colorMap.find(
      (item) => item.color?.toLowerCase().trim() === color.toLowerCase().trim()
    );
    if (matched && matched.url) {
      const idx = images.findIndex((img) => img === matched.url);
      if (idx !== -1) setCurrentImageIndex(idx);
    }
  };

  const handleThumbnailHover = (img, index) => {
    setCurrentImageIndex(index);
    const matchingColor = colorMap.find((item) => item.url === img)?.color;
    if (matchingColor) setSelectedColor(matchingColor);
  };

  const handleImageChange = (index) => handleThumbnailHover(images[index], index);

  const handleAddToCart = () => {
    addToCart(product, 1, selectedSize, selectedColor);
    setIsAdded(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans bg-white space-y-12 text-gray-900">
      
      {/* Breadcrumbs */}
      <div className="text-xs text-gray-500 flex items-center gap-2">
        <Link to="/" className="hover:text-volt-600">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-volt-600 capitalize">{product.product_type || 'Products'}</Link>
        <span>/</span>
        <span className="text-gray-800 font-semibold truncate">{product.name}</span>
      </div>

      {/* ---------------- TOP SECTION ---------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT: STATIC IMAGE & THUMBNAILS (NO SLIDER) */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="w-full max-w-[460px] aspect-square bg-white border border-gray-100 flex items-center justify-center p-4 relative rounded-2xl shadow-xs">
            <button type="button" onClick={() => setIsImagePreviewOpen(true)} className="w-full h-full flex items-center justify-center cursor-zoom-in">
              <img 
                src={images[currentImageIndex]} 
                alt={product.name} 
                className="max-h-full max-w-full object-contain"
              />
            </button>
          </div>

          <span className="text-xs text-blue-600 hover:underline cursor-pointer mt-3 font-medium">
            Click to see full view
          </span>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto mt-3 pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  onMouseEnter={() => handleThumbnailHover(img, idx)}
                  className={`w-14 h-14 rounded-xl border-2 p-1 bg-white overflow-hidden transition-all cursor-pointer ${
                    currentImageIndex === idx ? 'border-teal-600 shadow-sm scale-105' : 'border-gray-200 hover:border-gray-400 opacity-80'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT: DETAILS & SPECS */}
        <div className="lg:col-span-6 space-y-4">
          
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
              <div className="flex text-amber-500">
                {[...Array(5)].map((_, i) => (
                  <FaStar key={i} size={11} className={i < Math.floor(product.rating || 4.5) ? 'text-amber-500' : 'text-gray-300'} />
                ))}
              </div>
              <span className="font-semibold text-gray-700">{product.rating || 4.5}</span>
              <span className="text-blue-600 hover:underline cursor-pointer">({product.rating_count || 25} reviews)</span>
            </div>
          </div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2.5 border-b border-gray-100 pb-3">
            <span className="text-2xl sm:text-3xl font-medium text-gray-900">
              ₹{Number(product.discount_price || product.price).toLocaleString()}
            </span>
            {product.discount_price && (
              <>
                <span className="text-xs text-gray-400 line-through">
                  MRP ₹{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                  {product.discount_percentage}% OFF
                </span>
              </>
            )}
          </div>

          {/* ⚡ COMPACT CLEAN COLOR SWATCH BOXES */}
          {colorMap.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="text-xs font-bold text-gray-700 block">
                Colour: <strong className="text-black uppercase">{selectedColor}</strong>
              </span>

              <div className="flex gap-2 flex-wrap">
                {colorMap.map((c, idx) => {
                  const isSelected = selectedColor?.toLowerCase().trim() === c.color?.toLowerCase().trim();
                  return (
                    <button
                      key={idx}
                      onClick={() => handleColorSelect(c.color)}
                      className={`h-14 px-2.5 rounded-xl border flex items-center gap-2 transition-all cursor-pointer bg-white ${
                        isSelected 
                          ? 'border-teal-600 ring-2 ring-teal-600/30 bg-teal-50/20 shadow-xs' 
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                      title={c.color}
                    >
                      <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center p-0.5 shrink-0 border border-gray-100">
                        <img src={c.url} alt={c.color} className="w-full h-full object-contain" />
                      </div>
                      <div className="text-left leading-none">
                        <div className="text-[11px] font-bold text-gray-900 capitalize">{c.color}</div>
                        <div className="text-[10px] text-gray-500 font-medium mt-1">₹{Number(product.discount_price || product.price).toLocaleString()}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Specifications Table */}
          <div className="border-t border-b border-gray-100 py-3">
            <div className="grid grid-cols-2 gap-y-2 text-xs">
              <span className="font-bold text-gray-900">Brand</span>
              <span className="text-gray-700">{product.brand || 'Generic'}</span>

              <span className="font-bold text-gray-900">Material</span>
              <span className="text-gray-700">{product.material || 'Cotton / Leather'}</span>

              <span className="font-bold text-gray-900">Colour</span>
              <span className="text-gray-700">{selectedColor || product.available_colors || 'Standard'}</span>

              <span className="font-bold text-gray-900">Age Range (Description)</span>
              <span className="text-gray-700">{product.age_range || 'Adult'}</span>

              <span className="font-bold text-gray-900">Item Weight</span>
              <span className="text-gray-700">{product.item_weight || '100gm'}</span>
            </div>
          </div>

          {/* "About this item" Bullet Points */}
          <div className="space-y-2 pt-1">
            <h3 className="text-sm font-bold text-gray-900">About this item</h3>
            
            <ul className="space-y-2 text-xs text-gray-700 list-disc pl-4 leading-relaxed">
              {aboutPoints.map((point, index) => {
                const parts = point.split(':');
                if (parts.length > 1) {
                  return (
                    <li key={index}>
                      <strong className="font-semibold text-gray-900">{parts[0]}:</strong>
                      <span>{parts.slice(1).join(':')}</span>
                    </li>
                  );
                }
                return <li key={index}>{point}</li>;
              })}
            </ul>

            <div className="pt-2 text-xs space-y-1">
              <a href="#product-information" className="text-blue-600 hover:underline block font-medium">
                › See more product details
              </a>
              <div className="flex items-center gap-1 text-gray-500 hover:text-black cursor-pointer pt-1 text-[11px]">
                <FaFlag size={10} /> <span>Report an issue with this product</span>
              </div>
            </div>
          </div>

          {/* Add to Cart Actions */}
          <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
            {isAdded ? (
              <button
                onClick={() => navigate('/cart')}
                className="flex-1 bg-black hover:bg-gray-900 text-volt-400 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                Go to Bag →
              </button>
            ) : (
              <button
                onClick={handleAddToCart}
                className="flex-1 bg-volt-500 hover:bg-volt-400 text-black py-3.5 rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
              >
                ADD TO CART ⚡
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-colors ${isWishlisted(product.id) ? 'border-red-200 bg-red-50 text-red-500' : 'border-gray-200 bg-white text-gray-400 hover:border-red-200 hover:text-red-500'}`}
              title={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              aria-label={isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <FaHeart size={17} />
            </button>
          </div>

        </div>
      </div>

      {isImagePreviewOpen && (
        <div
          className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsImagePreviewOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} image preview`}
        >
          <div className="relative max-w-5xl max-h-[90vh] w-full h-full flex items-center justify-center">
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                setIsImagePreviewOpen(false);
              }}
              className="absolute top-2 right-2 z-10 w-10 h-10 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg cursor-pointer"
              aria-label="Close image preview"
            >
              <FaTimes size={16} />
            </button>
            {images.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleImageChange((currentImageIndex - 1 + images.length) % images.length);
                }}
                className="absolute left-2 sm:left-8 z-10 w-11 h-11 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg cursor-pointer"
                aria-label="Previous product image"
              >
                <FaChevronLeft size={16} />
              </button>
            )}
            <img src={images[currentImageIndex]} alt={product.name} className="max-h-[78vh] max-w-[85%] object-contain rounded-2xl shadow-2xl" />
            {images.length > 1 && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  handleImageChange((currentImageIndex + 1) % images.length);
                }}
                className="absolute right-2 sm:right-8 z-10 w-11 h-11 rounded-full bg-white/90 text-gray-900 flex items-center justify-center shadow-lg cursor-pointer"
                aria-label="Next product image"
              >
                <FaChevronRight size={16} />
              </button>
            )}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2 max-w-[85%] overflow-x-auto p-2 rounded-xl bg-black/40" onClick={(event) => event.stopPropagation()}>
                {images.map((image, index) => (
                  <button
                    key={image + index}
                    type="button"
                    onClick={() => handleImageChange(index)}
                    className={`w-12 h-12 rounded-lg border-2 bg-white p-0.5 shrink-0 ${currentImageIndex === index ? 'border-volt-500' : 'border-white/50'}`}
                    aria-label={`View product image ${index + 1}`}
                  >
                    <img src={image} alt="" className="w-full h-full object-contain rounded-md" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ---------------- BOTTOM SECTIONS ---------------- */}
      <div className="border-t border-gray-200 pt-8 space-y-8" id="product-information">
        
        {/* ⚡ 1. PRODUCT DESCRIPTION RENDERED IN CLEAN BULLET POINTS */}
        <div className="space-y-3">
          <h2 className="text-base font-bold text-gray-900">Product description</h2>
          
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 sm:p-5">
            {descriptionPoints.length > 0 ? (
              <ul className="space-y-2 text-xs text-gray-700 list-disc pl-4 leading-relaxed">
                {descriptionPoints.map((line, idx) => (
                  <li key={idx}>
                    {line.includes(':') ? (
                      <>
                        <strong className="font-semibold text-gray-900">{line.split(':')[0]}:</strong>
                        <span>{line.split(':').slice(1).join(':')}</span>
                      </>
                    ) : (
                      line
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-500">Standard manufacturer product details.</p>
            )}
          </div>
        </div>

        {/* 2. Product Information Accordions */}
        <div className="space-y-4">
          <h2 className="text-base font-bold text-gray-900">Product information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Left: Item Details */}
            <div className="border border-gray-200 rounded-xl overflow-hidden self-start">
              <button
                onClick={() => toggleAccordion('itemDetails')}
                className="w-full p-3.5 bg-gray-50 flex items-center justify-between font-bold text-xs text-gray-800 hover:bg-gray-100"
              >
                <span>Item details</span>
                {openSections.itemDetails ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
              </button>
              {openSections.itemDetails && (
                <div className="p-4 space-y-2 text-xs text-gray-600 border-t border-gray-200">
                  <div>Brand: {product.brand || 'Generic'}</div>
                  <div>Category: {product.category_details?.name || 'Sports'}</div>
                </div>
              )}
            </div>

            {/* Right: Measurements, Materials, Additional */}
            <div className="space-y-3">
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion('measurements')}
                  className="w-full p-3.5 bg-gray-50 flex items-center justify-between font-bold text-xs text-gray-800 hover:bg-gray-100"
                >
                  <span>Measurements</span>
                  {openSections.measurements ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {openSections.measurements && (
                  <div className="p-3.5 divide-y divide-gray-100 text-xs text-gray-700">
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Item Weight</span>
                      <span>{product.item_weight || '100gm'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Size</span>
                      <span>{product.dimensions || 'Standard'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion('materials')}
                  className="w-full p-3.5 bg-gray-50 flex items-center justify-between font-bold text-xs text-gray-800 hover:bg-gray-100"
                >
                  <span>Materials & Care</span>
                  {openSections.materials ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {openSections.materials && (
                  <div className="p-3.5 divide-y divide-gray-100 text-xs text-gray-700">
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Material Type</span>
                      <span>{product.material || 'Cotton / Polyester'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Construction Type</span>
                      <span>{product.construction_type || 'Machine / Hand crafted'}</span>
                    </div>
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Stitching Type</span>
                      <span>{product.stitching_type || 'Standard Reinforced'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleAccordion('additional')}
                  className="w-full p-3.5 bg-gray-50 flex items-center justify-between font-bold text-xs text-gray-800 hover:bg-gray-100"
                >
                  <span>Additional details</span>
                  {openSections.additional ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
                </button>
                {openSections.additional && (
                  <div className="p-3.5 divide-y divide-gray-100 text-xs text-gray-700">
                    <div className="py-2 flex justify-between">
                      <span className="font-semibold text-gray-900">Colour</span>
                      <span>{selectedColor || product.available_colors || 'Standard'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* 3. What is in the box? */}
        <div className="space-y-2 border-t border-gray-200 pt-6">
          <h2 className="text-base font-bold text-gray-900">What is in the box?</h2>
          <ul className="list-disc pl-5 text-xs text-gray-700 space-y-1">
            {whatsInBox.map((boxItem, idx) => (
              <li key={idx}>{boxItem}</li>
            ))}
          </ul>
        </div>

      </div>

      {/* ⚡ ---------------- RELATED PRODUCTS SECTION RESTORED ---------------- */}
      {relatedProducts.length > 0 && (
        <div className="border-t border-gray-200 pt-10 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-volt-600">Similar Picks</span>
              <h2 className="text-xl sm:text-2xl font-black italic uppercase text-black">Related Sports Gear</h2>
            </div>
            <Link to="/products" className="text-xs font-bold text-volt-700 hover:underline">
              View All Products →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {relatedProducts.slice(0, 5).map((item) => (
              <div 
                key={item.id} 
                className="bg-white border border-gray-200 rounded-2xl p-3 flex flex-col justify-between hover:shadow-md transition-all group"
              >
                <Link to={`/product/${item.id}`} className="block aspect-square bg-gray-50 rounded-xl overflow-hidden p-2 relative">
                  <img
                    src={item.display_image || item.image_url}
                    alt={item.name}
                    className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                  />
                  {item.discount_percentage > 0 && (
                    <span className="absolute top-1.5 left-1.5 bg-red-600 text-white text-[8px] font-black uppercase px-1.5 py-0.5 rounded">
                      {item.discount_percentage}% OFF
                    </span>
                  )}
                </Link>

                <div className="pt-2.5 space-y-1 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider block">
                      {item.brand || 'HRAZM'}
                    </span>
                    <Link to={`/product/${item.id}`} className="block text-xs font-black text-gray-900 line-clamp-1 hover:text-volt-700 mt-0.5">
                      {item.name}
                    </Link>
                  </div>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-sm font-black text-black">
                      ₹{Number(item.discount_price || item.price).toLocaleString()}
                    </span>
                    {item.discount_price && (
                      <span className="text-[10px] text-gray-400 line-through">
                        ₹{Number(item.price).toLocaleString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-1.5">
                    <Link
                      to={`/product/${item.id}`}
                      className="w-full bg-gray-100 hover:bg-volt-500 hover:text-black text-gray-800 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-colors"
                    >
                      <FaShoppingBag size={9} /> View Gear
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}