'use client';

import { AlertTriangle } from 'lucide-react';

export function InsecureBanner() {
  return (
    <div className="flex items-center gap-2 bg-amber-500 px-4 py-1 text-xs font-medium text-white">
      <AlertTriangle className="h-3 w-3 shrink-0" />
      <span>Insecure connection — API key is being transmitted unencrypted over HTTP</span>
    </div>
  );
}
