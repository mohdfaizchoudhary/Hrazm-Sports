import { Link } from 'react-router-dom';

export default function CategoryCard({ category }) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group block p-6 bg-white border border-gray-200 rounded-2xl text-center transition-all duration-300 hover:shadow-aqua-glow hover:border-aqua-400 hover:-translate-y-1"
    >
      <div className="w-16 h-16 mx-auto mb-3 bg-aqua-100 rounded-full flex items-center justify-center text-aqua-600 font-bold text-xl group-hover:scale-110 transition-transform">
        {category.name[0]}
      </div>
      <h4 className="font-semibold text-black group-hover:text-aqua-600 transition-colors">{category.name}</h4>
      <p className="text-xs text-gray-500 mt-1 line-clamp-1">{category.description || 'Explore collection'}</p>
    </Link>
  );
}
