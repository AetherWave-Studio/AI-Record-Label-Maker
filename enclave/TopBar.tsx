import { motion } from 'framer-motion';
import { useEnclaveStore } from '@/store/enclaveStore';
import { Clock, Bell, Settings, User } from 'lucide-react';
import styles from './TopBar.module.css';

export const TopBar: React.FC = () => {
  const { alerts, viewMode, setViewMode } = useEnclaveStore();
  const unreadCount = alerts.filter(a => !a.read).length;

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const viewModeButtons = [
    { mode: 'dashboard' as const, label: 'Dashboard', shortcut: '1' },
    { mode: 'theater' as const, label: 'Theater', shortcut: '2' },
    { mode: 'split' as const, label: 'Split', shortcut: '3' },
  ];

  return (
    <div className={styles.topBar}>
      {/* Left section - Branding */}
      <div className={styles.leftSection}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}></div>
          <span className={styles.logoText}>AETHERWAVE ENCLAVE</span>
        </div>
      </div>

      {/* Center section - View mode controls */}
      <div className={styles.centerSection}>
        {viewModeButtons.map(({ mode, label, shortcut }) => (
          <motion.button
            key={mode}
            className={`${styles.viewModeBtn} ${viewMode === mode ? styles.active : ''}`}
            onClick={() => setViewMode(mode)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {label}
            <span className={styles.shortcut}>⌃{shortcut}</span>
          </motion.button>
        ))}
      </div>

      {/* Right section - Status indicators */}
      <div className={styles.rightSection}>
        <div className={styles.dateTime}>
          <Clock size={16} />
          <span>{currentTime}</span>
          <span className={styles.divider}>|</span>
          <span>{currentDate}</span>
        </div>

        <motion.button
          className={styles.iconBtn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <span className={styles.badge}>{unreadCount}</span>
          )}
        </motion.button>

        <motion.button
          className={styles.iconBtn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <Settings size={20} />
        </motion.button>

        <motion.button
          className={styles.iconBtn}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <User size={20} />
        </motion.button>
      </div>
    </div>
  );
};
