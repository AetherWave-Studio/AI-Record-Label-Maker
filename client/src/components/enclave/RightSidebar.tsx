import { motion } from 'framer-motion';
import type { PanelState } from '@/types/enclave.types';
import styles from './RightSidebar.module.css';

interface RightSidebarProps {
  panels: PanelState[];
}

export const RightSidebar: React.FC<RightSidebarProps> = ({ panels }) => {
  return (
    <div className={styles.sidebar}>
      {panels
        .filter(p => p.visible)
        .sort((a, b) => a.order - b.order)
        .map((panel, index) => (
          <motion.div
            key={panel.id}
            className={styles.circularMonitor}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.15 }}
          >
            {/* Outer ring */}
            <div className={styles.ring}>
              <svg className={styles.ringProgress} viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(0, 255, 255, 0.2)"
                  strokeWidth="2"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="var(--neon-cyan)"
                  strokeWidth="2"
                  strokeDasharray="282.7"
                  strokeDashoffset="70"
                  strokeLinecap="round"
                  className={styles.progressCircle}
                />
              </svg>
            </div>

            {/* Inner content */}
            <div className={styles.content}>
              <div className={styles.icon}>
                {panel.id === 'analytics' && '📊'}
                {panel.id === 'security' && '🔒'}
                {panel.id === 'network' && '🌐'}
              </div>
              <div className={styles.label}>
                {panel.id}
              </div>
              <div className={styles.value}>
                {panel.id === 'analytics' && '84%'}
                {panel.id === 'security' && 'OK'}
                {panel.id === 'network' && '98ms'}
              </div>
            </div>

            {/* Glow effect */}
            <div className={styles.glow}></div>
          </motion.div>
        ))}
    </div>
  );
};
