import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useN8nStore } from '../store/useN8nStore';

interface N8nDataGridProps {
    tableId: string;
}

const COLUMN_WIDTH = 150;
const AnyFlashList = FlashList as any;

export const N8nDataGrid: React.FC<N8nDataGridProps> = ({ tableId }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
    const [editedData, setEditedData] = useState<Record<string, any>>({});
    
    const fetchTableRows = useN8nStore(state => state.fetchTableRows);
    const updateTableRow = useN8nStore(state => state.updateTableRow);
    const tableRows = useN8nStore(state => state.tableRows[tableId]);
    const tableRowsLoading = useN8nStore(state => state.tableRowsLoading);
    
    // Stable array reference locally
    const rowsList = tableRows || [];

    useEffect(() => {
        fetchTableRows(tableId);
    }, [tableId, fetchTableRows]);

    // Extraction of unique keys across rows
    const columns = useMemo(() => {
        if (!rowsList || rowsList.length === 0) return [];
        const keys = new Set<string>();
        const sampleSize = Math.min(rowsList.length, 50);
        for (let i = 0; i < sampleSize; i++) {
            if (rowsList[i] && typeof rowsList[i] === 'object') {
                Object.keys(rowsList[i]).forEach(k => {
                    if (k !== 'id') keys.add(k); // usually 'id' is standard, optionally hidden or first
                });
            }
        }
        return ['id', ...Array.from(keys)];
    }, [rowsList]);

    const handleRowPress = useCallback((item: Record<string, any>) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRow(item);
        setEditedData({});
        bottomSheetRef.current?.expand();
    }, []);

    const snapPoints = useMemo(() => ['50%', '85%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
        ),
        []
    );

    const renderItem = useCallback(({ item, index }: { item: Record<string, any>, index: number }) => {
        return (
            <TouchableOpacity 
                style={[styles.row, index % 2 === 0 ? styles.rowEven : styles.rowOdd]} 
                onPress={() => handleRowPress(item)}
            >
                {columns.map(col => {
                    let cellValue = item[col];
                    if (typeof cellValue === 'object' && cellValue !== null) {
                        cellValue = JSON.stringify(cellValue);
                    }
                    return (
                        <View key={`${col}-${index}`} style={styles.cell}>
                            <Text style={styles.cellText} numberOfLines={1}>
                                {cellValue !== undefined && cellValue !== null ? String(cellValue) : '-'}
                            </Text>
                        </View>
                    );
                })}
            </TouchableOpacity>
        );
    }, [columns, handleRowPress]);

    const renderHeader = useCallback(() => (
        <View style={styles.headerRow}>
            {columns.map(col => (
                <View key={`header-${col}`} style={styles.headerCell}>
                    <Text style={[styles.headerText, col === 'id' && styles.headerIdText]} numberOfLines={1}>{col}</Text>
                </View>
            ))}
        </View>
    ), [columns]);

    const handleValueEdit = (key: string, value: string) => {
        setEditedData(prev => ({ ...prev, [key]: value }));
    };

    const saveChanges = async () => {
        if (!selectedRow || !selectedRow.id) return;
        
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        bottomSheetRef.current?.close();
        
        await updateTableRow(tableId, selectedRow.id, editedData);
    };

    if (tableRowsLoading && rowsList.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <ActivityIndicator size="large" color="#00C7B7" />
                <Text style={styles.emptyText}>Cargando datos de la tabla...</Text>
            </View>
        );
    }

    if (!rowsList || rowsList.length === 0 || columns.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="server-outline" size={48} color="#2D3748" />
                <Text style={styles.emptyText}>No hay filas en esta tabla o su esquema está vacío.</Text>
            </View>
        );
    }

    const tableWidth = columns.length * COLUMN_WIDTH;

    return (
        <View style={styles.container}>
            <ScrollView horizontal style={styles.horizontalScroll} showsHorizontalScrollIndicator={true}>
                <View style={{ width: Math.max(tableWidth, Dimensions.get('window').width) }}>
                    {renderHeader()}
                    <View style={styles.listContainer}>
                        <AnyFlashList
                            data={rowsList}
                            renderItem={renderItem}
                            estimatedItemSize={50}
                            keyExtractor={(item: any, index: number) => item?.id ? String(item.id) : `row-${index}`}
                        />
                    </View>
                </View>
            </ScrollView>

            <BottomSheet
                ref={bottomSheetRef}
                index={-1}
                snapPoints={snapPoints}
                enablePanDownToClose={true}
                backgroundStyle={styles.sheetBackground}
                handleIndicatorStyle={styles.sheetIndicator}
                backdropComponent={renderBackdrop}
            >
                {selectedRow && (
                    <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
                        <View style={styles.sheetHeader}>
                            <Text style={styles.sheetTitle}>Edit Row Data</Text>
                            <Text style={styles.sheetSubtitle}>Table: {tableId} | Row ID: {selectedRow.id || 'N/A'}</Text>
                        </View>
                        
                        {columns.map(col => {
                            if (col === 'id') return null; // Prevent editing ID

                            const baseVal = selectedRow[col];
                            const editedVal = editedData[col];
                            
                            let displayVal = editedVal !== undefined ? editedVal : baseVal;
                            if (typeof displayVal === 'object' && displayVal !== null) {
                                displayVal = JSON.stringify(displayVal);
                            } else if (displayVal === undefined || displayVal === null) {
                                displayVal = '';
                            } else {
                                displayVal = String(displayVal);
                            }

                            return (
                                <View key={`edit-${col}`} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{col}</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={displayVal}
                                        onChangeText={(text) => handleValueEdit(col, text)}
                                        multiline={true}
                                        placeholder={`Empty (${col})`}
                                        placeholderTextColor="#4A5568"
                                    />
                                </View>
                            );
                        })}

                        <TouchableOpacity 
                            style={[
                                styles.saveBtn,
                                Object.keys(editedData).length === 0 && styles.saveBtnDisabled
                            ]}
                            onPress={saveChanges}
                            disabled={Object.keys(editedData).length === 0}
                        >
                            <Ionicons name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>Guardar Cambios</Text>
                        </TouchableOpacity>
                    </BottomSheetScrollView>
                )}
            </BottomSheet>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    horizontalScroll: {
        flex: 1,
    },
    listContainer: {
        flex: 1,
        minHeight: 200, // FlashList needs a defined height or flex
    },
    headerRow: {
        flexDirection: 'row',
        backgroundColor: '#1A1C26',
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    headerCell: {
        width: COLUMN_WIDTH,
        padding: 12,
        justifyContent: 'center',
    },
    headerText: {
        color: '#A0AEC0',
        fontWeight: 'bold',
        fontSize: 13,
        textTransform: 'uppercase',
    },
    headerIdText: {
        color: '#FF6C37', // Highlight primary key
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
        height: 50,
        alignItems: 'center',
    },
    rowEven: {
        backgroundColor: '#0F111A',
    },
    rowOdd: {
        backgroundColor: '#1E202B',
    },
    cell: {
        width: COLUMN_WIDTH,
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    cellText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontFamily: 'monospace',
    },
    emptyContainer: {
        flex: 1,
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1C26',
        borderRadius: 12,
        minHeight: 300,
    },
    emptyText: {
        color: '#718096',
        marginTop: 12,
        fontSize: 14,
    },
    sheetBackground: {
        backgroundColor: '#1A1C26',
    },
    sheetIndicator: {
        backgroundColor: '#4A5568',
    },
    sheetContent: {
        padding: 24,
    },
    sheetHeader: {
        marginBottom: 24,
    },
    sheetTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    sheetSubtitle: {
        fontSize: 14,
        color: '#00C7B7',
        marginTop: 4,
        fontFamily: 'monospace',
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        color: '#FF6C37',
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    textInput: {
        backgroundColor: '#0F111A',
        borderWidth: 1,
        borderColor: '#2D3748',
        borderRadius: 8,
        color: '#FFFFFF',
        padding: 12,
        fontSize: 14,
        fontFamily: 'monospace',
        minHeight: 44,
    },
    saveBtn: {
        backgroundColor: '#00C7B7', // Submit color
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 40,
    },
    saveBtnDisabled: {
        backgroundColor: '#2D3748',
        opacity: 0.7,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
