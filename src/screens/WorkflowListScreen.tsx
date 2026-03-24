import React, { useState, useEffect } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    FlatList, 
    TouchableOpacity, 
    TextInput,
    ActivityIndicator,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useN8nStore } from '../store/useN8nStore';
import { WorkflowItem } from '../components/WorkflowItem';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'active' | 'inactive';

export const WorkflowListScreen = ({ navigation }: any) => {
    const { 
        workflows, 
        loading, 
        error, 
        executingWorkflows,
        latency,
        statusMessage,
        fetchWorkflows, 
        toggleWorkflow, 
        executeWorkflow,
        checkInstanceHealth,
        clearStatusMessage,
        activeInstanceId,
        removeInstance
    } = useN8nStore();
    
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<FilterType>('all');

    useEffect(() => {
        fetchWorkflows();
        const interval = setInterval(checkInstanceHealth, 30000);
        return () => clearInterval(interval);
    }, []);

    const filteredWorkflows = workflows.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = 
            filter === 'all' ? true :
            filter === 'active' ? w.active : !w.active;
        return matchesSearch && matchesFilter;
    });

    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <View>
                    <Text style={styles.greeting}>Workflows</Text>
                    <View style={styles.statusRow}>
                        <View style={[styles.statusDot, { backgroundColor: latency !== null && latency !== -1 ? '#00C7B7' : '#EF4444' }]} />
                        <Text style={styles.statusText}>
                            {latency !== null && latency !== -1 ? `Online (${latency}ms)` : 'Offline'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color="#718096" style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Buscar workflows..."
                    placeholderTextColor="#718096"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
            </View>

            <View style={styles.filterTabs}>
                {(['all', 'active', 'inactive'] as FilterType[]).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterTab, filter === f && styles.filterTabActive]}
                        onPress={() => {
                            setFilter(f);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={filteredWorkflows}
                keyExtractor={(item) => item.id}
                ListHeaderComponent={renderHeader()}
                renderItem={({ item }) => (
                    <WorkflowItem 
                        workflow={item} 
                        isExecuting={executingWorkflows[item.id]}
                        onToggle={() => toggleWorkflow(item.id, item.active)}
                        onExecute={() => executeWorkflow(item.id)}
                        onPress={() => navigation.navigate('WorkflowDetail', { workflow: item })}
                    />
                )}
                refreshControl={
                    <RefreshControl 
                        refreshing={loading} 
                        onRefresh={fetchWorkflows}
                        tintColor="#FF6C37"
                    />
                }
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        {loading ? (
                            <ActivityIndicator size="large" color="#FF6C37" />
                        ) : (
                            <>
                                <Ionicons name="document-text-outline" size={48} color="#2D3748" />
                                <Text style={styles.emptyText}>No se encontraron workflows</Text>
                                <Text style={styles.emptySubtext}>Prueba con otra búsqueda o filtro.</Text>
                            </>
                        )}
                    </View>
                }
                contentContainerStyle={styles.listContent}
            />

            {statusMessage && (
                <View style={[styles.toast, { backgroundColor: statusMessage.type === 'error' ? '#EF4444' : '#00C7B7' }]}>
                    <Text style={styles.toastText}>{statusMessage.text}</Text>
                    <TouchableOpacity onPress={clearStatusMessage}>
                        <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    listContent: {
        paddingBottom: 24,
    },
    header: {
        padding: 20,
        backgroundColor: '#1A1C26',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        marginBottom: 16,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    greeting: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        color: '#718096',
        fontSize: 12,
    },
    headerActions: {
        flexDirection: 'row',
    },
    settingsButton: {
        padding: 8,
        backgroundColor: '#2D3748',
        borderRadius: 8,
    },
    settingsText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F111A',
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 44,
        color: '#FFFFFF',
        fontSize: 16,
    },
    filterTabs: {
        flexDirection: 'row',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        backgroundColor: '#0F111A',
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    filterTabActive: {
        backgroundColor: '#FF6C37',
        borderColor: '#FF6C37',
    },
    filterTabText: {
        color: '#718096',
        fontSize: 13,
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#FFFFFF',
    },
    list: {
        padding: 20,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 16,
    },
    emptySubtext: {
        color: '#718096',
        fontSize: 14,
        marginTop: 8,
        textAlign: 'center',
    },
    toast: {
        position: 'absolute',
        bottom: 24,
        left: 20,
        right: 20,
        padding: 16,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 10,
    },
    toastText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 14,
    }
});