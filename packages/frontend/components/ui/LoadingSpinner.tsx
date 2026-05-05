const LoadingSpinner = () => {
  return (
    <div className="text-center py-16">
      <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-primary-200 border-t-primary-600"></div>
      <p className="mt-3 text-gray-500">Loading feature flags...</p>
    </div>
  );
}

export default LoadingSpinner