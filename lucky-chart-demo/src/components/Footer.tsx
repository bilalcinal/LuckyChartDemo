'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-3 bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">
            © 2024 Kafe Şans
          </p>
        </div>
        <div className="text-xs text-gray-600">
          <span className="mr-2">v1.0.0</span>
          {/* Admin girişi için açık URL */}
          <Link href="/admin" className="text-gray-500 hover:text-gray-400">
            Admin Girişi
          </Link>
        </div>
      </div>
    </footer>
  );
} 