import React, { useRef, useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';

interface NodeInspectorProps {
    workflow: any;
    selectedNodeId: string | null;
    executionError?: any;
    onClose: () => void;
}

export const NodeInspectorSheet: React.FC<NodeInspectorProps> = ({ workflow, selectedNodeId, executionError, onClose }) => {
    const bottomSheetModalRef = useRef<BottomSheetModal>(null);

    useEffect(() => {
        if (selectedNodeId) {
            bottomSheetModalRef.current?.present();
        } else {
            bottomSheetModalRef.current?.dismiss();
        }
    }, [selectedNodeId]);

    const handleSheetChanges = (index: number) => {
        if (index === -1) {
            onClose();
        }
    };

    const node = workflow?.nodes?.find((n: any) => n.id === selectedNodeId || n.name === selectedNodeId);

    if (!node && !executionError) return null;

    const renderErrorDetails = () => {
        if (!executionError) return null;
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorTitle}>Error de Ejecución</Text>
                <Text style={styles.errorMessage}>{executionError.message}</Text>
                {executionError.description && (
                    <Text style={styles.errorDescription}>{executionError.description}</Text>
                )}
            </View>
        );
    };

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={['50%', '80%']}
            onChange={handleSheetChanges}
            backgroundStyle={styles.background}
            handleIndicatorStyle={styles.indicator}
            enablePanDownToClose
        >
            <BottomSheetScrollView contentContainerStyle={styles.contentContainer}>
                {renderErrorDetails()}
                
                {node && (
                    <>
                        <View style={styles.header}>
                            <Text style={styles.nodeName}>{node.name}</Text>
                            <Text style={styles.nodeType}>{node.type}</Text>
                        </View>

                {node.notes && (
                    <View style={styles.notesContainer}>
                        <Text style={styles.notesTitle}>Notas</Text>
                        <Text style={styles.notesText}>{node.notes}</Text>
                    </View>
                )}

                <View style={styles.parametersContainer}>
                    <Text style={styles.sectionTitle}>Parámetros</Text>
                    {node.parameters && Object.keys(node.parameters).length > 0 ? (
                        <View style={styles.codeBlock}>
                            <Text style={styles.jsonText}>
                                {JSON.stringify(node.parameters, null, 2)}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.emptyText}>No hay parámetros configurados.</Text>
                    )}
                </View>

                        {node.credentials && (
                            <View style={styles.parametersContainer}>
                                <Text style={styles.sectionTitle}>Credenciales requeridas</Text>
                                <View style={styles.codeBlock}>
                                    <Text style={styles.jsonText}>
                                        {JSON.stringify(node.credentials, null, 2)}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    background: {
        backgroundColor: '#1A1C26',
        borderRadius: 24,
    },
    indicator: {
        backgroundColor: '#4A5568',
        width: 40,
    },
    contentContainer: {
        padding: 24,
        paddingBottom: 40,
    },
    header: {
        marginBottom: 24,
    },
    nodeName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    nodeType: {
        fontSize: 14,
        color: '#00C7B7',
        fontWeight: '600',
    },
    errorContainer: {
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#EF4444',
    },
    errorTitle: {
        color: '#EF4444',
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
    },
    errorMessage: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    errorDescription: {
        color: '#A0AEC0',
        fontSize: 13,
    },
    notesContainer: {
        backgroundColor: 'rgba(255, 108, 55, 0.1)',
        padding: 16,
        borderRadius: 12,
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#FF6C37',
    },
    notesTitle: {
        color: '#FF6C37',
        fontWeight: 'bold',
        fontSize: 14,
        marginBottom: 8,
    },
    notesText: {
        color: '#CBD5E0',
        fontSize: 14,
        lineHeight: 20,
    },
    parametersContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    codeBlock: {
        backgroundColor: '#0F111A',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    jsonText: {
        color: '#A0AEC0',
        fontFamily: 'monospace',
        fontSize: 13,
    },
    emptyText: {
        color: '#718096',
        fontStyle: 'italic',
    }
});
