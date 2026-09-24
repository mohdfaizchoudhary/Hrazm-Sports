import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import CategoryCard from '../components/CategoryCard';
import Button from '../components/Button';
import Loading from '../components/Loading';

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/products/featured/'),
      API.get('/categories/'),
    ]).then(([featRes, catRes]) => {
      setFeatured(featRes.data);
      setCategories(catRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading message="Loading storefront..." />;

  return (
    <div className="space-y-16">
      <section className="bg-gradient-to-b from-aqua-50/50 to-white py-20 px-6 rounded-3xl border border-aqua-100 max-w-7xl mx-auto text-center mt-6">
        <span className="text-xs font-bold uppercase tracking-wider text-aqua-600 bg-aqua-100 px-3 py-1 rounded-full">
          Modern Commerce Platform
        </span>
        <h1 className="text-4xl md:text-6xl font-black text-black mt-4 max-w-3xl mx-auto leading-tight">
          Discover Products You Will Love
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto mt-4">
          Shop premium, handpicked collections at great prices.
        </p>
        <div className="flex items-center justify-center gap-4 mt-8">
          <Link to="/products"><Button>Shop Now</Button></Link>
          <Link to="/products"><Button variant="secondary">Explore Categories</Button></Link>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-black mb-6">Featured Categories</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((c) => (
            <CategoryCard key={c.id} category={c} />
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-black">Featured Products</h2>
          <Link to="/products" className="text-sm font-semibold text-aqua-600 hover:text-aqua-700">View All →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
