import React from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity 
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useN8nStore } from '../store/useN8nStore';
import { getExecutionDetail } from '../api/n8nClient';
import * as Haptics from 'expo-haptics';

export const ExecutionList: React.FC = () => {
    const route = useRoute<any>();
    const workflowId = route.params?.workflow?.id;
    
    // Core state selectors
    const isHydrated = useN8nStore(state => state.isHydrated);
    const activeInstanceId = useN8nStore(state => state.activeInstanceId);
    const executions = useN8nStore(state => state.executions[workflowId]);
    const loading = useN8nStore(state => state.executionsLoading);
    const fetchExecutions = useN8nStore(state => state.fetchExecutions);
    
    // Drilldown state
    const navigation = useNavigation<any>();
    const [fetchingDetailId, setFetchingDetailId] = React.useState<string | null>(null);

    React.useEffect(() => {
        // Prevent race condition: only fetch if hydrated and we have an active instance
        if (workflowId && isHydrated && activeInstanceId) {
            fetchExecutions(workflowId);
        }
    }, [workflowId, isHydrated, activeInstanceId]);

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'success': return '#00C7B7';
            case 'error':
            case 'failed': return '#EF4444';
            case 'running': return '#3182CE';
            default: return '#718096';
        }
    };

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        } catch (e) {
            return 'Unknown';
        }
    };

    const handlePress = async (item: any) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setFetchingDetailId(item.id);
        try {
            const detail = await getExecutionDetail(item.id);
            navigation.navigate('ExecutionDetail', { detail });
        } catch (error) {
            console.error('Failed to fetch execution detail', error);
        } finally {
            setFetchingDetailId(null);
        }
    };

    const renderItem = ({ item }: { item: any }) => {
        const duration = item.stoppedAt 
            ? Math.round((new Date(item.stoppedAt).getTime() - new Date(item.startedAt).getTime()) / 1000)
            : null;
            
        const isFetching = fetchingDetailId === item.id;

        return (
            <TouchableOpacity 
                style={styles.executionCard}
                onPress={() => handlePress(item)}
                disabled={isFetching}
            >
                <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(item.status) }]} />
                <View style={styles.executionInfo}>
                    <View style={styles.row}>
                        <Text style={styles.executionStatus}>{item.status.toUpperCase()}</Text>
                        <Text style={styles.executionTime}>{formatDate(item.startedAt)}</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={styles.executionId}>#{item.id}</Text>
                        {duration !== null && (
                            <Text style={styles.executionDuration}>{duration}s</Text>
                        )}
                    </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.modeBadge}>{item.mode}</Text>
                    {isFetching && <ActivityIndicator size="small" color="#FF6C37" style={{ marginTop: 8 }} />}
                </View>
            </TouchableOpacity>
        );
    };

    // Show initial loading while hydrating or fetching first data
    if (!isHydrated || (loading && (!executions || executions.length === 0))) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF6C37" />
                <Text style={styles.infoText}>
                    {!isHydrated ? "Sincronizando seguridad..." : "Cargando ejecuciones..."}
                </Text>
            </View>
        );
    }

    if (!workflowId) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>ID de Workflow no encontrado.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <FlatList
                data={executions || []}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listPadding}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.infoText}>No hay ejecuciones para este flujo.</Text>
                    </View>
                }
                refreshing={loading}
                onRefresh={() => fetchExecutions(workflowId)}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    listPadding: {
        padding: 16,
    },
    executionCard: {
        flexDirection: 'row',
        backgroundColor: '#1A1C26',
        borderRadius: 12,
        marginBottom: 12,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    statusIndicator: {
        width: 4,
        height: 40,
        borderRadius: 2,
        marginRight: 12,
    },
    executionInfo: {
        flex: 1,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    executionStatus: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    executionTime: {
        color: '#718096',
        fontSize: 12,
    },
    executionId: {
        color: '#4A5568',
        fontSize: 12,
    },
    executionDuration: {
        color: '#A0AEC0',
        fontSize: 12,
    },
    modeBadge: {
        backgroundColor: '#2D3748',
        color: '#A0AEC0',
        fontSize: 10,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    infoText: {
        color: '#718096',
        marginTop: 12,
        textAlign: 'center',
    },
    errorText: {
        color: '#EF4444',
        textAlign: 'center',
    }
});
