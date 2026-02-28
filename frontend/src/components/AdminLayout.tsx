import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
      router.push('/admin/login');
    }
  }, [router]);

  const handleLogout = () => {
    // Clear session and redirect
    sessionStorage.removeItem('admin_logged_in');
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Overview', path: '/admin' },
    { name: 'Voters', path: '/admin/voters' },
    { name: 'Votes', path: '/admin/votes' },
    { name: 'Control', path: '/admin/control' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Header */}
      <div className="relative w-full h-48 md:h-64">
        <Image
          src="/hero.png"
          alt="Reign City Security Team"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black/60">
          {/* Top Bar */}
          <div className="flex justify-between items-center px-4 md:px-8 py-4">
            <h1 className="text-2xl md:text-3xl font-bold text-gold">Admin Dashboard</h1>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition-all"
            >
              Logout
            </button>
          </div>

          {/* Navigation */}
          <div className="absolute bottom-0 left-0 right-0 px-4 md:px-8">
            <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
              {navItems.map((item) => {
                const isActive = router.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => router.push(item.path)}
                    className={`px-4 md:px-6 py-3 rounded-t-lg font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-gold text-black'
                        : 'bg-white/10 text-white hover:bg-white/20'
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="flex-1 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-6 text-gold">{title}</h2>
          {children}
        </div>
      </div>
    </div>
  );
}
