import { motion } from 'framer-motion';
import type { PanelState } from '@/types/enclave.types';
import { Thermometer, Bell, Cpu, Activity } from 'lucide-react';
import styles from './LeftSidebar.module.css';

interface LeftSidebarProps {
  panels: PanelState[];
}

const PANEL_ICONS: Record<string, React.ReactNode> = {
  temp: <Thermometer size={20} />,
  notifications: <Bell size={20} />,
  circuit: <Cpu size={20} />,
  system: <Activity size={20} />,
};

const PANEL_LABELS: Record<string, string> = {
  temp: 'Temperature',
  notifications: 'Notifications',
  circuit: 'Circuit Status',
  system: 'System Monitor',
};

const PANEL_VALUES: Record<string, string> = {
  temp: '27°C',
  notifications: '3 New',
  circuit: 'Optimal',
  system: 'Online',
};

export const LeftSidebar: React.FC<LeftSidebarProps> = ({ panels }) => {
  return (
    <div className={styles.sidebar}>
      {panels
        .filter(p => p.visible)
        .sort((a, b) => a.order - b.order)
        .map((panel, index) => (
          <motion.div
            key={panel.id}
            className={styles.panel}
            data-size={panel.size}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className={styles.panelHeader}>
              <div className={styles.icon}>
                {PANEL_ICONS[panel.id]}
              </div>
              <span className={styles.label}>
                {PANEL_LABELS[panel.id] || panel.id}
              </span>
            </div>
            <div className={styles.panelBody}>
              <div className={styles.value}>
                {PANEL_VALUES[panel.id] || '--'}
              </div>
              <div className={styles.indicator}>
                <div className={styles.bar}></div>
              </div>
            </div>
            <div className={styles.glow}></div>
          </motion.div>
        ))}
    </div>
  );
};
