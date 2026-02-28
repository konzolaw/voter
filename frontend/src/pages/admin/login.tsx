import { useState } from 'react';
import { useRouter } from 'next/router';
import Image from 'next/image';

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check hardcoded credentials
    if (username === 'admin' && password === 'admin') {
      // Store session
      sessionStorage.setItem('admin_logged_in', 'true');
      // Redirect to admin dashboard
      router.push('/admin');
    } else {
      setError('Invalid username or password');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <div className="relative w-full h-64 md:h-96">
        <Image
          src="/hero.png"
          alt="Reign City Security Team"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gold mb-2">
              Admin Portal
            </h1>
            <p className="text-gray-200 text-lg">Reign City Security Team Elections</p>
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="glass-effect-strong rounded-2xl p-8">
            <h2 className="text-2xl font-bold mb-6 text-center text-gold">
              Administrator Login
            </h2>

            <form onSubmit={handleLogin}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="Enter admin username"
                  required
                  disabled={loading}
                />
              </div>

              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black/30 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-dark hover:to-gold text-black font-bold py-3 px-6 rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none gold-glow"
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => router.push('/')}
                className="text-gray-400 hover:text-gold transition-colors text-sm"
              >
                ← Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
