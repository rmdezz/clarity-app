import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock fetch for tests
global.fetch = vi.fn();

// Set base URL for relative URLs in tests  
Object.defineProperty(global, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
  },
  writable: true,
});
