import React, { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Platform, TouchableOpacity } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { DataTableInspector } from '../components/DataTableInspector';

type ViewMode = 'table' | 'raw';

export const JsonViewScreen: React.FC = () => {
    const route = useRoute<any>();
    const detail = route.params?.workflow || route.params?.detail;
    
    const [viewMode, setViewMode] = useState<ViewMode>('raw');

    if (!detail) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>No data found.</Text>
            </View>
        );
    }

    // Try to extract an array for the table inspector
    let tableData: any[] = [];
    const runData = detail.data?.resultData?.runData || detail.resultData?.runData;

    if (Array.isArray(detail)) {
        tableData = detail;
    } else if (detail.data && Array.isArray(detail.data)) {
        tableData = detail.data;
    } else if (runData) {
        // Fallback for n8n detailed execution payloads
        const flattened: any[] = [];
        Object.keys(runData).forEach(nodeName => {
            const runs = runData[nodeName];
            runs.forEach((r: any) => {
                if (r.data && r.data.main && r.data.main[0]) {
                    r.data.main[0].forEach((item: any) => {
                        if (item.json) flattened.push({ _node: nodeName, ...item.json });
                        else flattened.push({ _node: nodeName, ...item });
                    });
                }
            });
        });
        tableData = flattened;
    }

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={styles.sectionTitle}>
                    {viewMode === 'table' ? 'Data Inspector' : 'Raw Content'}
                </Text>
                
                {tableData.length > 0 && (
                    <View style={styles.toggleContainer}>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, viewMode === 'raw' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('raw')}
                        >
                            <Text style={viewMode === 'raw' ? styles.toggleTextActive : styles.toggleText}>Raw</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.toggleBtn, viewMode === 'table' && styles.toggleBtnActive]}
                            onPress={() => setViewMode('table')}
                        >
                            <Text style={viewMode === 'table' ? styles.toggleTextActive : styles.toggleText}>Table</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {viewMode === 'table' && tableData.length > 0 ? (
                <View style={styles.tableWrapper}>
                    <DataTableInspector data={tableData} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollPadding}>
                    <View style={styles.jsonContainer}>
                        <Text style={styles.jsonText}>
                            {JSON.stringify(detail, null, 2)}
                        </Text>
                    </View>
                </ScrollView>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        paddingTop: 16,
    },
    scrollPadding: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    toggleContainer: {
        flexDirection: 'row',
        backgroundColor: '#1A1C26',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#2D3748',
        overflow: 'hidden',
    },
    toggleBtn: {
        paddingHorizontal: 16,
        paddingVertical: 6,
    },
    toggleBtnActive: {
        backgroundColor: '#FF6C37',
    },
    toggleText: {
        color: '#718096',
        fontSize: 12,
        fontWeight: 'bold',
    },
    toggleTextActive: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    tableWrapper: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    jsonContainer: {
        backgroundColor: '#1E202B',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    jsonText: {
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        color: '#00C7B7',
        fontSize: 12,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#0F111A',
    },
    errorText: {
        color: '#EF4444',
    }
});
