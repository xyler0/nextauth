interface DashboardStatsProps {
  userId: string;
}

export default async function DashboardStats({ userId }: DashboardStatsProps) {
  // TODO: Fetch actual stats from your database
  const stats = {
    totalPosts: 0,
    journalEntries: 0,
    lastPost: null,
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-medium">Total Posts</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalPosts}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-medium">Journal Entries</h3>
        <p className="text-3xl font-bold text-gray-900 mt-2">{stats.journalEntries}</p>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-gray-600 text-sm font-medium">Last Post</h3>
        <p className="text-lg text-gray-900 mt-2">
          {stats.lastPost || 'No posts yet'}
        </p>
      </div>
    </div>
  );
}