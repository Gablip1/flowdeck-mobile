import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useN8nStore } from '../store/useN8nStore';

export const HumanApprovalCard: React.FC = () => {
    const { globalExecutions, resolveExecution, globalExecutionsLoading } = useN8nStore();

    const waitingExecutions = useMemo(() => {
        if (!globalExecutions) return [];
        return globalExecutions.filter(ex => ex.status === 'waiting');
    }, [globalExecutions]);

    if (waitingExecutions.length === 0) return null;

    return (
        <View style={styles.container}>
            {waitingExecutions.map(ex => (
                <View key={ex.id} style={styles.card}>
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <View style={styles.iconContainer}>
                                <Ionicons name="hand-right" size={16} color="#F6E05E" />
                            </View>
                            <Text style={styles.titleText}>Human Approval Required</Text>
                        </View>
                        <Text style={styles.idText}># {ex.id}</Text>
                    </View>
                    
                    <Text style={styles.description}>
                        Workflow execution has paused at a Wait Node and requires manual review to continue.
                    </Text>

                    <View style={styles.actions}>
                        <TouchableOpacity 
                            style={[styles.btn, styles.btnReject]}
                            onPress={() => resolveExecution(ex.id, 'reject')}
                            disabled={globalExecutionsLoading}
                        >
                            <Ionicons name="close" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.btnText}>Reject</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[styles.btn, styles.btnApprove]}
                            onPress={() => resolveExecution(ex.id, 'approve')}
                            disabled={globalExecutionsLoading}
                        >
                            <Ionicons name="checkmark" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.btnText}>Approve</Text>
                        </TouchableOpacity>
                    </View>
                    
                    {globalExecutionsLoading && (
                        <View style={styles.overlay}>
                            <ActivityIndicator size="small" color="#F6E05E" />
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
        marginBottom: 16,
    },
    card: {
        backgroundColor: 'rgba(236, 201, 75, 0.1)', // Yellow tint background
        borderWidth: 1,
        borderColor: '#F6E05E',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        overflow: 'hidden',
        // Native shadow for floating alert effect
        ...Platform.select({
            ios: {
                shadowColor: '#F6E05E',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 10,
            },
            android: {
                elevation: 6,
            }
        }),
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        backgroundColor: 'rgba(246, 224, 94, 0.2)',
        borderRadius: 8,
        padding: 6,
        marginRight: 10,
    },
    titleText: {
        color: '#F6E05E',
        fontSize: 15,
        fontWeight: 'bold',
    },
    idText: {
        color: '#A0AEC0',
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    description: {
        color: '#E2E8F0',
        fontSize: 13,
        lineHeight: 20,
        marginBottom: 16,
    },
    actions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 12,
    },
    btn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
    },
    btnReject: {
        backgroundColor: 'rgba(239, 68, 68, 0.8)', // Red
    },
    btnApprove: {
        backgroundColor: 'rgba(0, 199, 183, 0.9)', // n8n secondary green/teal
    },
    btnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 14,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(26, 28, 38, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    }
});
