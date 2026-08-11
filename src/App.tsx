import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import {
  Factory, FactoryType, SupplyLink, User, EventLog,
  BackupItem, ThirdPartyCarrier, FilterState, NotificationItem,
  IntegrationSettingsResponse, CarrierSettingsUpdate, parseWebSocketMessage,
  AggregatedRoute, Product, ShipmentImportResult, SalesManager, CsvPreviewFileEntry, KanbanBoardDetail,
} from './types';
import { ApiService } from './services/api';
import { useI18n } from './i18n';
import { GlobalSearchPanel } from './components/Search/GlobalSearchPanel';
import { canAccessTab } from './utils/rbac';
import { canAccessLogs, canEditSiteDirectory, canEditShipmentStatus, canManageProducts, canManageCarriers, canManageSalesManagers, canUploadData, isShipmentInUserScope } from './utils/permissions';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { setActiveTab, type AppTab } from './store/navigationSlice';
import { createDefaultFilterState } from './utils/mapFilterDefaults';
import { mapFiltersForImportedShipments } from './utils/mapFiltersForImport';
import { DEFAULT_PRODUCT_CATALOG, activeProducts } from './constants/products';
import { activeCarriers } from './constants/carriers';
import { activeSalesManagers } from './constants/salesManagers';
import { applyMapChromeDensityClass, subscribeViewportChange } from './utils/viewport';
import { applyLayoutViewportVars } from './utils/deviceLayout';

import { LoginPage } from './components/Auth/LoginPage';
import { Header } from './components/Header';
import { AppSideRail } from './components/Layout/AppSideRail';
import { LogisticsMap, type LogisticsMapProps } from './components/Map/LogisticsMap';
import { KpiDashboard } from './components/Dashboard/KpiDashboard';
import { SkipLink } from './components/UI/VirtualList';
import { ChatWidget } from './components/Chat/ChatWidget';
import { TasksDrawer } from './components/Tasks/TasksDrawer';
import { ActiveShipmentsDrawer } from './components/Shipments/ActiveShipmentsDrawer';
import { isActiveShipment } from './components/Shipments/activeShipments';
import { showChatPushNotification, syncWebPushSubscription } from './utils/chatNotifications';

const ShipmentsList = lazy(() =>
  import('./components/Shipments/ShipmentsList').then(m => ({ default: m.ShipmentsList })),
);
const FactoriesList = lazy(() =>
  import('./components/Factories/FactoriesList').then(m => ({ default: m.FactoriesList })),
);
const SiteDirectoryPage = lazy(() =>
  import('./components/SiteDirectory/SiteDirectoryPage').then(m => ({ default: m.SiteDirectoryPage })),
);
const ProductCatalogPage = lazy(() =>
  import('./components/Products/ProductCatalogPage').then(m => ({ default: m.ProductCatalogPage })),
);
const CarrierDirectoryPage = lazy(() =>
  import('./components/Carriers/CarrierDirectoryPage').then(m => ({ default: m.CarrierDirectoryPage })),
);
const ManagerDirectoryPage = lazy(() =>
  import('./components/Managers/ManagerDirectoryPage').then(m => ({ default: m.ManagerDirectoryPage })),
);
const RzdAnalyticsPage = lazy(() =>
  import('./components/RzdAnalytics/RzdAnalyticsPage').then(m => ({ default: m.RzdAnalyticsPage })),
);
const AdminPanel = lazy(() =>
  import('./components/Admin/AdminPanel').then(m => ({ default: m.AdminPanel })),
);
const AuditLogs = lazy(() =>
  import('./components/Audit/AuditLogs').then(m => ({ default: m.AuditLogs })),
);
const MyDataPanel = lazy(() =>
  import('./components/DataEntry/MyDataPanel').then(m => ({ default: m.MyDataPanel })),
);
import type { MyDataPanelProps } from './components/DataEntry/MyDataPanel';

import { FacilityModal } from './components/Modals/FacilityModal';
import { ShipmentModal } from './components/Modals/ShipmentModal';
import { ShipmentEditModal } from './components/Shipments/ShipmentEditModal';
import { RouteDetailModal, type RouteDetailModalProps } from './components/Modals/RouteDetailModal';
import { getAuthToken, getWebSocketUrl, getWebSocketProtocols, isPortalEmbed, logoutFromPortal, subscribePortalAuthReady } from './auth/portalAuth';

const ExportModal = lazy(() =>
  import('./components/Modals/ExportModal').then(m => ({ default: m.ExportModal })),
);

export default function App() {
  const { t, locale } = useI18n();

  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [portalAwaitingLogin, setPortalAwaitingLogin] = useState(false);
  const currentUserRef = useRef<User | null>(null);
  currentUserRef.current = currentUser;

  const dispatch = useAppDispatch();
  const activeTab = useAppSelector(state => state.navigation.activeTab);

  const goToTab = useCallback((tab: string) => {
    dispatch(setActiveTab(tab as AppTab));
    if (tab !== 'map') {
      setMapMobileSearchOpen(false);
    }
  }, [dispatch]);

  const [factories, setFactories] = useState<Factory[]>([]);
  const [supplyLinks, setSupplyLinks] = useState<SupplyLink[]>([]);
  const [csvPreviewFiles, setCsvPreviewFiles] = useState<CsvPreviewFileEntry[]>([]);
  const [csvPreviewActiveFileId, setCsvPreviewActiveFileId] = useState<string | null>(null);
  const [csvPreviewActive, setCsvPreviewActive] = useState(false);
  const [csvPreviewSavedFilters, setCsvPreviewSavedFilters] = useState<FilterState | null>(null);
  const [eventLogs, setEventLogs] = useState<EventLog[]>([]);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [carriers, setCarriers] = useState<ThirdPartyCarrier[]>([]);
  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettingsResponse | null>(null);
  const [adminUsers, setAdminUsers] = useState<User[]>([]);
  const [products, setProducts] = useState<Product[]>(DEFAULT_PRODUCT_CATALOG);
  const [salesManagers, setSalesManagers] = useState<SalesManager[]>([]);

  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [tasksDrawerOpen, setTasksDrawerOpen] = useState(false);
  const [activeShipmentsDrawerOpen, setActiveShipmentsDrawerOpen] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [tasksOpenCount, setTasksOpenCount] = useState(0);
  const [tasksBoardSync, setTasksBoardSync] = useState<KanbanBoardDetail | null>(null);
  const [tasksFocusTaskId, setTasksFocusTaskId] = useState<string | null>(null);
  const [tasksFocusBoardId, setTasksFocusBoardId] = useState<string | null>(null);
  const [tasksWorkspaceRefresh, setTasksWorkspaceRefresh] = useState<{ taskId: string; key: number } | null>(null);
  const [tasksDeletedBoardId, setTasksDeletedBoardId] = useState<string | null>(null);

  const [highlightedFactoryId, setHighlightedFactoryId] = useState<string | null>(null);
  const [detailFactory, setDetailFactory] = useState<Factory | null>(null);
  const [pendingPositionEditId, setPendingPositionEditId] = useState<string | null>(null);
  const [selectedShipment, setSelectedShipment] = useState<SupplyLink | null>(null);
  const [editingShipment, setEditingShipment] = useState<SupplyLink | null>(null);
  const [shipmentSaving, setShipmentSaving] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<AggregatedRoute | null>(null);
  const [changeLogs, setChangeLogs] = useState<{ id: string; shipment_id: string; username: string; action: string; changes: string; timestamp: string }[]>([]);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [mapMobileSearchOpen, setMapMobileSearchOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(() => createDefaultFilterState());

  const activeShipmentsCount = useMemo(() => {
    if (!currentUser) return 0;
    return supplyLinks.filter(
      l => isShipmentInUserScope(l, currentUser) && isActiveShipment(l),
    ).length;
  }, [supplyLinks, currentUser]);

  const globalSearchNavItems = useMemo(() => {
    if (!currentUser) return [];
    return ([
      { id: 'map', label: t('nav.map') },
      { id: 'dashboard', label: t('nav.dashboard') },
      { id: 'shipments', label: t('nav.shipments') },
      { id: 'factories', label: t('nav.factories') },
      { id: 'sites', label: t('nav.sites') },
      { id: 'carriers', label: t('nav.carriers') },
      { id: 'products', label: t('nav.products') },
      { id: 'managers', label: t('nav.managers') },
      { id: 'rzd-analytics', label: t('nav.rzdAnalytics') },
      { id: 'mydata', label: t('nav.mydata') },
      { id: 'admin', label: t('nav.admin') },
      { id: 'logs', label: t('nav.logs') },
    ] as const).filter(item => canAccessTab(item.id, currentUser.role));
  }, [currentUser, t]);

  useEffect(() => {
    if (!currentUser) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [currentUser]);

  const handleLogout = useCallback(async () => {
    if (isPortalEmbed()) {
      await logoutFromPortal();
      ApiService.setToken(null);
      window.location.reload();
      return;
    }
    ApiService.logout();
    setCurrentUser(null);
    setFactories([]);
    setSupplyLinks([]);
    setEventLogs([]);
    setBackups([]);
    setCarriers([]);
    setAdminUsers([]);
    setProducts(DEFAULT_PRODUCT_CATALOG);
    setSalesManagers([]);
    dispatch(setActiveTab('map'));
  }, [dispatch]);

  const refreshAdminUsers = useCallback(async () => {
    const usersList = await ApiService.getUsers();
    setAdminUsers(usersList);
  }, []);

  const refreshProducts = useCallback(async () => {
    const role = currentUser?.role ?? 'local_employee';
    const list = await ApiService.getProducts(canManageProducts(role));
    if (list.length > 0) setProducts(list);
  }, [currentUser?.role]);

  const refreshCarriers = useCallback(async () => {
    const role = currentUser?.role ?? 'local_employee';
    const list = await ApiService.getCarriers(canManageCarriers(role));
    if (list.length > 0) setCarriers(list);
  }, [currentUser?.role]);

  const refreshSalesManagers = useCallback(async () => {
    const role = currentUser?.role ?? 'local_employee';
    const list = await ApiService.getSalesManagers(canManageSalesManagers(role));
    setSalesManagers(list);
  }, [currentUser?.role]);

  const loadServerData = useCallback(async (user: User) => {
    try {
      const bootstrap = await ApiService.getMapBootstrap();
      setFactories(bootstrap.factories);
      setSupplyLinks(bootstrap.supplyLinks);

      const productList = await ApiService.getProducts(canManageProducts(user.role));
      setProducts(productList);

      const carrierData = await ApiService.getCarriers(canManageCarriers(user.role));
      setCarriers(carrierData);

      const managerList = await ApiService.getSalesManagers(canManageSalesManagers(user.role));
      setSalesManagers(managerList);

      void (async () => {
        try {
          if (canAccessLogs(user.role)) {
            const logs = await ApiService.getLogs();
            setEventLogs(logs);
          }
          if (canUploadData(user.role)) {
            const cl = await ApiService.getShipmentChangeLogs();
            setChangeLogs(cl);
          }
          if (user.role === 'admin') {
            const [bkps, settings] = await Promise.all([
              ApiService.getBackups(),
              ApiService.getIntegrationSettings(),
            ]);
            setBackups(bkps);
            setIntegrationSettings(settings);
            await refreshAdminUsers();
          }
          try {
            const tasks = await ApiService.getKanbanBoards();
            setTasksOpenCount(tasks.open_assigned);
          } catch {
            /* tasks schema may not be applied yet */
          }
        } catch (e) {
          console.error('Failed to load secondary server data:', e);
        }
      })();
    } catch (e) {
      console.error('Failed to load server data:', e);
    }
  }, [refreshAdminUsers]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const { user } = await ApiService.login(username, password);
    setCurrentUser(user);
    if (!canAccessTab(activeTab, user.role)) {
      dispatch(setActiveTab('map'));
    }
    await loadServerData(user);
  }, [activeTab, dispatch, loadServerData]);

  const handlePortalLogin = useCallback(async (username: string, password: string) => {
    const { user } = await ApiService.loginViaPortal(username, password);
    setCurrentUser(user);
    if (!canAccessTab(activeTab, user.role)) {
      dispatch(setActiveTab('map'));
    }
    await loadServerData(user);
  }, [activeTab, dispatch, loadServerData]);

  useEffect(() => {
    ApiService.setOnUnauthorized(() => {
      if (isPortalEmbed()) {
        if (currentUserRef.current) {
          window.location.reload();
        }
        return;
      }
      void handleLogout();
    });
    return () => ApiService.setOnUnauthorized(() => {});
  }, [handleLogout]);

  useEffect(() => {
    document.title = t('meta.title');
  }, [t, locale]);

  useEffect(() => {
    const apply = () => applyMapChromeDensityClass();
    apply();
    return subscribeViewportChange(apply);
  }, []);

  useEffect(() => {
    const facilityModalOnMap = activeTab === 'map' && detailFactory !== null;
    document.documentElement.classList.toggle('map-facility-modal-open', facilityModalOnMap);
    return () => {
      document.documentElement.classList.remove('map-facility-modal-open');
    };
  }, [activeTab, detailFactory]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('app-tab-map', activeTab === 'map');
    applyLayoutViewportVars();
    return () => {
      root.classList.remove('app-tab-map');
      applyLayoutViewportVars();
    };
  }, [activeTab]);

  useEffect(() => {
    ApiService.setLocale(locale);
    let cancelled = false;
    let pollTimer: number | undefined;

    const bootstrapAuth = async () => {
      setPortalAwaitingLogin(false);

      if (isPortalEmbed()) {
        const portalToken = await getAuthToken();
        if (cancelled) return;
        if (!portalToken) {
          setPortalAwaitingLogin(true);
          setCurrentUser(null);
          setAuthChecked(true);
          return;
        }
        ApiService.setToken(portalToken);
      }

      const user = await ApiService.getMe();
      if (cancelled) return;
      if (user) {
        setCurrentUser(user);
        await loadServerData(user);
      } else if (isPortalEmbed()) {
        setPortalAwaitingLogin(true);
        setCurrentUser(null);
      }
      setAuthChecked(true);
    };

    void bootstrapAuth();

    if (isPortalEmbed()) {
      const unsub = subscribePortalAuthReady(() => {
        void bootstrapAuth();
      });
      const schedulePoll = () => {
        pollTimer = window.setTimeout(async () => {
          if (cancelled) return;
          if (!currentUserRef.current) {
            const token = await getAuthToken();
            if (!cancelled && token) {
              await bootstrapAuth();
            }
          }
          if (!cancelled) schedulePoll();
        }, 5000);
      };
      schedulePoll();
      return () => {
        cancelled = true;
        unsub();
        if (pollTimer) window.clearTimeout(pollTimer);
      };
    }

    return () => { cancelled = true; };
  }, [locale, loadServerData]);

  useEffect(() => {
    if (!currentUser) return;
    if (!canAccessTab(activeTab, currentUser.role)) {
      dispatch(setActiveTab('map'));
    }
  }, [currentUser, activeTab, dispatch]);

  useEffect(() => {
    if (!currentUser?.notifications_enabled) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    void syncWebPushSubscription(
      () => ApiService.getPushVapidPublicKey(),
      sub => ApiService.subscribeWebPush(sub),
    );
  }, [currentUser?.id, currentUser?.notifications_enabled]);

  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    void (async () => {
      try {
        const { items } = await ApiService.getNotifications();
        if (!cancelled) setNotifications(items.filter(n => !n.deleted));
      } catch (e) {
        console.error('load notifications:', e);
      }
    })();
    return () => { cancelled = true; };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;
    let socket: WebSocket | null = null;

    (async () => {
      const token = await ApiService.resolveToken();
      if (cancelled || !token) return;

      const wsUrl = getWebSocketUrl(token);
      try {
        if (cancelled) return;
        socket = new WebSocket(wsUrl, getWebSocketProtocols(token));
        if (cancelled) {
          socket.close();
          return;
        }

        socket.onopen = () => setWsConnected(true);

        socket.onmessage = (event: MessageEvent<string>) => {
          try {
            const data = parseWebSocketMessage(JSON.parse(event.data));
            if (!data) return;

          switch (data.type) {
            case 'LIVE_TELEMETRY_UPDATE': {
              const updates = new Map(data.shipments.map(s => [s.id, s]));
              setSupplyLinks(prev => prev.map(link => {
                const update = updates.get(link.id);
                if (!update) return link;
                return {
                  ...link,
                  current_lat: update.current_lat ?? link.current_lat,
                  current_lng: update.current_lng ?? link.current_lng,
                  progress_pct: update.progress_pct ?? link.progress_pct,
                  speed_kmh: update.speed_kmh ?? link.speed_kmh,
                  status: update.status ?? link.status,
                  last_updated: new Date().toISOString(),
                };
              }));
              break;
            }
            case 'SHIPMENT_EVENT': {
              if (data.shipment) {
                setSupplyLinks(prev => prev.map(s => s.id === data.shipment_id ? data.shipment! : s));
              } else if (data.event.new_status) {
                setSupplyLinks(prev => prev.map(s =>
                  s.id === data.shipment_id
                    ? {
                      ...s,
                      status: data.event.new_status ?? s.status,
                      delay_reason: data.event.delay_reason ?? s.delay_reason,
                      eta: data.event.eta_after ?? s.eta,
                    }
                    : s,
                ));
              }
              break;
            }
            case 'SHIPMENT_STATUS_UPDATE': {
              setSupplyLinks(prev => prev.map(s =>
                s.id === data.shipment_id
                  ? { ...s, status: data.status, delay_reason: data.delay_reason }
                  : s
              ));
              // Bell notifications come via NOTIFICATION_NEW (persisted on server).
              break;
            }
            case 'CARGO_ARRIVED':
              // Persisted notifications arrive as NOTIFICATION_NEW.
              break;
            case 'MAP_DATA_IMPORTED':
              void loadServerData(currentUser);
              break;
            case 'PRODUCTS_UPDATED':
              void refreshProducts();
              break;
            case 'SALES_MANAGERS_UPDATED':
              void refreshSalesManagers();
              break;
            case 'CARRIERS_UPDATED':
              void refreshCarriers();
              break;
            case 'FACTORY_ADDED': {
              setFactories(prev => {
                const idx = prev.findIndex(f => f.id === data.factory.id);
                if (idx >= 0) {
                  const next = [...prev];
                  next[idx] = data.factory;
                  return next;
                }
                return [data.factory, ...prev];
              });
              break;
            }
            case 'FACTORY_UPDATED': {
              setFactories(prev => prev.map(f => (f.id === data.factory.id ? data.factory : f)));
              setDetailFactory(prev => (prev?.id === data.factory.id ? data.factory : prev));
              break;
            }
            case 'FACTORY_DELETED': {
              setFactories(prev => prev.filter(f => f.id !== data.factoryId));
              setDetailFactory(prev => (prev?.id === data.factoryId ? null : prev));
              setHighlightedFactoryId(prev => (prev === data.factoryId ? null : prev));
              break;
            }
            case 'SITES_IMPORTED':
              void loadServerData(currentUser);
              break;
            case 'SITES_MERGED':
              void loadServerData(currentUser);
              break;
            case 'CHAT_MESSAGE':
            case 'CHAT_READ':
              window.dispatchEvent(new CustomEvent('bars-chat-ws', { detail: data }));
              if (data.type === 'CHAT_MESSAGE') {
                const isOwn = data.message.sender_id === currentUser.id;
                if (!isOwn && currentUser.notifications_enabled) {
                  void showChatPushNotification({
                    conversationId: data.conversation_id,
                    senderName: data.message.sender_name,
                    body: data.message.body,
                    notificationsEnabled: currentUser.notifications_enabled,
                    isOwn: false,
                  });
                }
              }
              break;
            case 'NOTIFICATION_NEW': {
              const item = data.notification;
              if (item.deleted) break;
              setNotifications(prev => {
                if (prev.some(n => n.id === item.id)) {
                  return prev.map(n => (n.id === item.id ? item : n));
                }
                return [item, ...prev];
              });
              break;
            }
            case 'NOTIFICATION_UPDATED': {
              const item = data.notification;
              setNotifications(prev => {
                if (item.deleted) return prev.filter(n => n.id !== item.id);
                return prev.map(n => (n.id === item.id ? item : n));
              });
              break;
            }
            case 'TASK_BOARD_UPDATED':
            case 'TASK_UPDATED': {
              setTasksBoardSync(data.board);
              void ApiService.getKanbanBoards()
                .then(r => setTasksOpenCount(r.open_assigned))
                .catch(() => {});
              break;
            }
            case 'TASK_WORKSPACE_UPDATED': {
              setTasksBoardSync(data.board);
              setTasksWorkspaceRefresh({ taskId: data.task_id, key: Date.now() });
              break;
            }
            case 'TASK_BOARD_DELETED': {
              setTasksDeletedBoardId(data.board_id);
              void ApiService.getKanbanBoards()
                .then(r => setTasksOpenCount(r.open_assigned))
                .catch(() => {});
              break;
            }
            default:
              break;
          }
        } catch (e) {
          console.error('WS parse error:', e);
        }
      };

      socket.onclose = () => setWsConnected(false);
      } catch {
        setWsConnected(false);
      }
    })();

    return () => {
      cancelled = true;
      if (socket) socket.close();
      setWsConnected(false);
    };
  }, [currentUser, loadServerData, refreshProducts, refreshCarriers, refreshSalesManagers]);

  useEffect(() => {
    const onOpenTasks = (e: Event) => {
      setTasksDrawerOpen(true);
      const detail = (e as CustomEvent<{ taskId?: string; boardId?: string }>).detail;
      if (detail?.boardId) setTasksFocusBoardId(detail.boardId);
      if (detail?.taskId) setTasksFocusTaskId(detail.taskId);
    };
    window.addEventListener('bars-tasks-open', onOpenTasks);
    return () => window.removeEventListener('bars-tasks-open', onOpenTasks);
  }, []);

  useEffect(() => {
    const onOpenShipment = (e: Event) => {
      const detail = (e as CustomEvent<{ shipmentId?: string }>).detail;
      const id = detail?.shipmentId;
      if (!id) return;
      const shipment = supplyLinks.find(l => l.id === id);
      if (shipment) setSelectedShipment(shipment);
      goToTab('shipments');
    };
    window.addEventListener('bars-shipment-open', onOpenShipment);
    return () => window.removeEventListener('bars-shipment-open', onOpenShipment);
  }, [supplyLinks, goToTab]);

  useEffect(() => {
    if (!tasksBoardSync) return;
    const t = window.setTimeout(() => setTasksBoardSync(null), 0);
    return () => window.clearTimeout(t);
  }, [tasksBoardSync]);

  useEffect(() => {
    if (!tasksDeletedBoardId) return;
    const t = window.setTimeout(() => setTasksDeletedBoardId(null), 0);
    return () => window.clearTimeout(t);
  }, [tasksDeletedBoardId]);

  const handleShipmentUpdated = useCallback((shipment: SupplyLink) => {
    setSupplyLinks(prev => prev.map(s => s.id === shipment.id ? shipment : s));
    setSelectedShipment(prev => (prev?.id === shipment.id ? shipment : prev));
    setEditingShipment(prev => (prev?.id === shipment.id ? shipment : prev));
  }, []);

  const handleUpdateShipment = useCallback(async (id: string, payload: Record<string, unknown>) => {
    setShipmentSaving(true);
    try {
      const updated = await ApiService.updateShipment(id, payload);
      handleShipmentUpdated(updated);
      if (currentUser && canAccessLogs(currentUser.role)) {
        const logs = await ApiService.getLogs();
        setEventLogs(logs);
      }
      if (currentUser && canUploadData(currentUser.role)) {
        const cl = await ApiService.getShipmentChangeLogs();
        setChangeLogs(cl);
      }
    } finally {
      setShipmentSaving(false);
    }
  }, [handleShipmentUpdated, currentUser]);

  const handleShowShipmentOnMap = useCallback((shipment: SupplyLink) => {
    setSelectedShipment(shipment);
    setHighlightedFactoryId(shipment.origin_id);
    setFilters(prev => ({ ...prev, viewMode: 'shipments', searchQuery: '' }));
    dispatch(setActiveTab('map'));
  }, [dispatch]);

  const handleCreateShipment = async (data: Record<string, unknown>) => {
    const created = await ApiService.createShipment(data);
    setSupplyLinks(prev => [created, ...prev]);
    if (canUploadData(currentUser!.role)) {
      const cl = await ApiService.getShipmentChangeLogs();
      setChangeLogs(cl);
    }
  };

  const handleInternalShipmentsImported = useCallback(async (result?: ShipmentImportResult) => {
    const [links, facs] = await Promise.all([
      ApiService.getSupplyLinks(),
      ApiService.getFactories(),
    ]);
    setSupplyLinks(links);
    setFactories(facs);
    if (canUploadData(currentUser!.role)) {
      const cl = await ApiService.getShipmentChangeLogs();
      setChangeLogs(cl);
    }

    if (result && !result.skipped_file && (result.inserted > 0 || result.date_from)) {
      dispatch(setActiveTab('map'));
      setFilters(mapFiltersForImportedShipments(links));
    }
  }, [currentUser, dispatch]);

  const handleCsvPreviewFileLoaded = useCallback((entry: CsvPreviewFileEntry) => {
    setCsvPreviewFiles(prev => {
      const withoutDup = prev.filter(f => f.filename !== entry.filename);
      return [...withoutDup, entry];
    });
    setCsvPreviewActiveFileId(entry.id);
  }, []);

  const handleCsvPreviewSelectFile = useCallback((fileId: string | null) => {
    setCsvPreviewActiveFileId(fileId);
  }, []);

  const handleCsvPreviewRemoveFile = useCallback((fileId: string) => {
    setCsvPreviewFiles(prev => prev.filter(f => f.id !== fileId));
    setCsvPreviewActiveFileId(prevId => {
      if (prevId !== fileId) return prevId;
      setCsvPreviewActive(wasActive => {
        if (wasActive) {
          setCsvPreviewSavedFilters(saved => {
            if (saved) setFilters(saved);
            return null;
          });
        }
        return false;
      });
      return null;
    });
  }, []);

  const handleCsvPreviewShow = useCallback(() => {
    const file = csvPreviewFiles.find(f => f.id === csvPreviewActiveFileId);
    if (!file || file.links.length === 0) return;
    setCsvPreviewSavedFilters(prev => prev ?? { ...filters });
    setCsvPreviewActive(true);
    setFilters(mapFiltersForImportedShipments(file.links));
    setSelectedShipment(null);
    setSelectedRoute(null);
  }, [csvPreviewFiles, csvPreviewActiveFileId, filters]);

  const handleCsvPreviewRestore = useCallback(() => {
    setCsvPreviewActive(false);
    if (csvPreviewSavedFilters) {
      setFilters(csvPreviewSavedFilters);
      setCsvPreviewSavedFilters(null);
    } else {
      setFilters(createDefaultFilterState());
    }
    setSelectedShipment(null);
    setSelectedRoute(null);
  }, [csvPreviewSavedFilters]);

  const activeCsvPreviewFile = csvPreviewActive
    ? csvPreviewFiles.find(f => f.id === csvPreviewActiveFileId) ?? null
    : null;

  const mapFactories = activeCsvPreviewFile
    ? (() => {
        const byId = new Map(factories.map(f => [f.id, f]));
        for (const f of activeCsvPreviewFile.factories) {
          if (!byId.has(f.id)) byId.set(f.id, f);
        }
        return Array.from(byId.values());
      })()
    : factories;

  const mapSupplyLinks = activeCsvPreviewFile ? activeCsvPreviewFile.links : supplyLinks;

  const handleAddFactory = async (factory: Factory) => {
    try {
      const created = await ApiService.createFactory(factory);
      setFactories(prev => [created, ...prev.filter(f => f.id !== created.id)]);
    } catch (e) {
      await refreshFactories();
      throw e;
    }
    if (currentUser?.role === 'admin') {
      const logs = await ApiService.getLogs();
      setEventLogs(logs);
    }
  };

  const refreshFactories = useCallback(async () => {
    const data = await ApiService.getFactories();
    setFactories(data);
    setDetailFactory(prev => {
      if (!prev) return prev;
      return data.find(f => f.id === prev.id) ?? prev;
    });
  }, []);

  const handleSaveFactoryPosition = useCallback(async (factoryId: string, update: Partial<Factory>) => {
    const updated = await ApiService.updateFactory(factoryId, update);
    if (!updated) throw new Error(t('common.factoryNotFound'));
    setFactories(prev => prev.map(f => (f.id === factoryId || f.id === updated.id ? updated : f)));
    setDetailFactory(prev => (prev?.id === factoryId || prev?.id === updated.id ? updated : prev));
  }, [t]);

  const handleSaveFactoryType = useCallback(async (factoryId: string, type: FactoryType) => {
    await handleSaveFactoryPosition(factoryId, { type });
  }, [handleSaveFactoryPosition]);

  const handleEditFactoryPosition = useCallback((factory: Factory) => {
    setDetailFactory(null);
    setHighlightedFactoryId(factory.id);
    setFilters(prev => ({ ...prev, viewMode: 'sites', searchQuery: '' }));
    dispatch(setActiveTab('map'));
    setPendingPositionEditId(factory.id);
  }, [dispatch]);

  const handleShowSiteOnMap = useCallback((factory: Factory) => {
    setHighlightedFactoryId(factory.id);
    setDetailFactory(null);
    setFilters(prev => ({ ...prev, viewMode: 'sites', searchQuery: '' }));
    dispatch(setActiveTab('map'));
  }, [dispatch]);

  const handleViewFactoryDetails = useCallback((factory: Factory) => {
    setDetailFactory(factory);
    setHighlightedFactoryId(factory.id);
  }, []);

  const handleGlobalSearchTab = useCallback((tab: string) => {
    goToTab(tab as AppTab);
  }, [goToTab]);

  const handleGlobalSearchFactory = useCallback((factory: Factory) => {
    handleViewFactoryDetails(factory);
    dispatch(setActiveTab('map'));
    setFilters(prev => ({ ...prev, viewMode: 'sites', searchQuery: factory.name }));
  }, [dispatch, handleViewFactoryDetails]);

  const handleGlobalSearchShipment = useCallback((shipment: SupplyLink) => {
    setSelectedShipment(shipment);
    setHighlightedFactoryId(shipment.origin_id);
    dispatch(setActiveTab('map'));
    setFilters(prev => ({ ...prev, viewMode: 'shipments', searchQuery: shipment.cargo_type }));
  }, [dispatch]);

  const handleGlobalSearchBoard = useCallback((boardId: string) => {
    setTasksDrawerOpen(true);
    setTasksFocusBoardId(boardId);
  }, []);

  const handleCreateBackup = async () => {
    const newBkp = await ApiService.createBackup();
    setBackups(prev => [newBkp, ...prev]);
    const logs = await ApiService.getLogs();
    setEventLogs(logs);
  };

  const handleSyncCarrier = async (carrierId: string) => {
    try {
      const updated = await ApiService.syncCarrier(carrierId);
      if (updated) {
        setCarriers(prev => prev.map(c => c.id === carrierId ? updated : c));
        const logs = await ApiService.getLogs();
        setEventLogs(logs);
      }
    } catch (e) {
      const err = e as Error & { data?: ThirdPartyCarrier };
      if (err.data) setCarriers(prev => prev.map(c => c.id === carrierId ? err.data! : c));
      alert(e instanceof Error ? e.message : t('common.syncFailed'));
    }
  };

  const handleSaveTelegramSettings = async (settings: IntegrationSettingsResponse['telegram']) => {
    const saved = await ApiService.updateTelegramSettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, telegram: saved } : prev));
  };

  const handleSaveMailSettings = async (settings: IntegrationSettingsResponse['mail']) => {
    const saved = await ApiService.updateMailSettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, mail: saved } : prev));
  };

  const handleSaveCloudSettings = async (settings: IntegrationSettingsResponse['cloud']) => {
    const saved = await ApiService.updateCloudSettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, cloud: saved } : prev));
  };

  const handleSaveTelemetrySettings = async (settings: IntegrationSettingsResponse['telemetry']) => {
    const saved = await ApiService.updateTelemetrySettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, telemetry: saved } : prev));
  };

  const handleSaveMapDataSettings = async (settings: IntegrationSettingsResponse['mapData']) => {
    const saved = await ApiService.updateMapDataSettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, mapData: saved } : prev));
    return saved;
  };

  const handleSaveGeocodingSettings = async (settings: IntegrationSettingsResponse['geocoding']) => {
    const saved = await ApiService.updateGeocodingSettings(settings);
    setIntegrationSettings(prev => (prev ? { ...prev, geocoding: saved } : prev));
    return saved;
  };

  const handleMapDataImported = async () => {
    if (!currentUser) return;
    const facs = await ApiService.getFactories();
    setFactories(facs);
    const links = await ApiService.getSupplyLinks();
    setSupplyLinks(links);
    const settings = await ApiService.getIntegrationSettings();
    if (settings) setIntegrationSettings(settings);
    const logs = await ApiService.getLogs();
    if (logs.length > 0) setEventLogs(logs);
  };

  const handleSaveCarrierSettings = async (id: string, data: CarrierSettingsUpdate) => {
    const updated = await ApiService.updateCarrierSettings(id, data);
    setCarriers(prev => prev.map(c => c.id === id ? updated : c));
    await refreshCarriers();
  };

  const refreshBackups = async () => {
    const bkps = await ApiService.getBackups();
    setBackups(bkps);
  };

  const handleMarkNotificationRead = useCallback(async (id: string) => {
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    try {
      const updated = await ApiService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => (n.id === id ? updated : n)));
    } catch (e) {
      console.error('mark notification read:', e);
    }
  }, []);

  const handleDeleteNotification = useCallback(async (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try {
      await ApiService.deleteNotification(id);
    } catch (e) {
      console.error('delete notification:', e);
      const { items } = await ApiService.getNotifications();
      setNotifications(items.filter(n => !n.deleted));
    }
  }, []);

  const handleMarkAllNotificationsRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try {
      const items = await ApiService.markAllNotificationsRead();
      setNotifications(items.filter(n => !n.deleted));
    } catch (e) {
      console.error('mark all notifications read:', e);
    }
  }, []);

  const handleClearAllNotifications = useCallback(async () => {
    setNotifications([]);
    try {
      await ApiService.clearAllNotifications();
    } catch (e) {
      console.error('clear notifications:', e);
    }
  }, []);

  const handleSendTelegram = async (message: string, chatId?: string) => {
    await ApiService.sendTelegramNotification(message, chatId);
    const logs = await ApiService.getLogs();
    setEventLogs(logs);
  };

  if (!authChecked) {
    return (
      <div className="h-full min-h-0 bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    if (isPortalEmbed() || portalAwaitingLogin) {
      return (
        <div className="h-full min-h-0 bg-transparent flex flex-col items-center justify-center text-slate-400 text-sm px-6 text-center gap-2">
          <p>{t('auth.portalAwaitingLogin')}</p>
        </div>
      );
    }
    return <LoginPage onLogin={handleLogin} onPortalLogin={handlePortalLogin} />;
  }

  return (
    <div className="app-shell bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans selection:bg-indigo-500 selection:text-white">
      <SkipLink targetId="main-content" label={t('a11y.skipToContent')} />

      <Header
        activeTab={activeTab}
        setActiveTab={goToTab}
        currentUser={currentUser}
        onLogout={handleLogout}
        wsConnected={wsConnected}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
        onDeleteNotification={handleDeleteNotification}
        onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
        onClearAllNotifications={handleClearAllNotifications}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenGlobalSearch={() => setGlobalSearchOpen(true)}
        onOpenTasks={() => setTasksDrawerOpen(true)}
        tasksOpenCount={tasksOpenCount}
        onOpenActiveShipments={() => setActiveShipmentsDrawerOpen(true)}
        activeShipmentsCount={activeShipmentsCount}
        hideDesktopQuickActions={activeTab !== 'map'}
      />

      {activeTab !== 'map' ? (
        <AppSideRail
          notifications={notifications}
          onMarkNotificationRead={handleMarkNotificationRead}
          onDeleteNotification={handleDeleteNotification}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          onClearAllNotifications={handleClearAllNotifications}
          onOpenTasks={() => setTasksDrawerOpen(true)}
          tasksOpenCount={tasksOpenCount}
          onOpenActiveShipments={() => setActiveShipmentsDrawerOpen(true)}
          activeShipmentsCount={activeShipmentsCount}
          chatUnread={chatUnread}
          chatOpen={chatOpen}
          onToggleChat={() => {
            window.dispatchEvent(new CustomEvent('bars-chat-toggle'));
          }}
        />
      ) : null}

      <main id="main-content" className="flex-1 min-h-0 relative overflow-hidden" tabIndex={-1}>
        <Suspense fallback={
          <div className="h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" aria-label={t('common.loading')} />
          </div>
        }>
        {activeTab === 'map' && (
          <div className="absolute inset-0">
            <LogisticsMap
              {...({
                factories: mapFactories,
                supplyLinks: mapSupplyLinks,
                products: activeProducts(products),
                carriers: activeCarriers(carriers),
                salesManagers: activeSalesManagers(salesManagers),
                filters,
                setFilters,
                highlightedFactoryId,
                onHighlightFactory: setHighlightedFactoryId,
                onOpenFactoryDetails: handleViewFactoryDetails,
                selectedShipment,
                onSelectShipment: setSelectedShipment,
                selectedRoute,
                onSelectRoute: setSelectedRoute,
                currentUser,
                canEditPosition: currentUser ? canEditSiteDirectory(currentUser.role) : false,
                canEditType: currentUser ? canEditSiteDirectory(currentUser.role) : false,
                onSaveFactoryPosition: handleSaveFactoryPosition,
                onSaveFactoryType: handleSaveFactoryType,
                pendingPositionEditId,
                onPendingPositionEditHandled: () => setPendingPositionEditId(null),
                mobileSearchOpen: mapMobileSearchOpen,
                onMobileSearchOpenChange: setMapMobileSearchOpen,
                csvPreviewFiles,
                csvPreviewActiveFileId,
                csvPreviewActive,
                onCsvPreviewFileLoaded: handleCsvPreviewFileLoaded,
                onCsvPreviewSelectFile: handleCsvPreviewSelectFile,
                onCsvPreviewRemoveFile: handleCsvPreviewRemoveFile,
                onCsvPreviewShow: handleCsvPreviewShow,
                onCsvPreviewRestore: handleCsvPreviewRestore,
              } satisfies LogisticsMapProps)}
            />
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="h-full scroll-area">
          <KpiDashboard
            factories={factories}
            supplyLinks={supplyLinks}
            products={activeProducts(products)}
            salesManagers={activeSalesManagers(salesManagers)}
            currentUser={currentUser}
            onSelectShipment={setSelectedShipment}
          />
          </div>
        )}

        {activeTab === 'shipments' && (
          <div className="h-full scroll-area">
          <ShipmentsList
            supplyLinks={supplyLinks}
            factories={factories}
            products={activeProducts(products)}
            onSelectShipment={setSelectedShipment}
            onEditShipment={setEditingShipment}
            onShowOnMap={handleShowShipmentOnMap}
            onShipmentUpdated={handleShipmentUpdated}
            currentUser={currentUser}
          />
          </div>
        )}

        {activeTab === 'factories' && (
          <div className="h-full scroll-area">
          <FactoriesList
            factories={factories}
            supplyLinks={supplyLinks}
            onSelectFactory={handleViewFactoryDetails}
            onAddFactory={handleAddFactory}
            currentUserRole={currentUser.role}
            canEdit={canEditSiteDirectory(currentUser.role)}
            onSitesChanged={refreshFactories}
          />
          </div>
        )}

        {activeTab === 'sites' && (
          <div className="h-full scroll-area">
            <SiteDirectoryPage
              factories={factories}
              onViewDetails={handleViewFactoryDetails}
              onShowOnMap={handleShowSiteOnMap}
              canEdit={canEditSiteDirectory(currentUser.role)}
              onSitesChanged={refreshFactories}
            />
          </div>
        )}

        {activeTab === 'carriers' && (
          <div className="h-full scroll-area">
            <CarrierDirectoryPage
              carriers={carriers}
              canManage={canManageCarriers(currentUser.role)}
              onCarriersChanged={refreshCarriers}
              onSyncCarrier={canManageCarriers(currentUser.role) ? handleSyncCarrier : undefined}
              onSaveCarrierSettings={canManageCarriers(currentUser.role) ? handleSaveCarrierSettings : undefined}
            />
          </div>
        )}

        {activeTab === 'products' && canManageProducts(currentUser.role) && (
          <div className="h-full scroll-area">
            <ProductCatalogPage
              products={products}
              onProductsChanged={refreshProducts}
            />
          </div>
        )}

        {activeTab === 'managers' && (
          <div className="h-full scroll-area">
            <ManagerDirectoryPage
              managers={salesManagers}
              canManage={canManageSalesManagers(currentUser.role)}
              onManagersChanged={refreshSalesManagers}
            />
          </div>
        )}

        {activeTab === 'rzd-analytics' && (
          <div className="h-full min-h-0 overflow-hidden">
            <RzdAnalyticsPage currentUser={currentUser} />
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="h-full scroll-area" data-admin-scroll>
          <AdminPanel
            carriers={carriers}
            backups={backups}
            users={adminUsers}
            integrationSettings={integrationSettings}
            onSyncCarrier={handleSyncCarrier}
            onSendTelegram={handleSendTelegram}
            onSaveTelegramSettings={handleSaveTelegramSettings}
            onSaveMailSettings={handleSaveMailSettings}
            onSaveCloudSettings={handleSaveCloudSettings}
            onSaveTelemetrySettings={handleSaveTelemetrySettings}
            onSaveCarrierSettings={handleSaveCarrierSettings}
            onCreateBackup={handleCreateBackup}
            onRefreshBackups={refreshBackups}
            onSaveMapDataSettings={handleSaveMapDataSettings}
            onSaveGeocodingSettings={handleSaveGeocodingSettings}
            onMapDataImported={handleMapDataImported}
            currentUserId={currentUser.id}
            onRefreshUsers={refreshAdminUsers}
            onSitesChanged={refreshFactories}
            factoriesCount={factories.length}
          />
          </div>
        )}

        {activeTab === 'mydata' && (
          <div className="h-full scroll-area">
            <MyDataPanel
              {...({
                user: currentUser,
                factories,
                shipments: supplyLinks,
                products: activeProducts(products),
                carriers: activeCarriers(carriers),
                salesManagers: activeSalesManagers(salesManagers),
                onCreate: handleCreateShipment,
                onImported: handleInternalShipmentsImported,
                changeLogs,
              } satisfies MyDataPanelProps)}
            />
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="h-full scroll-area">
          <AuditLogs logs={eventLogs} />
          </div>
        )}
        </Suspense>
      </main>

      <FacilityModal
        factory={detailFactory}
        onClose={() => setDetailFactory(null)}
        supplyLinks={supplyLinks}
        allFactories={factories}
        onSelectShipment={setSelectedShipment}
        canEditPosition={currentUser ? canEditSiteDirectory(currentUser.role) : false}
        canEditType={currentUser ? canEditSiteDirectory(currentUser.role) : false}
        onSaveFactoryType={handleSaveFactoryType}
        onEditPosition={handleEditFactoryPosition}
      />

      <ShipmentModal
        shipment={selectedShipment}
        onClose={() => setSelectedShipment(null)}
        factories={factories}
        supplyLinks={supplyLinks}
        products={products}
        onShipmentUpdated={handleShipmentUpdated}
        currentUser={currentUser}
        canEdit={currentUser ? canEditShipmentStatus(currentUser.role) : false}
        onEdit={(shipment) => {
          setSelectedShipment(null);
          setEditingShipment(shipment);
          dispatch(setActiveTab('shipments'));
        }}
        onShowOnMap={handleShowShipmentOnMap}
      />

      {editingShipment && currentUser && (
        <ShipmentEditModal
          shipment={editingShipment}
          factories={factories}
          products={products}
          carriers={carriers}
          salesManagers={salesManagers}
          currentUser={currentUser}
          saving={shipmentSaving}
          onClose={() => setEditingShipment(null)}
          onSave={handleUpdateShipment}
        />
      )}

      <RouteDetailModal
        {...({
          route: selectedRoute,
          factories,
          products,
          user: currentUser,
          onClose: () => setSelectedRoute(null),
          onSelectShipment: (id: string) => {
            const s = supplyLinks.find(l => l.id === id);
            if (s) {
              setSelectedRoute(null);
              setSelectedShipment(s);
            }
          },
        } satisfies RouteDetailModalProps)}
      />

      {isExportModalOpen && currentUser && (
        <Suspense fallback={null}>
          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            factories={factories}
            supplyLinks={supplyLinks}
            currentUser={currentUser}
          />
        </Suspense>
      )}

      {currentUser && (
        <ChatWidget
          currentUser={currentUser}
          hideLauncher={activeTab !== 'map'}
          onUnreadChange={setChatUnread}
          onOpenChange={setChatOpen}
        />
      )}
      {currentUser ? (
        <TasksDrawer
          open={tasksDrawerOpen}
          onClose={() => setTasksDrawerOpen(false)}
          currentUser={currentUser}
          openAssignedCount={tasksOpenCount}
          onOpenAssignedCountChange={setTasksOpenCount}
          boardSync={tasksBoardSync}
          deletedBoardId={tasksDeletedBoardId}
          focusTaskId={tasksFocusTaskId}
          focusBoardId={tasksFocusBoardId}
          onFocusTaskConsumed={() => setTasksFocusTaskId(null)}
          onFocusBoardConsumed={() => setTasksFocusBoardId(null)}
          workspaceRefresh={tasksWorkspaceRefresh}
        />
      ) : null}
      {currentUser ? (
        <ActiveShipmentsDrawer
          open={activeShipmentsDrawerOpen}
          onClose={() => setActiveShipmentsDrawerOpen(false)}
          supplyLinks={supplyLinks}
          factories={factories}
          currentUser={currentUser}
          onSelectShipment={setSelectedShipment}
          onShowOnMap={handleShowShipmentOnMap}
        />
      ) : null}
      {currentUser ? (
        <GlobalSearchPanel
          open={globalSearchOpen}
          onClose={() => setGlobalSearchOpen(false)}
          user={currentUser}
          navItems={globalSearchNavItems}
          factories={factories}
          supplyLinks={supplyLinks}
          products={activeProducts(products)}
          carriers={activeCarriers(carriers)}
          salesManagers={activeSalesManagers(salesManagers)}
          onSelectTab={handleGlobalSearchTab}
          onSelectFactory={handleGlobalSearchFactory}
          onSelectShipment={handleGlobalSearchShipment}
          onSelectBoard={handleGlobalSearchBoard}
        />
      ) : null}

      <div id="chat-portal-root" aria-hidden="true" />
    </div>
  );
}
