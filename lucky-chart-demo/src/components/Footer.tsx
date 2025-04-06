'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full mt-auto py-3 bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-600">
            © 2025 Akyazı Macbear
          </p>
        </div>
      </div>
    </footer>
  );
} 