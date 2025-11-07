import { motion, AnimatePresence } from 'framer-motion';
import { lazy, Suspense } from 'react';
import { useEnclaveStore } from '@/store/enclaveStore';
import type { ContentType } from '@/types/enclave.types';
import styles from './MainViewport.module.css';

/**
 * Lazy load view components for better performance
 */
const NewsfeedView = lazy(() => import('@/views/NewsfeedView'));
const MessagingView = lazy(() => import('@/views/MessagingView'));
const MediaGalleryView = lazy(() => import('@/views/MediaGalleryView'));
const MarketplaceView = lazy(() => import('@/views/MarketplaceView'));
const YouTubeView = lazy(() => import('@/views/YouTubeView'));

/**
 * Content registry maps content types to components
 */
const CONTENT_REGISTRY: Record<ContentType, React.LazyExoticComponent<React.ComponentType<any>>> = {
  feed: NewsfeedView,
  messaging: MessagingView,
  youtube: YouTubeView,
  gallery: MediaGalleryView,
  marketplace: MarketplaceView,
  media: MediaGalleryView, // Reuse gallery for media
};

/**
 * Loading component with cyberpunk styling
 */
const LoadingSpinner: React.FC = () => (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner}>
      <div className={styles.spinnerRing}></div>
      <div className={styles.spinnerRing}></div>
      <div className={styles.spinnerRing}></div>
    </div>
    <p className={styles.loadingText}>Initializing...</p>
  </div>
);

/**
 * Content transition variants
 */
const contentVariants = {
  initial: { 
    opacity: 0, 
    scale: 0.95,
    filter: 'blur(10px)',
  },
  animate: { 
    opacity: 1, 
    scale: 1,
    filter: 'blur(0px)',
    transition: { 
      duration: 0.3,
      ease: [0.4, 0.0, 0.2, 1],
    }
  },
  exit: { 
    opacity: 0, 
    scale: 1.05,
    filter: 'blur(10px)',
    transition: { 
      duration: 0.2,
      ease: [0.4, 0.0, 0.2, 1],
    }
  },
};

export const MainViewport: React.FC = () => {
  const { mainPanel } = useEnclaveStore();
  const ContentComponent = CONTENT_REGISTRY[mainPanel.content];

  return (
    <div className={styles.viewport} data-size={mainPanel.size}>
      {/* Holographic border effect */}
      <div className={styles.border}>
        <div className={styles.borderTop}></div>
        <div className={styles.borderRight}></div>
        <div className={styles.borderBottom}></div>
        <div className={styles.borderLeft}></div>
      </div>

      {/* Content area with smooth transitions */}
      <div className={styles.contentWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={mainPanel.content}
            variants={contentVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className={styles.content}
          >
            <Suspense fallback={<LoadingSpinner />}>
              <ContentComponent />
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Curved display overlay effect */}
      <div className={styles.curveOverlay}></div>
    </div>
  );
};
