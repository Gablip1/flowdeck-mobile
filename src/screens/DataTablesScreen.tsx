import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useN8nStore } from '../store/useN8nStore';

export const DataTablesScreen = ({ navigation }: any) => {
    const { fetchTables, tables, tablesLoading, activeInstanceId } = useN8nStore();

    useEffect(() => {
        if (activeInstanceId) {
            fetchTables();
        }
    }, [activeInstanceId, fetchTables]);

    const renderItem = ({ item }: { item: any }) => (
        <TouchableOpacity 
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('TableDetail', { tableId: item.id, tableName: item.name })}
        >
            <View style={styles.iconContainer}>
                <View style={styles.glow} />
                <Ionicons name="grid" size={20} color="#00C7B7" />
            </View>
            <View style={styles.info}>
                <Text style={styles.title}>{item.name || `Table ${item.id}`}</Text>
                <Text style={styles.subtitle}>ID: {item.id}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#4A5568" />
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>n8n Databases</Text>
            </View>
            
            {tablesLoading && tables.length === 0 ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color="#FF6C37" />
                </View>
            ) : (
                <FlatList
                    data={tables}
                    keyExtractor={(t) => String(t.id)}
                    renderItem={renderItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Ionicons name="server-outline" size={48} color="#2D3748" />
                            <Text style={styles.emptyText}>No n8n tables found or instance unsupported.</Text>
                        </View>
                    }
                    refreshing={tablesLoading}
                    onRefresh={fetchTables}
                />
            )}
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
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    list: {
        padding: 16,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#1A1C26',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: 'rgba(0, 199, 183, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        position: 'relative',
    },
    glow: {
        position: 'absolute',
        width: 20,
        height: 20,
        backgroundColor: '#00C7B7',
        borderRadius: 10,
        opacity: 0.3,
        transform: [{ scale: 2 }],
    },
    info: {
        flex: 1,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    subtitle: {
        color: '#718096',
        fontSize: 12,
        fontFamily: 'monospace',
    },
    empty: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyText: {
        color: '#718096',
        marginTop: 16,
        textAlign: 'center',
        lineHeight: 22,
    }
});
