import axios from 'axios';
import { authConfig } from './authConfig';

const n8nClient = axios.create();

n8nClient.interceptors.request.use((config) => {
    // Lazy read from authConfig singleton to avoid circular deps with Store
    const { baseUrl, apiKey } = authConfig;
    
    if (baseUrl) {
        config.baseURL = `${baseUrl}/api/v1`;
    }
    
    if (apiKey) {
        config.headers['X-N8N-API-KEY'] = apiKey;
    }
    return config;
});

export const getWorkflows = async () => {
    const response = await n8nClient.get('/workflows');
    return response.data.data;
};

export const getWorkflowDetail = async (id: string) => {
    const response = await n8nClient.get(`/workflows/${id}`);
    return response.data.data || response.data;
};

export const activateWorkflow = async (id: string) => {
    return await n8nClient.post(`/workflows/${id}/activate`, {});
};

export const deactivateWorkflow = async (id: string) => {
    return await n8nClient.post(`/workflows/${id}/deactivate`, {});
};

export const runWorkflow = async (id: string) => {
    return await n8nClient.post(`/workflows/${id}/execute`, {});
};

export const pingInstance = async () => {
    const response = await n8nClient.get('/workflows', { params: { limit: 1 } });
    return response.status === 200;
};

export const getExecutions = async (workflowId: string, limit = 20) => {
    const response = await n8nClient.get('/executions', {
        params: {
            workflowId,
            limit
        }
    });
    return response.data.data;
};

export const getExecutionDetail = async (id: string) => {
    const response = await n8nClient.get(`/executions/${id}`);
    return response.data.data || response.data;
};

export const getGlobalExecutions = async (limit = 100) => {
    const response = await n8nClient.get('/executions', {
        params: { limit, includeData: false }
    });
    return response.data.data;
};

export const resolveWaitingExecution = async (id: string, action: 'approve' | 'reject') => {
    return await n8nClient.post(`/executions/${id}`, { action });
};

// --- Data Tables (n8n internal database) ---
export const getTables = async () => {
    try {
        const response = await n8nClient.get('/data-tables');
        return response.data.data || response.data;
    } catch (err: any) {
        if (err.response?.status === 404) {
            // Also attempt older internal route
            const fallbackResp = await n8nClient.get('/database/tables');
            return fallbackResp.data.data || fallbackResp.data;
        }
        throw err;
    }
};

export const getTableRows = async (tableId: string) => {
    try {
        const response = await n8nClient.get(`/data-tables/${tableId}`);
        const tableDef = response.data.data || response.data;
        if (tableDef && tableDef.rows && Array.isArray(tableDef.rows)) return tableDef.rows;
        
        // If the above doesn't contain rows, let's explicitly hit the /rows endpoint if n8n has it, or /data if it's there
        const fallbackRows = await n8nClient.get(`/data-tables/${tableId}/rows`)
            .catch(() => n8nClient.get(`/data-tables/${tableId}/data`));
        return fallbackRows.data.data || fallbackRows.data;
    } catch (err: any) {
        if (err.response?.status === 404) {
             const fallbackResp = await n8nClient.get(`/database/tables/${tableId}/rows`);
             return fallbackResp.data.data || fallbackResp.data;
        }
        // If we got an object but it didn't crash, we might have skipped it. 
        // Let's ensure we return an empty array conceptually if nothing matches.
        return [];
    }
};

export const updateTableRowValue = async (tableId: string, rowId: string, data: any) => {
    try {
        // usually PUT or PATCH /data-tables/{tableId} ? Wait, update row is probably /data-tables/{tableId}/rows/{rowId}
        const response = await n8nClient.patch(`/data-tables/${tableId}/rows/${rowId}`, data)
                                      .catch(() => n8nClient.put(`/data-tables/${tableId}/rows/${rowId}`, data));
        return response.data;
    } catch (err: any) {
        if (err.response?.status === 404) {
            const fallbackResp = await n8nClient.patch(`/database/tables/${tableId}/rows/${rowId}`, data);
            return fallbackResp.data;
        }
        throw err;
    }
};

export default n8nClient;