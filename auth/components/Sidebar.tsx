"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, FileText, MessageSquare, Settings, LogOut, TrendingUp } from 'lucide-react';
import { signOut } from 'next-auth/react';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/journal', icon: FileText, label: 'Journal' },
    { path: '/posts', icon: MessageSquare, label: 'Posts' },
    { path: '/pattern', icon: TrendingUp, label: 'Writing Pattern' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 h-screen flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">X Poster</h1>
        {user.name && (
          <p className="text-sm text-gray-600 mt-2">{user.name}</p>
        )}
      </div>

      <nav className="flex-1 px-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}