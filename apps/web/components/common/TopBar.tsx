'use client';

import Link from 'next/link';
import { Menu } from 'lucide-react';

export function TopBar({ title, showMenu, onMenuClick }: { title: string; showMenu?: boolean; onMenuClick?: () => void }) {
  return (
    <header className="sticky top-0 bg-white border-b border-gray-200 z-40">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <Link href="/" className="text-lg font-bold text-blue-600">{title}</Link>
        {showMenu && <button onClick={onMenuClick} className="p-2"><Menu size={22} /></button>}
      </div>
    </header>
  );
}
