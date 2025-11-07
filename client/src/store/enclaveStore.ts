import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { 
  ViewMode, 
  ContentType, 
  PanelState, 
  Alert, 
  EnclaveLayout,
  PanelSize 
} from '@/types/enclave.types';

interface EnclaveStore extends EnclaveLayout {
  // Layout actions
  setViewMode: (mode: ViewMode) => void;
  resetLayout: () => void;
  
  // Content actions
  switchContent: (content: ContentType) => void;
  setMainPanelSize: (size: PanelSize) => void;
  
  // Panel actions
  togglePanel: (panelId: string) => void;
  setPanelSize: (panelId: string, size: PanelSize) => void;
  zoomPanel: (panelId: string) => void;
  
  // Sidebar actions
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  
  // Alert actions
  alerts: Alert[];
  addAlert: (alert: Omit<Alert, 'id' | 'timestamp' | 'read'>) => void;
  focusAlert: (alert: Alert) => void;
  dismissAlert: (alertId: string) => void;
  markAlertRead: (alertId: string) => void;
  clearAlerts: () => void;
}

const defaultPanels: PanelState[] = [
  { id: 'temp', visible: true, size: 'normal', order: 0 },
  { id: 'notifications', visible: true, size: 'normal', order: 1 },
  { id: 'circuit', visible: true, size: 'normal', order: 2 },
  { id: 'system', visible: true, size: 'normal', order: 3 },
];

const defaultCircularPanels: PanelState[] = [
  { id: 'analytics', visible: true, size: 'normal', order: 0 },
  { id: 'security', visible: true, size: 'normal', order: 1 },
  { id: 'network', visible: true, size: 'normal', order: 2 },
];

const initialState: EnclaveLayout = {
  viewMode: 'dashboard',
  mainPanel: {
    content: 'feed',
    size: 'normal',
  },
  leftSidebar: {
    visible: true,
    panels: defaultPanels,
  },
  rightSidebar: {
    visible: true,
    panels: defaultCircularPanels,
  },
  alertOverlay: {
    active: false,
    focusedAlert: null,
  },
};

export const useEnclaveStore = create<EnclaveStore>()(
  devtools(
    (set) => ({
      ...initialState,
      alerts: [],

      // Layout actions
      setViewMode: (mode) => 
        set((state) => {
          const updates: Partial<EnclaveLayout> = { viewMode: mode };
          
          // Adjust layout based on view mode
          switch (mode) {
            case 'theater':
              updates.leftSidebar = { ...state.leftSidebar, visible: false };
              updates.rightSidebar = { ...state.rightSidebar, visible: false };
              updates.mainPanel = { ...state.mainPanel, size: 'expanded' };
              break;
            case 'focus':
              updates.leftSidebar = { ...state.leftSidebar, visible: false };
              updates.rightSidebar = { ...state.rightSidebar, visible: false };
              break;
            case 'split':
              updates.mainPanel = { ...state.mainPanel, size: 'compact' };
              updates.leftSidebar = { ...state.leftSidebar, visible: true };
              break;
            case 'dashboard':
            default:
              updates.leftSidebar = { ...state.leftSidebar, visible: true };
              updates.rightSidebar = { ...state.rightSidebar, visible: true };
              updates.mainPanel = { ...state.mainPanel, size: 'normal' };
          }
          
          return updates;
        }),

      resetLayout: () => set(initialState),

      // Content actions
      switchContent: (content) =>
        set((state) => ({
          mainPanel: { ...state.mainPanel, content },
        })),

      setMainPanelSize: (size) =>
        set((state) => ({
          mainPanel: { ...state.mainPanel, size },
        })),

      // Panel actions
      togglePanel: (panelId) =>
        set((state) => {
          const updatePanels = (panels: PanelState[]) =>
            panels.map((p) =>
              p.id === panelId ? { ...p, visible: !p.visible } : p
            );

          return {
            leftSidebar: {
              ...state.leftSidebar,
              panels: updatePanels(state.leftSidebar.panels),
            },
            rightSidebar: {
              ...state.rightSidebar,
              panels: updatePanels(state.rightSidebar.panels),
            },
          };
        }),

      setPanelSize: (panelId, size) =>
        set((state) => {
          const updatePanels = (panels: PanelState[]) =>
            panels.map((p) => (p.id === panelId ? { ...p, size } : p));

          return {
            leftSidebar: {
              ...state.leftSidebar,
              panels: updatePanels(state.leftSidebar.panels),
            },
            rightSidebar: {
              ...state.rightSidebar,
              panels: updatePanels(state.rightSidebar.panels),
            },
          };
        }),

      zoomPanel: (panelId) =>
        set(() => ({
          viewMode: 'focus',
          leftSidebar: { visible: false, panels: defaultPanels },
          rightSidebar: { visible: false, panels: defaultCircularPanels },
        })),

      // Sidebar actions
      toggleLeftSidebar: () =>
        set((state) => ({
          leftSidebar: { ...state.leftSidebar, visible: !state.leftSidebar.visible },
        })),

      toggleRightSidebar: () =>
        set((state) => ({
          rightSidebar: { ...state.rightSidebar, visible: !state.rightSidebar.visible },
        })),

      // Alert actions
      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: `alert-${Date.now()}-${Math.random()}`,
              timestamp: new Date(),
              read: false,
            },
            ...state.alerts,
          ],
        })),

      focusAlert: (alert) =>
        set((state) => ({
          alertOverlay: { active: true, focusedAlert: alert },
          viewMode: 'focus',
          leftSidebar: { ...state.leftSidebar, visible: false },
          rightSidebar: { ...state.rightSidebar, visible: false },
        })),

      dismissAlert: (alertId) =>
        set((state) => {
          const alerts = state.alerts.filter((a) => a.id !== alertId);
          const alertOverlay =
            state.alertOverlay.focusedAlert?.id === alertId
              ? { active: false, focusedAlert: null }
              : state.alertOverlay;

          return { alerts, alertOverlay };
        }),

      markAlertRead: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, read: true } : a
          ),
        })),

      clearAlerts: () =>
        set({
          alerts: [],
          alertOverlay: { active: false, focusedAlert: null },
        }),
    }),
    { name: 'EnclaveStore' }
  )
);
