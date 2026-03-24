import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import * as Haptics from 'expo-haptics';
import { 
    getWorkflows, 
    getWorkflowDetail,
    activateWorkflow, 
    deactivateWorkflow, 
    runWorkflow,
    getExecutions,
    getGlobalExecutions,
    resolveWaitingExecution,
    getTables,
    getTableRows,
    updateTableRowValue
} from '../api/n8nClient';
import { setAuthConfig } from '../api/authConfig';

export interface Execution {
    id: string;
    status: string;
    mode: string;
    startedAt: string;
    stoppedAt: string | null;
}

export interface Workflow {
    id: string;
    name: string;
    active: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface N8nInstance {
    id: string;
    name: string;
    baseUrl: string;
}

interface N8nState {
    // Multi-instance state
    instances: N8nInstance[];
    activeInstanceId: string | null;
    isHydrated: boolean; // Flag to prevent premature API calls
    loadingCredentials: boolean;

    // Active instance data
    workflows: Workflow[];
    loading: boolean;
    error: string | null;
    executingWorkflows: Record<string, boolean>;
    latency: number | null;
    statusMessage: { text: string; type: 'success' | 'error' | 'info' } | null;
    
    // Workflow detail state
    selectedWorkflowId: string | null;
    selectedWorkflowDetail: any | null;
    detailLoading: boolean;
    executions: Record<string, Execution[]>;
    executionsLoading: boolean;

    // Analytics state
    globalExecutions: Execution[];
    globalExecutionsLoading: boolean;
    selectedExecutionErrorId: string | null;
    
    // Data Tables state
    tables: any[];
    tablesLoading: boolean;
    tableRows: Record<string, any[]>;
    tableRowsLoading: boolean;

    // Actions
    addInstance: (name: string, url: string, apiKey: string) => Promise<void>;
    switchInstance: (id: string, isInitialLoad?: boolean) => Promise<void>;
    removeInstance: (id: string) => Promise<void>;
    loadInstances: () => Promise<void>;
    
    fetchWorkflows: () => Promise<void>;
    toggleWorkflow: (id: string, currentStatus: boolean) => Promise<void>;
    executeWorkflow: (id: string) => Promise<void>;
    checkInstanceHealth: () => Promise<void>;
    clearStatusMessage: () => void;
    fetchWorkflowDetail: (id: string) => Promise<void>;
    fetchExecutions: (workflowId: string) => Promise<void>;
    fetchGlobalExecutions: () => Promise<void>;
    setSelectedExecutionErrorId: (id: string | null) => void;
    resolveExecution: (executionId: string, action: 'approve' | 'reject') => Promise<void>;
    
    // Data Tables Actions
    fetchTables: () => Promise<void>;
    fetchTableRows: (tableId: string) => Promise<void>;
    updateTableRow: (tableId: string, rowId: string, data: any) => Promise<void>;
}

export const useN8nStore = create<N8nState>((set, get) => ({
    instances: [],
    activeInstanceId: null,
    isHydrated: false,
    loadingCredentials: true,

    workflows: [],
    loading: false,
    error: null,
    executingWorkflows: {},
    latency: null,
    statusMessage: null,

    selectedWorkflowId: null,
    selectedWorkflowDetail: null,
    detailLoading: false,
    executions: {},
    executionsLoading: false,

    globalExecutions: [],
    globalExecutionsLoading: false,
    selectedExecutionErrorId: null,

    tables: [],
    tablesLoading: false,
    tableRows: {},
    tableRowsLoading: false,

    loadInstances: async () => {
        set({ loadingCredentials: true, isHydrated: false });
        try {
            const instancesJson = await SecureStore.getItemAsync('n8n_instances_list');
            const activeId = await SecureStore.getItemAsync('n8n_active_id');
            
            const instances: N8nInstance[] = instancesJson ? JSON.parse(instancesJson) : [];
            set({ instances, activeInstanceId: activeId });

            if (activeId) {
                await get().switchInstance(activeId, true);
            }
        } catch (err) {
            console.error('Failed to load instances:', err);
        } finally {
            set({ loadingCredentials: false, isHydrated: true });
        }
    },

    addInstance: async (name: string, url: string, apiKey: string) => {
        set({ loading: true });
        try {
            let normalizedUrl = url.trim();
            if (!normalizedUrl.startsWith('http')) normalizedUrl = `https://${normalizedUrl}`;
            if (normalizedUrl.endsWith('/')) normalizedUrl = normalizedUrl.slice(0, -1);

            const newInstance: N8nInstance = {
                id: Math.random().toString(36).substring(7),
                name: name.trim() || 'My n8n',
                baseUrl: normalizedUrl
            };

            const updatedInstances = [...get().instances, newInstance];
            
            await SecureStore.setItemAsync('n8n_instances_list', JSON.stringify(updatedInstances));
            await SecureStore.setItemAsync(`n8n_api_key_${newInstance.id}`, apiKey);

            set({ instances: updatedInstances });
            await get().switchInstance(newInstance.id);
            
            set({ statusMessage: { text: 'Instance added successfully', type: 'success' } });
        } catch (err) {
            set({ statusMessage: { text: 'Failed to add instance', type: 'error' } });
        } finally {
            set({ loading: false });
        }
    },

    switchInstance: async (id: string, isInitialLoad = false) => {
        const instance = get().instances.find(i => i.id === id);
        if (!instance) return;

        set({ loadingCredentials: true, workflows: [], globalExecutions: [], error: null });
        try {
            const apiKey = await SecureStore.getItemAsync(`n8n_api_key_${id}`);
            if (apiKey) {
                // Critical: sync authConfig BEFORE any other call
                setAuthConfig(instance.baseUrl, apiKey);
                
                if (!isInitialLoad) {
                    await SecureStore.setItemAsync('n8n_active_id', id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                
                set({ activeInstanceId: id });
                
                // Fetch context
                await get().fetchWorkflows();
                await get().fetchGlobalExecutions();
                await get().checkInstanceHealth();
            } else {
                throw new Error('API Key not found');
            }
        } catch (err) {
            set({ error: 'Failed to switch instance' });
        } finally {
            set({ loadingCredentials: false });
        }
    },

    removeInstance: async (id: string) => {
        try {
            const updatedInstances = get().instances.filter(i => i.id !== id);
            await SecureStore.setItemAsync('n8n_instances_list', JSON.stringify(updatedInstances));
            await SecureStore.deleteItemAsync(`n8n_api_key_${id}`);

            set({ instances: updatedInstances });

            if (get().activeInstanceId === id) {
                await SecureStore.deleteItemAsync('n8n_active_id');
                set({ activeInstanceId: null, workflows: [] });
                setAuthConfig(null, null);
            }
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err) {
            set({ statusMessage: { text: 'Failed to remove instance', type: 'error' } });
        }
    },

    fetchWorkflows: async () => {
        const state = get();
        if (!state.activeInstanceId) return;

        set({ loading: true, error: null });
        try {
            const workflows = await getWorkflows();
            set({ workflows, loading: false });
        } catch (err: any) {
            set({ error: err.message || 'Connection Error', loading: false });
        }
    },

    toggleWorkflow: async (id: string, currentStatus: boolean) => {
        try {
            if (currentStatus) {
                await deactivateWorkflow(id);
            } else {
                await activateWorkflow(id);
            }
            
            set((state) => ({
                workflows: state.workflows.map((w) =>
                    w.id === id ? { ...w, active: !currentStatus } : w
                ),
                statusMessage: { 
                    text: `Workflow ${!currentStatus ? 'activated' : 'deactivated'}`, 
                    type: 'success' 
                }
            }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Update failed';
            console.error('Toggle Workflow Error:', err.response?.status, err.response?.data || err.message);
            set({ statusMessage: { text: errorMsg, type: 'error' } });
        }
    },

    executeWorkflow: async (id: string) => {
        set((state) => ({ 
            executingWorkflows: { ...state.executingWorkflows, [id]: true } 
        }));
        try {
            await runWorkflow(id);
            set({ statusMessage: { text: 'Execution started', type: 'success' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            const errorMsg = err.response?.data?.message || err.message || 'Execution failed';
            console.error('Execute Workflow Error:', err.response?.status, err.response?.data || err.message);
            set({ statusMessage: { text: errorMsg, type: 'error' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            set((state) => ({ 
                executingWorkflows: { ...state.executingWorkflows, [id]: false } 
            }));
        }
    },

    checkInstanceHealth: async () => {
        if (!get().activeInstanceId) return;

        const start = Date.now();
        try {
            await getWorkflows();
            const end = Date.now();
            set({ latency: end - start, error: null });
        } catch (err) {
            set({ latency: -1, error: 'Instance unreachable' });
        }
    },

    clearStatusMessage: () => set({ statusMessage: null }),

    setSelectedWorkflowId: (id: string | null) => {
        set({ selectedWorkflowId: id, selectedWorkflowDetail: null });
    },

    setSelectedExecutionErrorId: (id: string | null) => {
        set({ selectedExecutionErrorId: id });
    },

    fetchWorkflowDetail: async (id: string) => {
        set({ detailLoading: true });
        try {
            const detail = await getWorkflowDetail(id);
            set({ selectedWorkflowDetail: detail });
        } catch (err) {
            console.error('Fetch Detail Error:', err);
            set({ statusMessage: { text: 'Failed to load details', type: 'error' } });
        } finally {
            set({ detailLoading: false });
        }
    },

    fetchExecutions: async (workflowId: string) => {
        // Double check hydration/credentials before fetching to avoid 400s
        if (!get().activeInstanceId) return;

        set({ executionsLoading: true });
        try {
            const data = await getExecutions(workflowId);
            set((state) => ({
                executions: {
                    ...state.executions,
                    [workflowId]: data
                }
            }));
        } catch (err) {
            console.error('Fetch Executions Error:', err);
        } finally {
            set({ executionsLoading: false });
        }
    },

    fetchGlobalExecutions: async () => {
        if (!get().activeInstanceId) return;

        set({ globalExecutionsLoading: true });
        try {
            const data = await getGlobalExecutions(100);
            set({ globalExecutions: data });
        } catch (err) {
            console.error('Fetch Global Executions Error:', err);
        } finally {
            set({ globalExecutionsLoading: false });
        }
    },

    resolveExecution: async (executionId: string, action: 'approve' | 'reject') => {
        set({ globalExecutionsLoading: true });
        try {
            await resolveWaitingExecution(executionId, action);
            set({ statusMessage: { text: `Execution ${action}d successfully`, type: 'success' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await get().fetchGlobalExecutions();
        } catch (err: any) {
            console.error('Resolve Execution Error:', err);
            set({ statusMessage: { text: 'Failed to resolve execution', type: 'error' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            set({ globalExecutionsLoading: false });
        }
    },

    fetchTables: async () => {
        if (!get().activeInstanceId) return;
        set({ tablesLoading: true });
        try {
            const data = await getTables();
            set({ tables: data });
        } catch (err) {
            console.error('Fetch Tables Error:', err);
        } finally {
            set({ tablesLoading: false });
        }
    },

    fetchTableRows: async (tableId: string) => {
        if (!get().activeInstanceId) return;
        set({ tableRowsLoading: true });
        try {
            const data = await getTableRows(tableId);
            set((state) => ({
                tableRows: { ...state.tableRows, [tableId]: data }
            }));
        } catch (err) {
            console.error('Fetch Table Rows Error:', err);
        } finally {
            set({ tableRowsLoading: false });
        }
    },

    updateTableRow: async (tableId: string, rowId: string, updatedData: any) => {
        try {
            // Optimistic Update
            set((state) => {
                const currentRows = state.tableRows[tableId] || [];
                const newRows = currentRows.map(row => 
                    row.id === rowId ? { ...row, ...updatedData } : row
                );
                return { tableRows: { ...state.tableRows, [tableId]: newRows } };
            });

            await updateTableRowValue(tableId, rowId, updatedData);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Reload from server to ensure sync
            await get().fetchTableRows(tableId);
        } catch (err) {
            console.error('Update Table Row Error:', err);
            set({ statusMessage: { text: 'Failed to update row', type: 'error' } });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    },
}));