/// <reference types="vite/client" />

import type { EmailFallback } from './types';

declare module 'react' {
  interface CSSProperties {
    [customProperty: `--${string}`]: string | number | undefined;
  }

  // React 18 emits the standards-compliant lowercase preload/content hint,
  // while its bundled JSX type still exposes only the camel-cased spelling.
  interface ImgHTMLAttributes<_T> {
    fetchpriority?: 'high' | 'low' | 'auto';
  }
}

declare global {
  interface Window {
    AVEmailJSFallback?: EmailFallback;
    __avWork?: () => {
      pinStart: number;
      pinLength: number;
      rests: number[];
      stageWidth: number;
      pinned: boolean;
      /** Legacy original-homepage QA aliases. */
      pinLen: number;
      stageW: number;
      pinOn: boolean;
    };
  }
}

export {};
