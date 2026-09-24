import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CartContext } from '../context/CartContext';
import { 
  FaSearch, 
  FaShoppingBag, 
  FaHeart,
  FaUser, 
  FaBolt, 
  FaShieldAlt, 
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaBoxOpen,
  FaFire
} from 'react-icons/fa';
import { WishlistContext } from '../context/WishlistContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { cart } = useContext(CartContext);
  const { count: wishlistCount } = useContext(WishlistContext);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const currentSearch = new URLSearchParams(location.search).get('search') || '';
    setSearchTerm(currentSearch);
  }, [location.search]);

  const updateSearch = (value) => {
    setSearchTerm(value);
    const isDashboard = location.pathname === '/' || location.pathname === '/dashboard';
    if (location.pathname !== '/products' && !isDashboard) return;

    const params = new URLSearchParams(location.search);
    if (value.trim()) params.set('search', value);
    else params.delete('search');
    const destination = isDashboard ? '/dashboard' : '/products';
    navigate(`${destination}?${params.toString()}`, { replace: true });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams(location.search);
      params.set('search', searchTerm.trim());
      navigate(`/products?${params.toString()}`);
      setMobileMenuOpen(false);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate('/login');
  };

  const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

  const categoryLinks = [
    { name: 'Running', path: '/products?category=running' },
    { name: 'Football', path: '/products?category=football' },
    { name: 'Cricket', path: '/products?category=cricket' },
    { name: 'Gym', path: '/products?category=gym-fitness' },
    { name: 'Badminton', path: '/products?category=badminton' },
    { name: 'Outdoor', path: '/products?category=trekking-outdoor' },
    { name: 'Cycling', path: '/products?category=cycling' },
    { name: 'Combat', path: '/products?category=combat-sports' },
  ];

  return (
    <header className="sticky top-0 z-40 shadow-md">
      {/* Announcement Bar */}
      <div className="bg-volt-500 text-black text-[10px] sm:text-[11px] font-black tracking-widest text-center py-1.5 uppercase flex items-center justify-center gap-2">
        <span>⚡ Free Express Shipping On All Sports Orders Over Rs 999 🚚</span>
      </div>

      <nav className="bg-black text-white border-b border-gray-800 font-sans">
        {/* Main Navbar Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-3">
          
          {/* ⚡ Compact Logo on Mobile */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 group">
            <div className="w-7 h-7 sm:w-9 sm:h-9 bg-volt-500 text-black rounded-lg sm:rounded-xl flex items-center justify-center font-black text-sm sm:text-xl italic shadow-[0_0_15px_rgba(180,240,0,0.4)]">
              <FaBolt size={14} className="sm:hidden" />
              <FaBolt size={18} className="hidden sm:inline" />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-base sm:text-[18px] tracking-tighter text-white uppercase italic leading-none">
                HRAZM <span className="text-volt-500">SPORTS</span>
              </span>
              <span className="text-[7.5px] sm:text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
                Athletic Gear & Wear
              </span>
            </div>
          </Link>

          {/* Desktop Categories Navigation */}
          <div className="hidden lg:flex items-center gap-5 xl:gap-6 text-xs uppercase font-extrabold tracking-wider">
            {categoryLinks.map((cat, idx) => (
              <Link 
                key={idx} 
                to={cat.path} 
                className="hover:text-volt-500 transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
            <Link to="/products?sale=true" className="text-red-500 hover:text-red-400 font-black flex items-center gap-1">
              <FaFire size={12} /> Sale
            </Link>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            {user ? (
              <div className="flex items-center gap-2.5 sm:gap-3">
                {!isAdmin && (
                  <Link to="/orders" onClick={closeMenu} className="text-gray-300 hover:text-volt-500 flex items-center gap-1 text-xs font-bold">
                    <FaUser size={13} />
                    <span className="hidden sm:inline">{user.first_name || 'Account'}</span>
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin/products" onClick={closeMenu} className="bg-volt-500 text-black px-2.5 sm:px-3 py-1.5 rounded-lg text-[10px] sm:text-[11px] font-black flex items-center gap-1 shadow-sm">
                    <FaShieldAlt size={12} /> <span className="hidden sm:inline">Admin</span>
                  </Link>
                )}

                <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 p-1.5 transition-colors cursor-pointer" title="Logout">
                  <FaSignOutAlt size={13} />
                </button>
              </div>
            ) : (
              <Link to="/login" onClick={closeMenu} className="text-gray-300 hover:text-volt-500 flex items-center gap-1 text-xs font-bold">
                <FaUser size={14} />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {!isAdmin && (
              <Link to="/wishlist" onClick={closeMenu} className="relative p-2 bg-dark-800 rounded-xl border border-gray-700 hover:border-red-400 transition-colors" title="Wishlist" aria-label="Wishlist">
                <FaHeart size={15} className="text-red-400" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-black text-[9px] sm:text-[10px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg">
                    {wishlistCount}
                  </span>
                )}
              </Link>
            )}

            {!isAdmin && (
              <Link to="/cart" onClick={closeMenu} className="relative p-2 bg-dark-800 rounded-xl border border-gray-700 hover:border-volt-500 transition-colors">
                <FaShoppingBag size={15} className="text-volt-500" />
                {cart?.total_items > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-volt-500 text-black font-black text-[9px] sm:text-[10px] w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shadow-lg">
                    {cart.total_items}
                  </span>
                )}
              </Link>
            )}

            {/* ⚡ Mobile Toggle Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-dark-800 border border-gray-700 text-volt-500 hover:border-volt-500 focus:outline-none transition-all cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <FaTimes size={16} /> : <FaBars size={16} />}
            </button>
          </div>

        </div>

        {/* Centered Desktop Search Bar Below Navigation Links */}
        <div className="hidden lg:flex justify-center px-4 pb-3">
          <form onSubmit={handleSearch} className="relative w-3/5">
            <input
              type="text"
              placeholder="Search running shoes, bats, footballs..."
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className="w-full bg-dark-800 text-white placeholder-gray-500 text-xs rounded-full pl-4 pr-10 py-2.5 border border-gray-700 focus:outline-none focus:border-volt-500"
            />
            <button type="submit" className="absolute right-3 top-3 text-gray-400 hover:text-volt-500 cursor-pointer">
              <FaSearch size={13} />
            </button>
          </form>
        </div>

        {/* ⚡ Mobile Search Bar (Toggle se bahar, proper padding ke sath) */}
        <div className="lg:hidden px-4 pb-3 pt-1">
          <form onSubmit={handleSearch} className="relative w-full">
            <input
              type="text"
              placeholder="Search shoes, bats, footballs, jerseys..."
              value={searchTerm}
              onChange={(e) => updateSearch(e.target.value)}
              className="w-full bg-dark-800 text-white placeholder-gray-500 text-xs rounded-xl pl-4 pr-10 py-2.5 border border-gray-700 focus:outline-none focus:border-volt-500 shadow-inner"
            />
            <button type="submit" className="absolute right-3.5 top-3 text-gray-400 hover:text-volt-500 cursor-pointer">
              <FaSearch size={12} />
            </button>
          </form>
        </div>

        {/* ======================================================== */}
        {/* 📱 MOBILE ANIMATED ACCORDION MENU (Only Links Inside) */}
        {/* ======================================================== */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-black/95 border-t border-gray-800 backdrop-blur-md ${
            mobileMenuOpen ? 'max-h-[500px] opacity-100 py-4 px-4' : 'max-h-0 opacity-0 py-0 px-4 pointer-events-none'
          }`}
        >
          {/* Categories Grid List */}
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 block px-1 mb-2">
              Sports Categories
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {categoryLinks.map((cat, idx) => (
                <Link
                  key={idx}
                  to={cat.path}
                  onClick={closeMenu}
                  className="px-3 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-gray-300 hover:text-black hover:bg-volt-500 transition-colors flex items-center justify-between bg-dark-800/60 border border-gray-800"
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] text-gray-500">→</span>
                </Link>
              ))}
            </div>

            <Link
              to="/products?sale=true"
              onClick={closeMenu}
              className="mt-2 flex items-center justify-between px-3.5 py-2.5 rounded-xl font-black text-xs uppercase tracking-wider text-red-400 bg-red-500/10 border border-red-500/20"
            >
              <span className="flex items-center gap-1.5"><FaFire /> Flash Sale Offers</span>
              <span>⚡</span>
            </Link>
          </div>

          {/* User Quick Actions */}
          <div className="mt-4 pt-3.5 border-t border-gray-800 flex items-center justify-between text-xs">
            {user ? (
              <>
                <Link
                  to="/orders"
                  onClick={closeMenu}
                  className="flex items-center gap-2 font-bold text-gray-300 hover:text-volt-500"
                >
                  <FaBoxOpen className="text-volt-500" size={14} /> My Orders
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin/products"
                    onClick={closeMenu}
                    className="flex items-center gap-1.5 text-volt-400 font-bold"
                  >
                    <FaShieldAlt size={12} /> Admin Workspace
                  </Link>
                )}
              </>
            ) : (
              <div className="flex gap-2 w-full">
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="flex-1 text-center py-2.5 rounded-xl bg-volt-500 text-black font-black uppercase text-xs tracking-wider"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={closeMenu}
                  className="flex-1 text-center py-2.5 rounded-xl bg-dark-800 text-white border border-gray-700 font-black uppercase text-xs tracking-wider"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}