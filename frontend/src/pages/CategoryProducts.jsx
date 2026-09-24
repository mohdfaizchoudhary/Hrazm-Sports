import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import API from '../services/api';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';

export default function CategoryProducts() {
  const { slug } = useParams();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`/categories/${slug}/`),
      API.get(`/products/?category__slug=${slug}`),
    ]).then(([catRes, prodRes]) => {
      setCategory(catRes.data);
      setProducts(prodRes.data.results || prodRes.data);
    }).finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Loading message="Loading category products..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="border-b border-gray-200 pb-6 mb-8">
        <h1 className="text-3xl font-black text-black">{category?.name || 'Category'}</h1>
        <p className="text-xs text-gray-500 mt-1">{category?.description || 'Browse items'}</p>
      </div>
      {products.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">No items in this category.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
