import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { N8nDataGrid } from '../components/N8nDataGrid';

export const TableDetailScreen = ({ route, navigation }: any) => {
    const { tableId, tableName } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color="#A0AEC0" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title} numberOfLines={1}>{tableName || `Table ${tableId}`}</Text>
                    <Text style={styles.subtitle}>ID: {tableId}</Text>
                </View>
            </View>
            
            <View style={styles.gridWrapper}>
                <N8nDataGrid tableId={tableId} />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#1A1C26',
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    backBtn: {
        padding: 8,
        marginRight: 8,
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    subtitle: {
        fontSize: 12,
        color: '#00C7B7',
        fontFamily: 'monospace',
        marginTop: 2,
    },
    gridWrapper: {
        flex: 1,
        padding: 16,
    }
});
