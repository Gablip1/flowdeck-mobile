import React, { useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useN8nStore } from '../store/useN8nStore';
import { PieChart } from 'react-native-gifted-charts';
import { BentoCard } from '../components/BentoCard';
import { SkeletonLoader } from '../components/SkeletonLoader';
import { HumanApprovalCard } from '../components/HumanApprovalCard';
import * as Haptics from 'expo-haptics';

const getTimeAgo = (dateStr: string) => {
    const current = new Date();
    const previous = new Date(dateStr);
    const msPerMinute = 60 * 1000;
    const msPerHour = msPerMinute * 60;
    const msPerDay = msPerHour * 24;
    
    const elapsed = current.getTime() - previous.getTime();
    
    if (elapsed < msPerMinute) return Math.round(elapsed / 1000) + 's';
    else if (elapsed < msPerHour) return Math.round(elapsed / msPerMinute) + 'm';
    else if (elapsed < msPerDay) return Math.round(elapsed / msPerHour) + 'h';
    else return Math.round(elapsed / msPerDay) + 'd';
};

export const DashboardAnalyticsScreen = ({ navigation }: any) => {
    const { 
        globalExecutions, 
        globalExecutionsLoading, 
        fetchGlobalExecutions,
        workflows,
        loading,
        fetchWorkflows,
        latency,
        checkInstanceHealth,
        setSelectedExecutionErrorId
    } = useN8nStore();

    const stats = useMemo(() => {
        let successCount = 0;
        let errorCount = 0;
        let triggerCount = 0;
        let manualCount = 0;
        
        const workflowCounts: Record<string, number> = {};

        globalExecutions.forEach(e => {
            if (e.status === 'success') successCount++;
            else if (['error', 'failed', 'crashed'].includes(e.status)) errorCount++;
            
            if (e.mode === 'trigger') triggerCount++;
            else if (e.mode === 'manual') manualCount++;

            const wId = (e as any).workflowId;
            if (wId) workflowCounts[wId] = (workflowCounts[wId] || 0) + 1;
        });
        
        const activeWorkflows = workflows.filter(w => w.active).length;
        const inactiveWorkflows = workflows.filter(w => !w.active).length;

        const now = Date.now();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        const weeklyCreations = workflows.filter(w => {
            if (!w.createdAt) return false;
            return (now - new Date(w.createdAt).getTime()) <= sevenDaysMs;
        }).length;

        const topWorkflows = Object.entries(workflowCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([id, count]) => {
                const name = workflows.find(w => w.id === id)?.name || `ID: ${id.substring(0, 5)}`;
                return { id, count, name };
            });

        return { 
            successCount, 
            errorCount, 
            totalExecutions: globalExecutions.length, 
            activeWorkflows, 
            inactiveWorkflows,
            triggerCount,
            manualCount,
            weeklyCreations,
            topWorkflows
        };
    }, [globalExecutions, workflows]);

    const recentFailures = useMemo(() => {
        const failures = globalExecutions
            .filter(e => e.status === 'error' || e.status === 'failed' || e.status === 'crashed')
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .slice(0, 3);
            
        return failures.map(f => {
            const workflowName = workflows.find(w => w.id === (f as any).workflowId)?.name || `Wkf #${(f as any).workflowId?.substring(0,6) || '?'}`;
            return {
                ...f,
                workflowName,
                timeAgo: getTimeAgo(f.startedAt)
            };
        });
    }, [globalExecutions, workflows]);

    const handleErrorPress = (executionId: string, workflowId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedExecutionErrorId(executionId);
        
        const workflow = workflows.find(w => w.id === workflowId);
        navigation.navigate('WorkflowDetail', { workflow: workflow || { id: workflowId, name: 'Workflow' } });
    };

    const onRefresh = useCallback(async () => {
        await Promise.all([
            fetchGlobalExecutions(),
            fetchWorkflows(),
            checkInstanceHealth()
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, [fetchGlobalExecutions, fetchWorkflows, checkInstanceHealth]);

    const renderContent = () => {
        const isDataLoading = globalExecutionsLoading || loading;

        if (isDataLoading && workflows.length === 0) {
            return (
                <View style={styles.grid}>
                    <SkeletonLoader width="100%" height={200} style={{ marginBottom: 16 }} />
                    <View style={styles.row}>
                        <SkeletonLoader width="48%" height={160} />
                        <SkeletonLoader width="48%" height={160} />
                    </View>
                    <SkeletonLoader width="100%" height={240} />
                </View>
            );
        }

        const successRatioData = [
            { value: stats.successCount || 0, color: '#00C7B7' },
            { value: stats.errorCount || 0, color: '#EF4444' }
        ];
        
        if (stats.totalExecutions === 0) {
            successRatioData[0] = { value: 1, color: '#2D3748' };
            successRatioData[1] = { value: 0, color: '#EF4444' };
        }

        const modeBreakdownData = [
            { value: stats.triggerCount || 0, color: '#8B5CF6' },
            { value: stats.manualCount || 0, color: '#3182CE' }
        ];

        if (stats.triggerCount === 0 && stats.manualCount === 0) {
            modeBreakdownData[0] = { value: 1, color: '#2D3748' };
        }

        return (
            <View style={styles.grid}>
                <HumanApprovalCard />

                {/* Top Row: Success Ratio & Mode Breakdown */}
                <View style={styles.row}>
                    <BentoCard title="Tasa de Éxito" style={{ flex: 1, marginRight: 8 }}>
                        <View style={styles.pieContainer}>
                            <PieChart
                                data={successRatioData}
                                donut
                                radius={45}
                                innerRadius={35}
                                innerCircleColor="#1A1C26"
                                centerLabelComponent={() => {
                                    const percentage = stats.totalExecutions > 0 
                                        ? Math.round((stats.successCount / stats.totalExecutions) * 100) 
                                        : 0;
                                    return (
                                        <Text style={{fontSize: 16, color: '#FFFFFF', fontWeight: 'bold'}}>{percentage}%</Text>
                                    );
                                }}
                            />
                        </View>
                        <View style={styles.metricsRow}>
                            <Text style={[styles.miniText, { color: '#00C7B7' }]}>{stats.successCount} OK</Text>
                            <Text style={[styles.miniText, { color: '#EF4444' }]}>{stats.errorCount} Err</Text>
                        </View>
                    </BentoCard>

                    <BentoCard title="Por Modo" style={{ flex: 1, marginLeft: 8 }}>
                        <View style={styles.pieContainer}>
                            <PieChart
                                data={modeBreakdownData}
                                donut
                                radius={45}
                                innerRadius={35}
                                innerCircleColor="#1A1C26"
                                centerLabelComponent={() => (
                                    <Ionicons name="flash" size={20} color="#8B5CF6" />
                                )}
                            />
                        </View>
                        <View style={styles.metricsRow}>
                            <Text style={[styles.miniText, { color: '#8B5CF6' }]}>{stats.triggerCount} Auto</Text>
                            <Text style={[styles.miniText, { color: '#3182CE' }]}>{stats.manualCount} Man</Text>
                        </View>
                    </BentoCard>
                </View>

                {/* Middle Row: Top Active & Weekly */}
                <View style={styles.row}>
                    <BentoCard title="Top Activos" style={{ flex: 1.2, marginRight: 8 }}>
                        <View style={styles.listContainer}>
                            {stats.topWorkflows.length > 0 ? stats.topWorkflows.map((w, i) => (
                                <View key={w.id} style={styles.miniListItem}>
                                    <Text style={styles.miniListRank}>{i + 1}</Text>
                                    <Text style={styles.miniListName} numberOfLines={1}>{w.name}</Text>
                                    <Text style={styles.miniListCount}>{w.count}</Text>
                                </View>
                            )) : (
                                <Text style={styles.legendLabel}>Sin actividad</Text>
                            )}
                        </View>
                    </BentoCard>

                    <BentoCard title="Nuevos (7d)" style={{ flex: 0.8, marginLeft: 8 }}>
                        <View style={styles.cardInner}>
                            <Text style={[styles.metricText, { fontSize: 40, color: '#00C7B7' }]}>+{stats.weeklyCreations}</Text>
                            <Text style={styles.legendLabel}>Flujos Creados</Text>
                        </View>
                    </BentoCard>
                </View>

                {/* Bottom Card: Recent Failures */}
                <BentoCard title="Últimos Fallos Críticos">
                    {recentFailures.length > 0 ? (
                        recentFailures.map((failure, index) => (
                            <TouchableOpacity 
                                key={failure.id} 
                                style={[styles.failureItem, index !== recentFailures.length - 1 && styles.failureItemBorder]}
                                onPress={() => handleErrorPress(failure.id, (failure as any).workflowId)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.failureIcon}>
                                    <View style={styles.glowRed} />
                                    <Ionicons name="warning" size={20} color="#EF4444" />
                                </View>
                                <View style={styles.failureInfo}>
                                    <Text style={styles.failureName} numberOfLines={1}>{failure.workflowName}</Text>
                                    <Text style={styles.failureTime}>Hace {failure.timeAgo} • ID: {failure.id.substring(0, 5)}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={16} color="#4A5568" />
                            </TouchableOpacity>
                        ))
                    ) : (
                        <View style={[styles.cardInner, { paddingVertical: 20 }]}>
                            <Ionicons name="shield-checkmark" size={40} color="#00C7B7" style={{ marginBottom: 12 }} />
                            <Text style={styles.legendLabel}>Todo funcionando perfectamente</Text>
                        </View>
                    )}
                </BentoCard>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>System Health</Text>
            </View>
            <ScrollView 
                contentContainerStyle={styles.content}
                refreshControl={
                    <RefreshControl 
                        refreshing={globalExecutionsLoading} 
                        onRefresh={onRefresh} 
                        tintColor="#FF6C37"
                    />
                }
            >
                {renderContent()}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    header: {
        padding: 20,
        backgroundColor: '#1A1C26',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    content: {
        padding: 16,
        paddingBottom: 80,
    },
    grid: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
    },
    pieContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#2D3748',
    },
    miniText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    cardInner: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    metricText: {
        color: '#FFFFFF',
        fontSize: 32,
        fontWeight: 'bold',
    },
    legendLabel: {
        color: '#A0AEC0',
        fontSize: 12,
        fontWeight: '500',
    },
    listContainer: {
        flex: 1,
        justifyContent: 'center',
        gap: 8,
    },
    miniListItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    miniListRank: {
        color: '#4A5568',
        fontSize: 12,
        fontWeight: 'bold',
        width: 16,
    },
    miniListName: {
        color: '#FFFFFF',
        fontSize: 12,
        flex: 1,
        marginHorizontal: 8,
    },
    miniListCount: {
        color: '#00C7B7',
        fontSize: 12,
        fontWeight: 'bold',
    },
    failureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    failureItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    failureIcon: {
        marginRight: 14,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    glowRed: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#EF4444',
        opacity: 0.2,
        transform: [{ scale: 1.5 }],
    },
    failureInfo: {
        flex: 1,
    },
    failureName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    failureTime: {
        color: '#718096',
        fontSize: 12,
    }
});
