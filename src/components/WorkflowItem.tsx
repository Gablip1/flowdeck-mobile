import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workflow } from '../store/useN8nStore';

interface WorkflowItemProps {
    workflow: Workflow;
    isExecuting?: boolean;
    onToggle: () => void;
    onExecute: () => void;
    onPress: () => void;
}

export const WorkflowItem: React.FC<WorkflowItemProps> = ({ 
    workflow, 
    isExecuting, 
    onToggle, 
    onExecute,
    onPress 
}) => {
    return (
        <TouchableOpacity style={styles.container} onPress={onPress}>
            <View style={styles.workflowInfo}>
                <Text style={styles.name}>{workflow.name}</Text>
                <View style={styles.statusRow}>
                    <View style={[styles.statusDot, { backgroundColor: workflow.active ? '#00C7B7' : '#718096' }]} />
                    <Text style={styles.statusText}>{workflow.active ? 'Active' : 'Inactive'}</Text>
                </View>
            </View>
            
            <View style={styles.actions}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.executeButton]} 
                    onPress={onExecute}
                    disabled={isExecuting}
                >
                    <Ionicons 
                        name={isExecuting ? 'sync' : 'play'} 
                        size={20} 
                        color="#FFFFFF" 
                    />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, workflow.active ? styles.deactivateButton : styles.activateButton]} 
                    onPress={onToggle}
                >
                    <Ionicons 
                        name={workflow.active ? 'power' : 'power-outline'} 
                        size={20} 
                        color="#FFFFFF" 
                    />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        backgroundColor: '#1A1C26',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    workflowInfo: {
        flex: 1,
    },
    name: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
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
    actions: {
        flexDirection: 'row',
    },
    actionButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 8,
    },
    executeButton: {
        backgroundColor: '#3182CE',
    },
    activateButton: {
        backgroundColor: '#00C7B7',
    },
    deactivateButton: {
        backgroundColor: '#EF4444',
    },
});