const DashboardContent = () => (
    <div className="w-full px-4 sm:px-6 md:px-8 py-6 mx-auto max-w-7xl">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 md:mb-6">Teacher Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Dashboard content placeholders */}
        <div className="bg-card rounded-lg shadow p-4 h-48"></div>
        <div className="bg-card rounded-lg shadow p-4 h-48"></div>
        <div className="bg-card rounded-lg shadow p-4 h-48"></div>
      </div>
    </div>
  );

export default DashboardContent;