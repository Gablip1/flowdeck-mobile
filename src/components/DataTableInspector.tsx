import React, { useState, useMemo, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import BottomSheet, { BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface DataTableInspectorProps {
    data: Array<Record<string, any>>;
}

const COLUMN_WIDTH = 150;
const AnyFlashList = FlashList as any;

export const DataTableInspector: React.FC<DataTableInspectorProps> = ({ data }) => {
    const bottomSheetRef = useRef<BottomSheet>(null);
    const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);

    // Extraction of unique keys across up to the first 50 records to form columns
    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        const keys = new Set<string>();
        const sampleSize = Math.min(data.length, 50);
        for (let i = 0; i < sampleSize; i++) {
            if (data[i] && typeof data[i] === 'object') {
                Object.keys(data[i]).forEach(k => keys.add(k));
            }
        }
        return Array.from(keys);
    }, [data]);

    const handleRowPress = useCallback((item: Record<string, any>) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRow(item);
        bottomSheetRef.current?.expand();
    }, []);

    const snapPoints = useMemo(() => ['50%', '80%'], []);

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
                    <Text style={styles.headerText} numberOfLines={1}>{col}</Text>
                </View>
            ))}
        </View>
    ), [columns]);

    const handleValueEdit = (key: string, value: string) => {
        if (selectedRow) {
            setSelectedRow({ ...selectedRow, [key]: value });
        }
    };

    if (!data || data.length === 0 || columns.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="server-outline" size={48} color="#2D3748" />
                <Text style={styles.emptyText}>No tabular data available</Text>
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
                            data={data}
                            renderItem={renderItem}
                            estimatedItemSize={50}
                            keyExtractor={(_: any, index: number) => `row-${index}`}
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
                            <Text style={styles.sheetTitle}>Inspector de Celdas</Text>
                            <Text style={styles.sheetSubtitle}>Edita los valores del JSON</Text>
                        </View>
                        
                        {columns.map(col => {
                            let val = selectedRow[col];
                            if (typeof val === 'object' && val !== null) {
                                val = JSON.stringify(val);
                            } else if (val === undefined || val === null) {
                                val = '';
                            } else {
                                val = String(val);
                            }

                            return (
                                <View key={`edit-${col}`} style={styles.inputGroup}>
                                    <Text style={styles.inputLabel}>{col}</Text>
                                    <TextInput
                                        style={styles.textInput}
                                        value={val}
                                        onChangeText={(text) => handleValueEdit(col, text)}
                                        multiline={val.length > 50}
                                        placeholder={`Empty (${col})`}
                                        placeholderTextColor="#4A5568"
                                    />
                                </View>
                            );
                        })}

                        <TouchableOpacity 
                            style={styles.saveBtn}
                            onPress={() => {
                                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                                bottomSheetRef.current?.close();
                            }}
                        >
                            <Ionicons name="save" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
                            <Text style={styles.saveBtnText}>Guardar Mock Local</Text>
                        </TouchableOpacity>
                    </BottomSheetScrollView>
                )}
            </BottomSheet>
        </View>
    );
};

// ... Wait, Dimensions is not imported yet. I should import it at the top.
import { Dimensions } from 'react-native';

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
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1C26',
        borderRadius: 12,
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
        color: '#A0AEC0',
        marginTop: 4,
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
        backgroundColor: '#FF6C37',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginTop: 16,
        marginBottom: 40,
    },
    saveBtnText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
