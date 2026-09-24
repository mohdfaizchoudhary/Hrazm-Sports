import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { FaUser, FaEnvelope, FaShieldAlt, FaReceipt, FaShoppingBag, FaSignOutAlt, FaBolt } from 'react-icons/fa';

export default function Profile() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return (
      <div className="text-center py-20 text-xs font-bold text-gray-500">
        Please sign in to view your athlete account.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      
      {/* Header Profile Card */}
      <div className="bg-dark-900 text-white rounded-3xl p-8 border border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-volt-500 text-black rounded-2xl flex items-center justify-center font-black text-2xl italic shadow-md">
            {user.first_name ? user.first_name[0].toUpperCase() : 'H'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black italic uppercase">{user.first_name || 'Athlete'} {user.last_name || ''}</h1>
              {user.is_staff && (
                <span className="bg-volt-500 text-black text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 text-xs font-bold bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/40 px-4 py-2.5 rounded-xl transition-all"
        >
          <FaSignOutAlt size={12} /> Sign Out
        </button>
      </div>

      {/* Account Shortcuts */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
        
        <Link to="/orders" className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:border-volt-500 transition-all space-y-2">
          <div className="w-10 h-10 bg-volt-50 text-volt-600 rounded-xl flex items-center justify-center mb-3">
            <FaReceipt size={16} />
          </div>
          <h3 className="font-black text-sm uppercase text-black">Order History</h3>
          <p className="text-gray-400 text-[11px] font-normal">Track sports equipment shipments and cancel requests.</p>
        </Link>

        <Link to="/cart" className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm hover:border-volt-500 transition-all space-y-2">
          <div className="w-10 h-10 bg-volt-50 text-volt-600 rounded-xl flex items-center justify-center mb-3">
            <FaShoppingBag size={16} />
          </div>
          <h3 className="font-black text-sm uppercase text-black">My Shopping Bag</h3>
          <p className="text-gray-400 text-[11px] font-normal">View items added to cart for quick checkout.</p>
        </Link>

        {user.is_staff && (
          <Link to="/admin/products" className="bg-white border border-volt-400 rounded-3xl p-6 shadow-sm hover:bg-volt-50/30 transition-all space-y-2">
            <div className="w-10 h-10 bg-black text-volt-500 rounded-xl flex items-center justify-center mb-3">
              <FaShieldAlt size={16} />
            </div>
            <h3 className="font-black text-sm uppercase text-black">Admin Panel</h3>
            <p className="text-gray-400 text-[11px] font-normal">Manage inventory, stock sizes, and order cancellation alerts.</p>
          </Link>
        )}

      </div>

    </div>
  );
}