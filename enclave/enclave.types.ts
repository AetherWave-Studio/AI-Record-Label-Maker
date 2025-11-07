/**
 * Core type definitions for AetherWave Studio User Enclave
 */

export type ViewMode = 'dashboard' | 'theater' | 'focus' | 'split';
export type PanelSize = 'collapsed' | 'compact' | 'normal' | 'expanded';
export type ContentType = 'feed' | 'messaging' | 'youtube' | 'gallery' | 'marketplace' | 'media';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface PanelState {
  id: string;
  visible: boolean;
  size: PanelSize;
  order: number;
}

export interface Alert {
  id: string;
  title: string;
  message: string;
  priority: AlertPriority;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
}

export interface EnclaveLayout {
  viewMode: ViewMode;
  mainPanel: {
    content: ContentType;
    size: PanelSize;
  };
  leftSidebar: {
    visible: boolean;
    panels: PanelState[];
  };
  rightSidebar: {
    visible: boolean;
    panels: PanelState[];
  };
  alertOverlay: {
    active: boolean;
    focusedAlert: Alert | null;
  };
}

export interface AnimationConfig {
  duration: number;
  ease: string | number[];
  delay?: number;
}

export interface GridConfig {
  columns: string;
  rows: string;
  gap: string;
  areas: string;
}
