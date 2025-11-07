import { motion } from 'framer-motion';
import { X, AlertTriangle, Info, AlertCircle, XCircle } from 'lucide-react';
import { useEnclaveStore } from '@/store/enclaveStore';
import type { Alert } from '@/types/enclave.types';
import styles from './AlertOverlay.module.css';

interface AlertOverlayProps {
  alert: Alert;
}

const PRIORITY_ICONS = {
  low: <Info size={32} />,
  medium: <AlertCircle size={32} />,
  high: <AlertTriangle size={32} />,
  critical: <XCircle size={32} />,
};

const PRIORITY_COLORS = {
  low: '#00ffff',
  medium: '#ffff00',
  high: '#ff8800',
  critical: '#ff0088',
};

export const AlertOverlay: React.FC<AlertOverlayProps> = ({ alert }) => {
  const { dismissAlert, markAlertRead, setViewMode } = useEnclaveStore();

  const handleDismiss = () => {
    dismissAlert(alert.id);
    setViewMode('dashboard');
  };

  const handleAction = () => {
    markAlertRead(alert.id);
    if (alert.actionUrl) {
      // Navigate to action URL
      window.location.href = alert.actionUrl;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        className={styles.backdrop}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleDismiss}
      />

      {/* Alert card */}
      <motion.div
        className={styles.alertCard}
        style={{ '--priority-color': PRIORITY_COLORS[alert.priority] } as any}
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      >
        {/* Close button */}
        <button className={styles.closeBtn} onClick={handleDismiss}>
          <X size={24} />
        </button>

        {/* Priority indicator */}
        <div className={styles.priorityBadge} data-priority={alert.priority}>
          {alert.priority}
        </div>

        {/* Icon */}
        <div className={styles.icon}>
          {PRIORITY_ICONS[alert.priority]}
        </div>

        {/* Content */}
        <div className={styles.content}>
          <h2 className={styles.title}>{alert.title}</h2>
          <p className={styles.message}>{alert.message}</p>
          <div className={styles.timestamp}>
            {new Date(alert.timestamp).toLocaleString()}
          </div>
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          {alert.actionUrl && (
            <motion.button
              className={styles.actionBtn}
              onClick={handleAction}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Take Action
            </motion.button>
          )}
          <motion.button
            className={styles.dismissBtn}
            onClick={handleDismiss}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Dismiss
          </motion.button>
        </div>

        {/* Animated border */}
        <div className={styles.animatedBorder}></div>
      </motion.div>
    </>
  );
};
