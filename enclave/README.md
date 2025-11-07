# AetherWave Studio User Enclave

> A cyberpunk-themed, adaptive dashboard system built with React 18+, TypeScript, and Framer Motion.

## 🎯 Overview

The User Enclave is a comprehensive command center that serves as the central hub for all user interactions within the AetherWave Studio platform. It features an adaptive grid system, smooth animations, and a striking cyberpunk aesthetic.

## 📁 Project Structure

```
enclave/
├── types/
│   └── enclave.types.ts         # TypeScript type definitions
├── store/
│   └── enclaveStore.ts          # Zustand state management
├── enclave/
│   ├── EnclaveShell.tsx         # Main container component
│   ├── EnclaveShell.module.css  # Shell styling
│   ├── panels/
│   │   ├── MainViewport.tsx     # Content switcher
│   │   ├── MainViewport.module.css
│   │   ├── TopBar.tsx           # Status bar
│   │   ├── TopBar.module.css
│   │   ├── LeftSidebar.tsx      # Widget panels
│   │   ├── LeftSidebar.module.css
│   │   ├── RightSidebar.tsx     # Circular monitors
│   │   └── RightSidebar.module.css
│   └── components/
│       ├── AlertOverlay.tsx     # Alert focus system
│       └── AlertOverlay.module.css
└── views/
    ├── NewsfeedView.tsx         # Example view component
    └── NewsfeedView.module.css
```

## 🚀 Quick Start

### Installation

```bash
# Install dependencies
npm install zustand framer-motion lucide-react

# For TypeScript support
npm install -D @types/react @types/react-dom
```

### Basic Usage

```tsx
import { EnclaveShell } from '@/enclave/EnclaveShell';

function App() {
  return <EnclaveShell />;
}
```

## 🎨 View Modes

The Enclave supports four distinct view modes:

1. **Dashboard Mode** (Default)
   - Full layout with all panels visible
   - Keyboard: `Ctrl/Cmd + 1`

2. **Theater Mode**
   - Main viewport expands, sidebars collapse
   - Perfect for focused content consumption
   - Keyboard: `Ctrl/Cmd + 2`

3. **Split Mode**
   - Left sidebar + main viewport
   - Ideal for multitasking
   - Keyboard: `Ctrl/Cmd + 3`

4. **Focus Mode**
   - Triggered by panel zoom or alert focus
   - Return to dashboard: `ESC`

## 📦 State Management

The Enclave uses Zustand for lightweight, performant state management:

```tsx
import { useEnclaveStore } from '@/store/enclaveStore';

function MyComponent() {
  const { viewMode, setViewMode, switchContent } = useEnclaveStore();
  
  return (
    <button onClick={() => setViewMode('theater')}>
      Enter Theater Mode
    </button>
  );
}
```

### Available Store Actions

```typescript
// Layout
setViewMode(mode: ViewMode)
resetLayout()

// Content
switchContent(content: ContentType)
setMainPanelSize(size: PanelSize)

// Panels
togglePanel(panelId: string)
setPanelSize(panelId: string, size: PanelSize)
zoomPanel(panelId: string)

// Sidebars
toggleLeftSidebar()
toggleRightSidebar()

// Alerts
addAlert(alert: Omit<Alert, 'id' | 'timestamp' | 'read'>)
focusAlert(alert: Alert)
dismissAlert(alertId: string)
markAlertRead(alertId: string)
clearAlerts()
```

## 🎭 Creating New Views

Views are lazy-loaded React components that render in the MainViewport:

```tsx
// views/MarketplaceView.tsx
import { motion } from 'framer-motion';

export default function MarketplaceView() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1>Marketplace</h1>
      {/* Your content */}
    </motion.div>
  );
}
```

Register your view in `MainViewport.tsx`:

```tsx
const MarketplaceView = lazy(() => import('@/views/MarketplaceView'));

const CONTENT_REGISTRY: Record<ContentType, React.LazyExoticComponent<any>> = {
  // ...existing views
  marketplace: MarketplaceView,
};
```

## 🎨 Cyberpunk Styling

The Enclave uses CSS variables for consistent theming:

```css
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-blue: #1e88e5;
--dark-bg: rgba(10, 14, 39, 0.95);
--border-glow: 0 0 10px var(--neon-cyan), 0 0 20px var(--neon-cyan);
--text-glow: 0 0 5px var(--neon-cyan), 0 0 10px var(--neon-cyan);
```

### Key Visual Effects

1. **Holographic Borders** - Animated gradient borders with pulse effects
2. **Curved Display** - CSS perspective transforms for 3D feel
3. **Neon Glows** - Multiple box-shadows for authentic cyberpunk look
4. **Grid Background** - Animated grid overlay
5. **Loading Spinners** - Triple-ring animated loaders

## 🔧 Configuration

### Path Aliases (vite.config.ts)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
});
```

### TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./src/shared/*"],
      "@assets/*": ["./src/assets/*"]
    }
  }
}
```

## ⚡ Performance Optimizations

1. **Lazy Loading** - Views load only when accessed
2. **Code Splitting** - Automatic with Vite
3. **Memoization** - React.memo on heavy components
4. **Virtualization** - Use @tanstack/react-virtual for long lists
5. **Throttling** - Throttle expensive operations (resize, scroll)

Example virtualization:

```tsx
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100,
  });
  
  return (
    <div ref={parentRef} style={{ height: '400px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div key={virtualItem.key} style={{ height: `${virtualItem.size}px` }}>
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🎯 Animation Patterns

### Content Transitions

```tsx
const contentVariants = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
  animate: { opacity: 1, scale: 1, filter: 'blur(0px)' },
  exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)' },
};

<motion.div
  variants={contentVariants}
  initial="initial"
  animate="animate"
  exit="exit"
/>
```

### Panel Zoom

```tsx
const zoomVariants = {
  normal: { scale: 1, x: 0, y: 0 },
  zoomed: { scale: 1.5, x: 50, y: 50 },
};
```

## 🧪 Testing

### Unit Tests (Vitest)

```tsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEnclaveStore } from '@/store/enclaveStore';

describe('EnclaveStore', () => {
  it('should switch view modes', () => {
    const { result } = renderHook(() => useEnclaveStore());
    
    act(() => {
      result.current.setViewMode('theater');
    });
    
    expect(result.current.viewMode).toBe('theater');
  });
});
```

### Integration Tests (React Testing Library)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { EnclaveShell } from '@/enclave/EnclaveShell';

test('switches to theater mode on button click', () => {
  render(<EnclaveShell />);
  
  const theaterButton = screen.getByText(/theater/i);
  fireEvent.click(theaterButton);
  
  // Assert theater mode is active
});
```

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- Respects `prefers-reduced-motion`
- High contrast mode support

## 🐛 Common Issues & Solutions

### 1. Import errors with path aliases

**Solution**: Ensure `vite.config.ts` and `tsconfig.json` are properly configured.

### 2. Animations not working

**Solution**: Check that Framer Motion is installed and components are wrapped in `<AnimatePresence>`.

### 3. Store updates not reflecting

**Solution**: Ensure you're using the store within a component, not at module level.

## 📈 Implementation Phases

### ✅ Phase 1: Foundation (COMPLETE)
- EnclaveShell with adaptive grid
- View mode switching
- Base panel components
- Zustand store setup
- TypeScript configuration
- Framer Motion transitions

### 🚧 Phase 2: Content Views (NEXT)
- Build remaining view components
- Implement content routing
- Add lazy loading
- Integrate widget components
- Set up data visualization

### 📋 Phase 3: Interactions
- Panel zoom and focus system
- Alert system with priorities
- Gesture controls
- Keyboard shortcuts
- Loading states

### 🎨 Phase 4: Polish
- Advanced cyberpunk effects
- Performance optimization
- Cross-browser testing
- Accessibility audit

## 🤝 Contributing

When adding new features:

1. Follow TypeScript strict mode
2. Use CSS modules for styling
3. Implement proper animations
4. Add accessibility features
5. Write tests for critical paths
6. Update this README

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Zustand Documentation](https://docs.pmnd.rs/zustand/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [Vite Guide](https://vitejs.dev/guide/)

## 📝 License

Proprietary - AetherWave Studio

---

**Built with** ⚡ by the AetherWave Studio Frontend Team
