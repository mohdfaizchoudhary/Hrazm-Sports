export default function Button({ children, onClick, type = 'button', variant = 'primary', className = '', disabled = false }) {
  const baseStyles = 'px-6 py-2.5 rounded-xl font-medium transition-all duration-300 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-aqua-500 hover:bg-aqua-600 text-black hover:shadow-aqua-glow hover:-translate-y-0.5',
    secondary: 'bg-white border border-gray-200 text-black hover:border-aqua-500 hover:shadow-aqua-sm hover:-translate-y-0.5',
    danger: 'bg-red-500 hover:bg-red-600 text-white hover:shadow-md',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
}
