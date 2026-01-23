interface RecentPostsProps {
  userId: string;
}

export async function RecentPosts({ userId }: RecentPostsProps) {
  // TODO: Fetch actual posts from your database
  const posts: any[] = [];

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
      </div>
      
      <div className="p-6">
        {posts.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No posts yet. Create your first post to see it here!
          </p>
        ) : (
          <div className="space-y-4">
            {posts.map((post: any) => (
              <div key={post.id} className="border-b pb-4 last:border-0">
                <p className="text-gray-900">{post.content}</p>
                <p className="text-sm text-gray-500 mt-2">{post.createdAt}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}