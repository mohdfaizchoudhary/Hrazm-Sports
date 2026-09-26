import { useState, useEffect } from 'react';
import API from '../services/api';
import Loading from '../components/Loading';
import { useFeedback } from '../components/FeedbackProvider';
import { 
  FaPlus, FaTrash, FaEdit, FaBox, FaRupeeSign, FaBan, 
  FaSearch, FaSyncAlt, FaClipboardList, FaTimes, FaImages,
  FaCheck, FaArrowRight, FaArrowLeft, FaInfoCircle, FaSlidersH, FaUpload,
  FaUsers, FaUndoAlt, FaExchangeAlt, FaClock, FaCheckCircle, FaTruck
} from 'react-icons/fa';

const MASTER_COLOR_PALETTE = [
  'Black', 'White', 'Red', 'Navy Blue', 'Royal Blue', 'Sky Blue', 
  'Green', 'Olive Green', 'Neon Green', 'Volt Yellow', 'Yellow', 
  'Orange', 'Grey', 'Dark Grey', 'Silver', 'Brown', 'Maroon', 
  'Purple', 'Pink', 'Gold', 'Natural Wood', 'Beige', 'Multicolor'
];

export default function AdminProducts() {
  const { notify, confirm, prompt: askForNote } = useFeedback();
  // 4 Tabs: 'products' | 'orders' | 'customers' | 'returns'
  const [activeTab, setActiveTab] = useState('orders');
  const [orderFilter, setOrderFilter] = useState('ALL');
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [returnOrders, setReturnOrders] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Product Add/Edit Modal
  const [currentStep, setCurrentStep] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Status & Delete Modal
  const [statusDialog, setStatusDialog] = useState(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category_id: '',
    subcategory_id: '',
    gender: 'Unisex',
    product_type: 'equipment',
    price: '',
    discount_price: '',
    stock: '10',
    brand: 'Generic',
    available_sizes: '',
    available_colors: 'White,Red',
    material: 'Leather',
    age_range: 'Adult',
    item_weight: '399 Grams',
    dimensions: '7.2 cm',
    construction_type: 'Hand-stitched',
    stitching_type: 'Hand-stitched',
    about_item: 'Crafted for Performance: Designed for optimal performance on the pitch.\nDurable Construction: Made from high-quality materials.',
    description: '',
    whats_in_the_box: '1 x Item',
    image_main: '',
    image_main_color: 'White',
    image_2: '',
    image_2_color: 'Red',
    image_3: '',
    image_3_color: '',
    image_4: '',
    image_4_color: '',
    image_5: '',
    image_5_color: '',
    is_featured: false,
  });

  // ⚡ ALL 5 ENDPOINTS FETCH (Products, Categories, Orders, Customers, Returns)
  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);

    try {
      const [prodRes, catRes, orderRes, custRes, returnRes] = await Promise.all([
        API.get('/products/').catch(() => null),
        API.get('/categories/').catch(() => null),
        API.get('/orders/admin/all/').catch(() => null),
        API.get('/orders/admin/customers/').catch((err) => {
          console.error("Customers API Error:", err.response?.data || err.message);
          return null;
        }),
        API.get('/orders/admin/returns/').catch((err) => {
          console.error("Returns API Error:", err.response?.data || err.message);
          return null;
        })
      ]);

      if (prodRes && prodRes.data) {
        setProducts(prodRes.data?.results || (Array.isArray(prodRes.data) ? prodRes.data : []));
      }
      if (catRes && catRes.data) {
        setCategories(catRes.data?.results || (Array.isArray(catRes.data) ? catRes.data : []));
      }
      if (orderRes && orderRes.data) {
        setOrders(orderRes.data?.results || (Array.isArray(orderRes.data) ? orderRes.data : []));
      }
      if (custRes && custRes.data) {
        setCustomers(Array.isArray(custRes.data) ? custRes.data : (custRes.data?.results || []));
      }
      if (returnRes && returnRes.data) {
        setReturnOrders(Array.isArray(returnRes.data) ? returnRes.data : (returnRes.data?.results || []));
      }
    } catch (err) {
      console.error('Data Fetch Error:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeCategoryObj = categories.find((c) => String(c.id) === String(formData.category_id));
  const currentSubcategories = activeCategoryObj?.subcategories || [];
  const isApparelOrFootwear = formData.product_type === 'clothing' || formData.product_type === 'shoes';

  const inputColors = formData.available_colors.split(',').map((c) => c.trim()).filter(Boolean);
  const mergedColorOptions = Array.from(new Set([...inputColors, ...MASTER_COLOR_PALETTE]));

  const handleFileUpload = (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify('File size exceeds 5MB limit.', { type: 'error', title: 'Image too large' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = (img.width > MAX_WIDTH) ? MAX_WIDTH : img.width;
        canvas.height = (img.width > MAX_WIDTH) ? (img.height * scaleSize) : img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setFormData((prev) => ({ ...prev, [fieldName]: compressedBase64 }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!formData.name.trim()) { notify('Please enter product title.', { type: 'warning', title: 'Product details required' }); return false; }
      if (!formData.category_id) { notify('Please select a category.', { type: 'warning', title: 'Product details required' }); return false; }
    }
    if (step === 2) {
      if (!formData.price || parseFloat(formData.price) <= 0) { notify('Please enter valid price.', { type: 'warning', title: 'Pricing required' }); return false; }
      if (formData.stock === '' || parseInt(formData.stock, 10) < 0) { notify('Please enter stock amount.', { type: 'warning', title: 'Inventory required' }); return false; }
    }
    if (step === 3) {
      if (!formData.available_colors.trim()) { notify('Please specify at least 1 color.', { type: 'warning', title: 'Product details required' }); return false; }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) setCurrentStep((prev) => Math.min(prev + 1, 4));
  };
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.image_main.trim() || !formData.image_2.trim()) {
      notify('At least 2 product images are required.', { type: 'warning', title: 'Product images required' });
      return;
    }

    const extraImages = [formData.image_2.trim(), formData.image_3.trim(), formData.image_4.trim(), formData.image_5.trim()].filter(Boolean);
    const colorMap = [];
    if (formData.image_main && formData.image_main_color) colorMap.push({ color: formData.image_main_color, url: formData.image_main });
    if (formData.image_2 && formData.image_2_color) colorMap.push({ color: formData.image_2_color, url: formData.image_2 });
    if (formData.image_3 && formData.image_3_color) colorMap.push({ color: formData.image_3_color, url: formData.image_3 });
    if (formData.image_4 && formData.image_4_color) colorMap.push({ color: formData.image_4_color, url: formData.image_4 });
    if (formData.image_5 && formData.image_5_color) colorMap.push({ color: formData.image_5_color, url: formData.image_5 });

    const payload = {
      name: formData.name.trim(),
      category: parseInt(formData.category_id, 10),
      subcategory: formData.subcategory_id ? parseInt(formData.subcategory_id, 10) : null,
      gender: isApparelOrFootwear ? formData.gender : 'Unisex',
      product_type: formData.product_type,
      price: parseFloat(formData.price),
      discount_price: formData.discount_price ? parseFloat(formData.discount_price) : null,
      stock: parseInt(formData.stock, 10) || 0,
      brand: formData.brand.trim() || 'Generic',
      available_sizes: isApparelOrFootwear ? formData.available_sizes.trim() : '',
      available_colors: formData.available_colors.trim(),
      material: formData.material.trim(),
      age_range: formData.age_range.trim(),
      item_weight: formData.item_weight.trim(),
      dimensions: formData.dimensions.trim(),
      construction_type: formData.construction_type.trim(),
      stitching_type: formData.stitching_type.trim(),
      about_item: formData.about_item.trim(),
      description: formData.description.trim(),
      whats_in_the_box: formData.whats_in_the_box.trim(),
      image_url: formData.image_main.trim(),
      gallery_images: extraImages.join(','),
      color_images: JSON.stringify(colorMap),
      is_featured: Boolean(formData.is_featured),
    };

    try {
      if (editingProduct) {
        await API.put(`/products/${editingProduct.id}/`, payload);
      } else {
        await API.post('/products/', payload);
      }
      setShowModal(false);
      setEditingProduct(null);
      setCurrentStep(1);
      await loadData(true);
    } catch (err) {
      notify(JSON.stringify(err.response?.data || 'Failed to save product.'), { type: 'error', title: 'Could not save product' });
    }
  };

  const handleDeleteProduct = async (id) => {
    if (await confirm('Delete this product from catalog?', { title: 'Delete product?', type: 'warning' })) {
      try {
        await API.delete(`/products/${id}/`);
        setProducts(products.filter((p) => p.id !== id));
      } catch {
        notify('Failed to delete product.', { type: 'error', title: 'Delete failed' });
      }
    }
  };

  const openEditModal = async (p) => {
    let product = p;
    try {
      const response = await API.get(`/products/${p.id}/`);
      product = response.data;
    } catch (err) {
      notify(err.response?.data?.detail || 'Could not load the complete product details.', { type: 'error', title: 'Product details unavailable' });
      return;
    }

    setEditingProduct(product);
    setCurrentStep(1);
    const catId = product.category?.id || product.category_id || product.category || (categories[0]?.id || '');
    const subId = product.subcategory?.id || product.subcategory_id || product.subcategory || '';
    const galleryArr = product.gallery_images ? product.gallery_images.split(',').map((u) => u.trim()) : [];

    let colorMap = [];
    try {
      colorMap = product.color_images ? JSON.parse(product.color_images) : [];
    } catch {
      colorMap = [];
    }

    setFormData({
      name: product.name || '',
      category_id: catId,
      subcategory_id: subId,
      gender: product.gender || 'Unisex',
      product_type: product.product_type || 'equipment',
      price: product.price || '',
      discount_price: product.discount_price || '',
      stock: product.stock !== undefined ? product.stock : 10,
      brand: product.brand || 'Generic',
      available_sizes: product.available_sizes || '',
      available_colors: product.available_colors || 'White,Red',
      material: product.material || 'Leather',
      age_range: product.age_range || 'Adult',
      item_weight: product.item_weight || '399 Grams',
      dimensions: product.dimensions || '7.2 cm',
      construction_type: product.construction_type || 'Hand-stitched',
      stitching_type: product.stitching_type || 'Hand-stitched',
      about_item: product.about_item || '',
      description: product.description || '',
      whats_in_the_box: product.whats_in_the_box || '1 x Sports Gear',
      image_main: product.display_image || product.image_url || '',
      image_main_color: colorMap[0]?.color || '',
      image_2: galleryArr[0] || '',
      image_2_color: colorMap[1]?.color || '',
      image_3: galleryArr[1] || '',
      image_3_color: colorMap[2]?.color || '',
      image_4: galleryArr[2] || '',
      image_4_color: colorMap[3]?.color || '',
      image_5: galleryArr[3] || '',
      image_5_color: colorMap[4]?.color || '',
      is_featured: product.is_featured || false,
    });
    setShowModal(true);
  };

  const openNewProductModal = () => {
    setEditingProduct(null);
    setCurrentStep(1);
    setFormData({
      name: '',
      category_id: categories[0]?.id || '',
      subcategory_id: '',
      gender: 'Unisex',
      product_type: 'equipment',
      price: '',
      discount_price: '',
      stock: '10',
      brand: 'Generic',
      available_sizes: '',
      available_colors: 'White,Red',
      material: 'Leather',
      age_range: 'Adult',
      item_weight: '399 Grams',
      dimensions: '7.2 cm',
      construction_type: 'Hand-stitched',
      stitching_type: 'Hand-stitched',
      about_item: 'Crafted for Performance: Designed for optimal performance.',
      description: '',
      whats_in_the_box: '1 x Item',
      image_main: '',
      image_main_color: 'White',
      image_2: '',
      image_2_color: 'Red',
      image_3: '',
      image_3_color: '',
      image_4: '',
      image_4_color: '',
      image_5: '',
      image_5_color: '',
      is_featured: false,
    });
    setShowModal(true);
  };

  // Order Status Modal Actions
  const handleOpenStatusDialog = (order, targetStatus) => {
    setStatusDialog({
      orderId: order.id,
      orderNumber: order.order_number,
      newStatus: targetStatus,
      newPaymentStatus: order.payment_status || 'Pending',
      reason: `Status marked as ${targetStatus} by Staff`,
      isReturnRequest: Boolean(order.return_status && order.return_status !== 'NONE'),
    });
  };

  const handleConfirmStatusUpdate = async (e) => {
    e.preventDefault();
    if (!statusDialog) return;

    try {
      await API.patch(`/orders/admin/${statusDialog.orderId}/update-status/`, { 
        order_status: statusDialog.newStatus,
        payment_status: statusDialog.newPaymentStatus,
        status_reason: statusDialog.reason 
      });

      const updatedOrder = (o) => (
        o.id === statusDialog.orderId
          ? { ...o, order_status: statusDialog.newStatus, payment_status: statusDialog.newPaymentStatus, status_reason: statusDialog.reason }
          : o
      );
      setOrders((prev) => prev.map(updatedOrder));
      setReturnOrders((prev) => prev.map(updatedOrder));
      setStatusDialog(null);
    } catch {
      notify('Failed to update status.', { type: 'error', title: 'Status update failed' });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmModal) return;
    setIsDeleting(true);

    try {
      await API.delete(`/orders/admin/${deleteConfirmModal.id}/delete/`);
      setOrders((prev) => prev.filter((o) => o.id !== deleteConfirmModal.id));
      setDeleteConfirmModal(null);
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to delete order.', { type: 'error', title: 'Delete failed' });
    } finally {
      setIsDeleting(false);
    }
  };

  // ⚡ Admin Return & Replace Action Handler
  const handleAdminReturnAction = async (orderId, action) => {
    const note = await askForNote(`Enter note for ${action.toLowerCase()} action:`) || '';
    try {
      const res = await API.patch(`/orders/admin/${orderId}/return-action/`, { action, note });
      setReturnOrders((prev) => prev.map((o) => (o.id === orderId ? res.data : o)));
      notify(`Return request ${action.toLowerCase()}ed successfully!`, { type: 'success', title: 'Request updated' });
    } catch (err) {
      notify(err.response?.data?.detail || 'Failed to update return status.', { type: 'error', title: 'Request update failed' });
    }
  };

  // Metrics
  const totalRevenue = orders
    .filter((o) => (o.order_status || '').toLowerCase() !== 'cancelled')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

  const pendingCount = orders.filter((o) => (o.order_status || '').toLowerCase() === 'pending').length;
  const cancelledCount = orders.filter((o) => (o.order_status || '').toLowerCase() === 'cancelled').length;

  // Filtered Lists
  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.trim().toLowerCase();
    const matchesSearch = !term || (
      (o.order_number && o.order_number.toLowerCase().includes(term)) ||
      (o.shipping_address && o.shipping_address.toLowerCase().includes(term)) ||
      (o.city && o.city.toLowerCase().includes(term)) ||
      (o.state && o.state.toLowerCase().includes(term)) ||
      (o.postal_code && o.postal_code.toLowerCase().includes(term)) ||
      (o.customer?.email && o.customer.email.toLowerCase().includes(term)) ||
      (o.customer?.full_name && o.customer.full_name.toLowerCase().includes(term)) ||
      (o.customer?.phone && o.customer.phone.toLowerCase().includes(term)) ||
      (o.items || []).some((item) => item.product_name?.toLowerCase().includes(term))
    );

    const status = (o.order_status || '').toLowerCase();
    if (orderFilter === 'PENDING') return matchesSearch && status === 'pending';
    if (orderFilter === 'CANCELLED') return matchesSearch && status === 'cancelled';
    return matchesSearch;
  });

  const filteredProducts = products.filter((p) => {
    const term = searchTerm.toLowerCase();
    return p.name.toLowerCase().includes(term);
  });

  const filteredCustomers = customers.filter((c) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || (
      (c.full_name && c.full_name.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.toLowerCase().includes(term))
    );
  });

  const filteredReturns = returnOrders.filter((ro) => {
    const term = searchTerm.trim().toLowerCase();
    return !term || (
      (ro.order_number && ro.order_number.toLowerCase().includes(term)) ||
      (ro.customer?.full_name && ro.customer.full_name.toLowerCase().includes(term)) ||
      (ro.customer?.email && ro.customer.email.toLowerCase().includes(term)) ||
      (ro.customer?.phone && ro.customer.phone.toLowerCase().includes(term)) ||
      (ro.return_reason && ro.return_reason.toLowerCase().includes(term)) ||
      (ro.shipping_address && ro.shipping_address.toLowerCase().includes(term)) ||
      (ro.city && ro.city.toLowerCase().includes(term)) ||
      (ro.state && ro.state.toLowerCase().includes(term)) ||
      (ro.postal_code && ro.postal_code.toLowerCase().includes(term)) ||
      (ro.items || []).some((item) => item.product_name?.toLowerCase().includes(term))
    );
  });

  if (loading) return <Loading message="Loading Staff Control Panel..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 font-sans">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black uppercase italic tracking-tight text-black">
              Hrazm Sports <span className="text-volt-500">Staff Portal</span>
            </h1>
            <button 
              onClick={() => loadData(true)} 
              className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs cursor-pointer" 
              title="Refresh Data"
            >
              <FaSyncAlt className={isRefreshing ? 'animate-spin text-volt-500' : ''} size={12} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Control catalog hierarchy, customer registry & order operations</p>
        </div>

        <button
          onClick={openNewProductModal}
          className="bg-volt-500 hover:bg-volt-400 text-black px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <FaPlus size={12} /> Upload Sports Product
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><FaRupeeSign size={20} /></div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Net Revenue</div>
            <div className="text-xl font-black text-black">Rs {totalRevenue.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><FaClipboardList size={20} /></div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Orders Placed</div>
            <div className="text-xl font-black text-black">{orders.length}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><FaUsers size={20} /></div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Registered Customers</div>
            <div className="text-xl font-black text-black">{customers.length}</div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 p-5 rounded-2xl flex items-center gap-4 shadow-xs">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><FaUndoAlt size={20} /></div>
          <div>
            <div className="text-xs text-amber-600 font-bold">Return / Replace</div>
            <div className="text-xl font-black text-amber-700">{returnOrders.length}</div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ⚡ 4 MAIN TABS NAVIGATION (CATALOG, ORDERS, CUSTOMERS, RETURNS) */}
      {/* ========================================================= */}
      <div className="flex border-b border-gray-200 overflow-x-auto">
        <button
          onClick={() => { setActiveTab('products'); setSearchTerm(''); }}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'products' ? 'border-volt-500 text-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          <FaBox size={14} />
          <span>Catalog ({products.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('orders'); setSearchTerm(''); }}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'orders' ? 'border-volt-500 text-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          <FaClipboardList size={14} />
          <span>Orders Management ({orders.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('customers'); setSearchTerm(''); }}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'customers' ? 'border-volt-500 text-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          <FaUsers size={14} />
          <span>Customers Registry ({customers.length})</span>
        </button>

        <button
          onClick={() => { setActiveTab('returns'); setSearchTerm(''); }}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'returns' ? 'border-volt-500 text-black' : 'border-transparent text-gray-400 hover:text-black'
          }`}
        >
          <FaUndoAlt size={14} />
          <span>Return/Replace Orders ({returnOrders.length})</span>
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: PRODUCTS / CATALOG */}
      {/* ========================================================= */}
      {activeTab === 'products' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px]">
                  <th className="p-3.5">Product Title</th>
                  <th className="p-3.5">Price</th>
                  <th className="p-3.5">Stock</th>
                  <th className="p-3.5">Brand Name</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img src={p.display_image || p.image_url} alt="" className="w-9 h-9 object-contain rounded-lg bg-gray-100 p-0.5" />
                      <div className="font-bold text-black line-clamp-1">{p.name}</div>
                    </td>
                    <td className="p-3.5 font-black text-black">Rs {Number(p.discount_price || p.price).toLocaleString()}</td>
                    <td className="p-3.5">{p.stock} Units</td>
                    <td className="p-3.5 font-bold text-gray-800">{p.brand || 'Generic'}</td>
                    <td className="p-3.5 text-right space-x-2">
                      <button onClick={() => openEditModal(p)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg cursor-pointer">
                        <FaEdit size={13} />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg cursor-pointer">
                        <FaTrash size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ORDERS MANAGEMENT */}
      {/* ========================================================= */}
      {activeTab === 'orders' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              <button 
                onClick={() => setOrderFilter('ALL')} 
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                  orderFilter === 'ALL' ? 'bg-black text-white' : 'bg-gray-100 text-gray-700'
                }`}
              >
                All Orders ({orders.length})
              </button>
              <button 
                onClick={() => setOrderFilter('PENDING')} 
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                  orderFilter === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-800'
                }`}
              >
                Pending ({pendingCount})
              </button>
              <button 
                onClick={() => setOrderFilter('CANCELLED')} 
                className={`text-xs px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap cursor-pointer ${
                  orderFilter === 'CANCELLED' ? 'bg-red-600 text-white' : 'bg-red-50 text-red-700'
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>

            <div className="relative w-full lg:w-64">
              <input
                type="text"
                placeholder="Search order number or address..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-volt-500"
              />
              <FaSearch className="absolute left-2.5 top-3 text-gray-400" size={11} />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px]">
                  <th className="p-3.5">Order ID</th>
                  <th className="p-3.5">Customer</th>
                  <th className="p-3.5">Products</th>
                  <th className="p-3.5">Delivery Address</th>
                  <th className="p-3.5">Payment</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-black">{o.order_number}</td>
                    <td className="p-3.5 min-w-[180px]">
                      <div><span className="block text-[10px] uppercase text-gray-400">Name</span><span className="font-bold text-black">{o.customer?.full_name || 'Customer'}</span></div>
                      <div className="mt-2"><span className="block text-[10px] uppercase text-gray-400">Email</span><span className="break-all">{o.customer?.email || 'Not provided'}</span></div>
                      <div className="mt-2"><span className="block text-[10px] uppercase text-gray-400">Phone</span><span>{o.customer?.phone || 'Not provided'}</span></div>
                    </td>
                    <td className="p-3.5 min-w-[220px]">
                      {o.items?.length ? o.items.map((item) => (
                        <div key={item.id} className="mb-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0">
                          <div><span className="block text-[10px] uppercase text-gray-400">Product</span><span className="font-bold text-black">{item.product_name}</span></div>
                          <div className="mt-1 grid grid-cols-2 gap-2">
                            <div><span className="block text-[10px] uppercase text-gray-400">Quantity</span>{item.quantity}</div>
                            <div><span className="block text-[10px] uppercase text-gray-400">Unit Price</span>₹{Number(item.price).toLocaleString()}</div>
                            <div><span className="block text-[10px] uppercase text-gray-400">Subtotal</span>₹{Number(item.subtotal).toLocaleString()}</div>
                          </div>
                        </div>
                      )) : <span>Not provided</span>}
                      <div className="mt-2 border-t border-gray-200 pt-2"><span className="block text-[10px] uppercase text-gray-400">Order Total</span><span className="font-black">₹{Number(o.total_amount || 0).toLocaleString()}</span></div>
                    </td>
                    <td className="p-3.5 min-w-[200px]">
                      <div><span className="block text-[10px] uppercase text-gray-400">Street Address</span>{o.shipping_address || 'Not provided'}</div>
                      <div className="mt-2"><span className="block text-[10px] uppercase text-gray-400">City</span>{o.city || 'Not provided'}</div>
                      <div className="mt-2"><span className="block text-[10px] uppercase text-gray-400">State</span>{o.state || 'Not provided'}</div>
                      <div className="mt-2"><span className="block text-[10px] uppercase text-gray-400">Postal Code</span>{o.postal_code || 'Not provided'}</div>
                    </td>
                    <td className="p-3.5">
                      <div><span className="block text-[10px] uppercase text-gray-400">Method</span>{o.payment_method}</div>
                      <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">Payment Status</span>{o.payment_status}</div>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-volt-50 text-volt-800">
                        {o.order_status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={o.order_status || 'Pending'}
                          onChange={(e) => handleOpenStatusDialog(o, e.target.value)}
                          className="bg-white border border-gray-300 rounded-xl px-2 py-1 text-xs font-bold cursor-pointer"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>

                        {(o.order_status || '').toLowerCase() === 'cancelled' && (
                          <button
                            onClick={() => setDeleteConfirmModal(o)}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer"
                            title="Delete Cancelled Order"
                          >
                            <FaTrash size={12} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: CUSTOMERS REGISTRY (WITH NAME, MOBILE, ORDERS) */}
      {/* ========================================================= */}
      {activeTab === 'customers' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-500">
              Total Registered Customers: <strong className="text-black">{filteredCustomers.length}</strong>
            </span>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search by name, email, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-volt-500"
              />
              <FaSearch className="absolute left-2.5 top-3 text-gray-400" size={11} />
            </div>
          </div>

          {filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs font-bold">
              No registered customers found in database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px]">
                    <th className="p-3.5">Customer Name</th>
                    <th className="p-3.5">Mobile Number</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Joined Date</th>
                    <th className="p-3.5">Total Orders</th>
                    <th className="p-3.5 text-right">Account Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-volt-100 text-volt-800 flex items-center justify-center font-bold text-xs uppercase">
                          {c.full_name?.charAt(0) || 'C'}
                        </div>
                        <div>
                          <div className="font-bold text-black">{c.full_name}</div>
                          <div className="text-[10px] text-gray-400">ID: #{c.id}</div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className="font-mono font-bold text-black bg-gray-50 border border-gray-200 px-2 py-1 rounded-lg">
                          {c.phone || 'Not Provided'}
                        </span>
                      </td>
                      <td className="p-3.5 text-gray-700 font-mono">{c.email}</td>
                      <td className="p-3.5 text-gray-500">{c.date_joined}</td>
                      <td className="p-3.5">
                        <span className="font-black text-black bg-gray-100 px-2 py-0.5 rounded-lg">
                          {c.total_orders} Orders
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: RETURN / REPLACE ORDERS (LIVE REPLACEMENT SYNC) */}
      {/* ========================================================= */}
      {activeTab === 'returns' && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs space-y-4 p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <span className="text-xs font-bold text-gray-500">
              Total Return/Replace Requests: <strong className="text-black">{filteredReturns.length}</strong>
            </span>
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search order #, customer or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-xs focus:outline-none focus:border-volt-500"
              />
              <FaSearch className="absolute left-2.5 top-3 text-gray-400" size={11} />
            </div>
          </div>

          {filteredReturns.length === 0 ? (
            <div className="p-12 text-center text-gray-400 text-xs font-bold">
              No return or replacement requests submitted yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 uppercase font-bold text-[10px]">
                    <th className="p-3.5">Order ID</th>
                    <th className="p-3.5">Customer</th>
                    <th className="p-3.5">Products</th>
                    <th className="p-3.5">Delivery Address</th>
                    <th className="p-3.5">Request Type</th>
                    <th className="p-3.5">Customer Reason / Selected Item</th>
                    <th className="p-3.5">Items in Order</th>
                    <th className="p-3.5">Approval Status</th>
                    <th className="p-3.5 text-right">Admin Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {filteredReturns.map((ro) => (
                    <tr key={ro.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-black">#{ro.order_number}</td>
                      <td className="p-3.5 min-w-[170px]">
                        <div><span className="block text-[10px] uppercase text-gray-400">Name</span><span className="font-bold text-black">{ro.customer?.full_name || 'Customer'}</span></div>
                        <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">Email</span><span className="break-all">{ro.customer?.email || 'Not provided'}</span></div>
                        <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">Phone</span>{ro.customer?.phone || 'Not provided'}</div>
                      </td>
                      <td className="p-3.5 min-w-[200px]">
                        {ro.items?.length ? ro.items.map((item) => (
                          <div key={item.id} className="mb-2 border-b border-gray-100 pb-2 last:mb-0 last:border-0 last:pb-0">
                            <div><span className="block text-[10px] uppercase text-gray-400">Product</span>{item.product_name}</div>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                              <div><span className="block text-[10px] uppercase text-gray-400">Quantity</span>{item.quantity}</div>
                              <div><span className="block text-[10px] uppercase text-gray-400">Unit Price</span>₹{Number(item.price).toLocaleString()}</div>
                            </div>
                          </div>
                        )) : <span>Not provided</span>}
                        {ro.original_product_name && ro.replacement_product_name && (
                          <div className="mt-2 border-t border-gray-100 pt-2 text-purple-700">
                            <span className="block text-[10px] uppercase">Replacement Item</span>
                            {ro.original_product_name} → {ro.replacement_product_name}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 min-w-[190px]">
                        <div><span className="block text-[10px] uppercase text-gray-400">Street Address</span>{ro.shipping_address || 'Not provided'}</div>
                        <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">City</span>{ro.city || 'Not provided'}</div>
                        <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">State</span>{ro.state || 'Not provided'}</div>
                        <div className="mt-1"><span className="block text-[10px] uppercase text-gray-400">Postal Code</span>{ro.postal_code || 'Not provided'}</div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase ${
                          ro.return_type === 'REFUND' ? 'bg-amber-100 text-amber-800' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {ro.return_type === 'REFUND' ? '💰 Return Money' : '🔄 Replace Product'}
                        </span>
                      </td>
                      <td className="p-3.5 max-w-xs text-gray-700">
                        <p className="line-clamp-2 italic">"{ro.return_reason}"</p>
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          {ro.items?.slice(0, 2).map((item) => (
                            <img
                              key={item.id}
                              src={item.product_image || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=60'}
                              alt=""
                              className="w-8 h-8 rounded-lg object-contain border bg-white p-0.5"
                              title={item.product_name}
                            />
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          ro.return_status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          ro.return_status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                          ro.return_status === 'COMPLETED' ? 'bg-gray-800 text-volt-400' : 'bg-amber-50 text-amber-800'
                        }`}>
                          {ro.return_status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        {ro.return_status === 'REQUESTED' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleAdminReturnAction(ro.id, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] uppercase cursor-pointer"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleAdminReturnAction(ro.id, 'REJECT')}
                              className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] uppercase cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}

                        {ro.return_status === 'APPROVED' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <select
                              value={ro.order_status || 'Confirmed'}
                              onChange={(e) => handleOpenStatusDialog(ro, e.target.value)}
                              className="bg-white border border-gray-300 rounded-lg px-2 py-1 text-[10px] font-bold cursor-pointer"
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Shipped">Shipped</option>
                              <option value="Delivered">Delivered</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button
                              onClick={() => handleAdminReturnAction(ro.id, 'COMPLETE')}
                              className="px-2.5 py-1 bg-black hover:bg-volt-500 hover:text-black text-volt-400 font-bold rounded-lg text-[10px] uppercase cursor-pointer"
                            >
                              Complete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4-STEP WIZARD PRODUCT UPLOAD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-gray-100 max-h-[94vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-black">
                  {editingProduct ? 'Update Sports Product' : 'Upload Sports Gear'}
                </h2>
                <p className="text-[11px] font-bold text-gray-400">Step {currentStep} of 4</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="p-2 text-gray-400 hover:text-black rounded-full hover:bg-gray-100 cursor-pointer"
              >
                <FaTimes size={16} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: 'Basic Info', icon: FaInfoCircle },
                { step: 2, label: 'Pricing', icon: FaRupeeSign },
                { step: 3, label: 'About & Specs', icon: FaSlidersH },
                { step: 4, label: 'Gallery', icon: FaImages },
              ].map((s) => {
                const Icon = s.icon;
                const isCompleted = currentStep > s.step;
                const isCurrent = currentStep === s.step;

                return (
                  <div key={s.step} className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black transition-all ${
                        isCompleted
                          ? 'bg-black text-volt-400'
                          : isCurrent
                          ? 'bg-volt-500 text-black shadow-md ring-2 ring-volt-400/40'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? <FaCheck size={11} /> : <Icon size={12} />}
                    </div>
                    <span className={`text-[10px] font-bold mt-1 tracking-wider uppercase text-center ${
                      isCurrent ? 'text-black font-black' : 'text-gray-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 pt-1">
              {currentStep === 1 && (
                <div className="space-y-3.5 text-xs font-bold">
                  <div>
                    <label className="block text-gray-700 mb-1">Product Title *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Club Cricket Leather Ball - Pack of 1 (White)"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1">Primary Category *</label>
                      <select
                        required
                        value={formData.category_id}
                        onChange={(e) => setFormData({ ...formData, category_id: e.target.value, subcategory_id: '' })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 font-bold text-xs"
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">Subcategory</label>
                      <select
                        value={formData.subcategory_id}
                        onChange={(e) => setFormData({ ...formData, subcategory_id: e.target.value })}
                        disabled={!formData.category_id || currentSubcategories.length === 0}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 font-bold text-xs disabled:opacity-50"
                      >
                        <option value="">Select Subcategory</option>
                        {currentSubcategories.map((sub) => (
                          <option key={sub.id} value={sub.id}>{sub.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1">Product Type *</label>
                      <select
                        value={formData.product_type}
                        onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 font-bold text-xs"
                      >
                        <option value="equipment">Sports Equipment (Gear)</option>
                        <option value="clothing">Clothing / Apparel</option>
                        <option value="shoes">Shoes / Footwear</option>
                        <option value="accessories">Accessories / Bags</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">Brand Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Generic / HRAZM"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">Gender Target</label>
                      <select
                        value={isApparelOrFootwear ? formData.gender : 'Unisex'}
                        disabled={!isApparelOrFootwear}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        className="w-full border rounded-xl p-3 font-bold text-xs bg-gray-50 border-gray-200"
                      >
                        <option value="Unisex">Unisex</option>
                        <option value="Men">Men</option>
                        <option value="Women">Women</option>
                        <option value="Kids">Kids</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1">Base Price / MRP (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="499.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">Selling / Discount Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="199.00"
                        value={formData.discount_price}
                        onChange={(e) => setFormData({ ...formData, discount_price: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">Inventory Units in Stock *</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:border-volt-500 text-xs font-normal"
                    />
                  </div>

                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="font-black text-black block">Featured Product</span>
                      <span className="text-[10px] text-gray-400">Show in homepage dynamic slider</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="w-5 h-5 rounded text-volt-500 focus:ring-0 cursor-pointer"
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 text-xs font-bold">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1">Material</label>
                      <input
                        type="text"
                        placeholder="e.g. Leather"
                        value={formData.material}
                        onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Age Range</label>
                      <input
                        type="text"
                        placeholder="e.g. Adult"
                        value={formData.age_range}
                        onChange={(e) => setFormData({ ...formData, age_range: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-normal"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-700 mb-1">Item Weight</label>
                      <input
                        type="text"
                        placeholder="e.g. 399 Grams"
                        value={formData.item_weight}
                        onChange={(e) => setFormData({ ...formData, item_weight: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-normal"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-700 mb-1">Available Colors (Comma-separated) *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. White, Red"
                        value={formData.available_colors}
                        onChange={(e) => setFormData({ ...formData, available_colors: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-mono font-normal"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-700 mb-1">What is in the box?</label>
                      <input
                        type="text"
                        placeholder="e.g. 1 x Cricket Ball"
                        value={formData.whats_in_the_box}
                        onChange={(e) => setFormData({ ...formData, whats_in_the_box: e.target.value })}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-xs font-normal"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">
                      About this item (Line-by-line Bullet Points) *
                    </label>
                    <textarea
                      rows="4"
                      required
                      placeholder="Crafted for Performance: Delivers consistent bounce.&#10;Durable Construction: Retains shape."
                      value={formData.about_item}
                      onChange={(e) => setFormData({ ...formData, about_item: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs leading-relaxed font-normal"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-1">Product Description</label>
                    <textarea
                      rows="3"
                      placeholder="Enter detailed description..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs font-normal"
                    />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-4 text-xs font-bold">
                  <div className="p-3 border rounded-2xl bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-800 text-xs">1. Main Display Image *</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={formData.image_main_color}
                          onChange={(e) => setFormData({ ...formData, image_main_color: e.target.value })}
                          className="border rounded-lg px-2 py-1 text-[11px] bg-white font-bold text-gray-900 border-gray-300"
                        >
                          <option value="">Select Color</option>
                          {mergedColorOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <label className="cursor-pointer bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                          <FaUpload size={9} /> Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image_main')} />
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Paste Image URL or select file above..."
                      value={formData.image_main}
                      onChange={(e) => setFormData({ ...formData, image_main: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-normal"
                    />
                  </div>

                  <div className="p-3 border rounded-2xl bg-gray-50 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-800 text-xs">2. Second Image *</label>
                      <div className="flex items-center gap-2">
                        <select
                          value={formData.image_2_color}
                          onChange={(e) => setFormData({ ...formData, image_2_color: e.target.value })}
                          className="border rounded-lg px-2 py-1 text-[11px] bg-white font-bold text-gray-900 border-gray-300"
                        >
                          <option value="">Select Color</option>
                          {mergedColorOptions.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <label className="cursor-pointer bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                          <FaUpload size={9} /> Upload
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image_2')} />
                        </label>
                      </div>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="Paste Image URL or select file above..."
                      value={formData.image_2}
                      onChange={(e) => setFormData({ ...formData, image_2: e.target.value })}
                      className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-normal"
                    />
                  </div>

                  {[3, 4, 5].map((imageNumber) => (
                    <div key={imageNumber} className="p-3 border rounded-2xl bg-gray-50 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-gray-800 text-xs">{imageNumber}. Additional Image <span className="text-gray-400">(Optional)</span></label>
                        <div className="flex items-center gap-2">
                          <select
                            value={formData[`image_${imageNumber}_color`]}
                            onChange={(e) => setFormData({ ...formData, [`image_${imageNumber}_color`]: e.target.value })}
                            className="border rounded-lg px-2 py-1 text-[11px] bg-white font-bold text-gray-900 border-gray-300"
                          >
                            <option value="">Select Color</option>
                            {mergedColorOptions.map((color) => (
                              <option key={color} value={color}>{color}</option>
                            ))}
                          </select>
                          <label className="cursor-pointer bg-black text-white px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                            <FaUpload size={9} /> Upload
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, `image_${imageNumber}`)} />
                          </label>
                        </div>
                      </div>
                      <input
                        type="text"
                        placeholder="Paste optional image URL or select a file..."
                        value={formData[`image_${imageNumber}`]}
                        onChange={(e) => setFormData({ ...formData, [`image_${imageNumber}`]: e.target.value })}
                        className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-normal"
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaArrowLeft size={10} /> Back
                  </button>
                ) : <div></div>}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="px-6 py-2.5 bg-black hover:bg-gray-900 text-volt-400 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md ml-auto cursor-pointer"
                  >
                    Next Step <FaArrowRight size={10} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-volt-500 hover:bg-volt-400 text-black rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md ml-auto cursor-pointer"
                  >
                    <FaCheck size={12} /> {editingProduct ? 'Save Changes' : 'Upload Product'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCELLED ORDER DELETE CONFIRMATION MODAL */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 space-y-4 animate-scale-in text-center relative">
            <button onClick={() => setDeleteConfirmModal(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black cursor-pointer">
              <FaTimes size={16} />
            </button>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
              <FaTrash size={26} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-black italic uppercase text-black">Delete Cancelled Order?</h3>
              <p className="text-xs text-gray-500">
                Are you sure you want to permanently remove cancelled order <strong className="text-black font-mono">#{deleteConfirmModal.order_number}</strong>?
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setDeleteConfirmModal(null)} className="flex-1 py-3 bg-gray-100 text-gray-800 rounded-xl font-bold text-xs uppercase cursor-pointer">
                Keep
              </button>
              <button disabled={isDeleting} onClick={handleConfirmDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-black text-xs uppercase cursor-pointer">
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATUS UPDATE MODAL */}
      {statusDialog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-black uppercase text-black">
                Update Order: <span className="text-volt-600 font-mono">#{statusDialog.orderNumber}</span>
              </h3>
              <button onClick={() => setStatusDialog(null)} className="text-gray-400 hover:text-black cursor-pointer">
                <FaTimes size={14} />
              </button>
            </div>
            <form onSubmit={handleConfirmStatusUpdate} className="space-y-3.5 text-xs font-bold">
              <div>
                <label className="block text-gray-700 mb-1">New Status</label>
                <div className="p-2.5 bg-volt-50 border border-volt-200 rounded-xl text-volt-800 uppercase font-black">
                  {statusDialog.newStatus}
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Payment Status</label>
                <select
                  value={statusDialog.newPaymentStatus}
                  onChange={(e) => setStatusDialog({ ...statusDialog, newPaymentStatus: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-volt-500 cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid / Completed</option>
                  <option value="Failed">Failed</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">Status Note</label>
                <textarea
                  rows="3"
                  required
                  value={statusDialog.reason}
                  onChange={(e) => setStatusDialog({ ...statusDialog, reason: e.target.value })}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 focus:outline-none focus:border-volt-500 font-normal"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setStatusDialog(null)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold cursor-pointer">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-volt-500 hover:bg-volt-400 text-black font-black uppercase rounded-xl tracking-wider shadow-md cursor-pointer">
                  Confirm Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}