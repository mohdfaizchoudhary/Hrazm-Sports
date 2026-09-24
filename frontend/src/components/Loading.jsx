export default function Loading({ message = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
      <div className="w-10 h-10 border-4 border-aqua-200 border-t-aqua-500 rounded-full animate-spin" />
      <p className="text-xs text-gray-500">{message}</p>
    </div>
  );
}
