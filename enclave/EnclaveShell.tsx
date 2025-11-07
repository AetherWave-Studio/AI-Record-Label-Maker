import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { useEnclaveStore } from '@/store/enclaveStore';
import { MainViewport } from './panels/MainViewport';
import { LeftSidebar } from './panels/LeftSidebar';
import { RightSidebar } from './panels/RightSidebar';
import { TopBar } from './panels/TopBar';
import { AlertOverlay } from './components/AlertOverlay';
import type { ViewMode, GridConfig } from '@/types/enclave.types';
import styles from './EnclaveShell.module.css';

/**
 * Grid configurations for each view mode
 */
const GRID_CONFIGS: Record<ViewMode, GridConfig> = {
  dashboard: {
    columns: '320px 1fr 280px',
    rows: '80px 1fr',
    gap: '16px',
    areas: `
      "topbar topbar topbar"
      "left main right"
    `,
  },
  theater: {
    columns: '1fr',
    rows: '80px 1fr',
    gap: '16px',
    areas: `
      "topbar"
      "main"
    `,
  },
  focus: {
    columns: '1fr',
    rows: '80px 1fr',
    gap: '16px',
    areas: `
      "topbar"
      "main"
    `,
  },
  split: {
    columns: '320px 1fr',
    rows: '80px 1fr',
    gap: '16px',
    areas: `
      "topbar topbar"
      "left main"
    `,
  },
};

/**
 * Animation variants for grid transitions
 */
const gridVariants = {
  dashboard: { opacity: 1, scale: 1 },
  theater: { opacity: 1, scale: 1.02 },
  focus: { opacity: 1, scale: 1 },
  split: { opacity: 1, scale: 1 },
};

const transition = {
  duration: 0.4,
  ease: [0.4, 0.0, 0.2, 1], // Material Design easing
};

export const EnclaveShell: React.FC = () => {
  const {
    viewMode,
    leftSidebar,
    rightSidebar,
    alertOverlay,
    setViewMode,
  } = useEnclaveStore();

  const gridConfig = GRID_CONFIGS[viewMode];

  /**
   * Keyboard shortcuts for view mode switching
   */
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      // Check for modifier key (Ctrl/Cmd)
      const modifier = e.ctrlKey || e.metaKey;

      if (modifier) {
        switch (e.key) {
          case '1':
            e.preventDefault();
            setViewMode('dashboard');
            break;
          case '2':
            e.preventDefault();
            setViewMode('theater');
            break;
          case '3':
            e.preventDefault();
            setViewMode('split');
            break;
        }
      }

      // ESC to return to dashboard
      if (e.key === 'Escape' && viewMode !== 'dashboard') {
        setViewMode('dashboard');
      }
    },
    [viewMode, setViewMode]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  return (
    <div className={styles.enclaveContainer}>
      <motion.div
        className={styles.enclaveGrid}
        style={{
          gridTemplateColumns: gridConfig.columns,
          gridTemplateRows: gridConfig.rows,
          gap: gridConfig.gap,
          gridTemplateAreas: gridConfig.areas,
        }}
        variants={gridVariants}
        animate={viewMode}
        transition={transition}
        data-view-mode={viewMode}
      >
        {/* Top Bar - Always visible */}
        <motion.div
          className={styles.topBarArea}
          style={{ gridArea: 'topbar' }}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <TopBar />
        </motion.div>

        {/* Left Sidebar - Conditionally rendered */}
        <AnimatePresence mode="wait">
          {leftSidebar.visible && (
            <motion.div
              className={styles.leftSidebarArea}
              style={{ gridArea: 'left' }}
              initial={{ x: -320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -320, opacity: 0 }}
              transition={transition}
            >
              <LeftSidebar panels={leftSidebar.panels} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Viewport - Always visible */}
        <motion.div
          className={styles.mainViewportArea}
          style={{ gridArea: 'main' }}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MainViewport />
        </motion.div>

        {/* Right Sidebar - Conditionally rendered */}
        <AnimatePresence mode="wait">
          {rightSidebar.visible && (
            <motion.div
              className={styles.rightSidebarArea}
              style={{ gridArea: 'right' }}
              initial={{ x: 280, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 280, opacity: 0 }}
              transition={transition}
            >
              <RightSidebar panels={rightSidebar.panels} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Alert Overlay - Rendered above everything */}
      <AnimatePresence>
        {alertOverlay.active && alertOverlay.focusedAlert && (
          <AlertOverlay alert={alertOverlay.focusedAlert} />
        )}
      </AnimatePresence>

      {/* Debug info in development */}
      {import.meta.env.DEV && (
        <div className={styles.debugInfo}>
          <p>Mode: {viewMode}</p>
          <p>Shortcuts: Ctrl+1 (Dashboard), Ctrl+2 (Theater), Ctrl+3 (Split), ESC (Back)</p>
        </div>
      )}
    </div>
  );
};
