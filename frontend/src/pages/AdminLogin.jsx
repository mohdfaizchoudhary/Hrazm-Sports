import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { FaUserShield } from 'react-icons/fa';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user?.is_staff) {
        navigate('/admin/products');
      } else {
        setError('Access Denied: You do not have Administrator permissions.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-8">
      <div className="bg-white border border-gray-200 rounded-3xl p-8 max-w-md w-full shadow-sm">
        <div className="w-12 h-12 bg-aqua-50 text-aqua-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <FaUserShield size={24} />
        </div>
        <h2 className="text-2xl font-black text-black text-center">Admin Portal</h2>
        <p className="text-xs text-gray-500 text-center mt-1 mb-6">
          Sign in with superuser credentials to manage catalog & products
        </p>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-aqua-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl p-2.5 text-sm focus:outline-none focus:border-aqua-500"
            />
          </div>
          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'Authenticating...' : 'Access Admin Workspace'}
          </Button>
        </form>

        <p className="text-xs text-center text-gray-500 mt-6">
          Customer account?{' '}
          <Link to="/login" className="text-aqua-600 font-semibold hover:underline">
            Customer Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}