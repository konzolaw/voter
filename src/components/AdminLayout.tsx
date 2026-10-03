import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();

  const navItems = [
    { name: 'Overview', path: '/admin' },
    { name: 'Voters', path: '/admin/voters' },
    { name: 'Candidates', path: '/admin/candidates' },
    { name: 'Positions', path: '/admin/positions' },
    { name: 'Votes', path: '/admin/votes' },
    { name: 'Control', path: '/admin/control' },
  ];

  useEffect(() => {
    // Check if admin is logged in
    const isLoggedIn = sessionStorage.getItem('admin_logged_in');
    if (!isLoggedIn) {
      router.push('/admin/login');
      return;
    }

    // Prefetch all admin pages into Next.js router cache
    navItems.forEach((item) => {
      router.prefetch(item.path);
    });
  }, [router]);

  const handleLogout = () => {
    // Clear session and redirect
    sessionStorage.removeItem('admin_logged_in');
    router.push('/admin/login');
  };


  return (
    <div className="min-h-screen ambient-bg flex flex-col">
      {/* Top Admin Navigation Header */}
      <header className="border-b border-white/10 bg-canvas/80 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Branding - Pure Naked Typography */}
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-syne font-black text-xl sm:text-2xl tracking-tight text-white uppercase">
                  REIGN CITY
                </span>
                <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-gold font-outfit">
                  Command
                </span>
              </div>
              <p className="text-[10px] text-titanium tracking-widest uppercase">
                Directorate Administration
              </p>
            </div>

            {/* Logout Action */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/')}
                className="tap-effect hidden sm:inline-flex items-center gap-1.5 text-xs text-titanium hover:text-white px-3 py-1.5 rounded-xl border border-white/5 transition-colors"
                title="View Public Site"
              >
                <span>Live Site</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>

              <button
                onClick={handleLogout}
                className="tap-effect text-xs font-medium text-rose-300 hover:text-rose-100 px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Logout</span>
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>

          {/* Navigation Bar */}
          <div className="flex gap-2 sm:gap-6 overflow-x-auto pb-2 scrollbar-none">
            {navItems.map((item) => {
              const isActive = router.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => router.push(item.path)}
                  className={`tap-effect py-2 px-3 text-xs sm:text-sm font-semibold tracking-wide transition-all whitespace-nowrap border-b-2 ${
                    isActive
                      ? 'border-gold text-white'
                      : 'border-transparent text-titanium hover:text-white'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="font-syne font-black text-2xl sm:text-4xl text-white tracking-tight leading-none uppercase">
            {title}
          </h1>
          <div className="h-0.5 w-12 bg-gold/60 mt-3" />
        </div>
        {children}
      </main>

      {/* Admin Footer */}
      <footer className="border-t border-white/5 py-4 text-center">
        <div className="text-[10px] text-titanium/50 tracking-[0.25em] uppercase font-medium">
          REIGN CITY SECURITY DIRECTORE &bull; ADMINISTRATIVE CONSOLE
        </div>
      </footer>
    </div>
  );
}
