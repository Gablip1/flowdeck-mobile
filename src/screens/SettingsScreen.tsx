import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    FlatList,
    TextInput,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useN8nStore } from '../store/useN8nStore';
import { pingInstance } from '../api/n8nClient';

export const SettingsScreen = ({ navigation }: any) => {
    const { 
        instances, 
        activeInstanceId, 
        switchInstance, 
        removeInstance, 
        addInstance,
        checkInstanceHealth,
        latency
    } = useN8nStore();

    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newKey, setNewKey] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);

    const [pinging, setPinging] = useState(false);
    const [pingResult, setPingResult] = useState<'success'|'error'|null>(null);

    const activeInstance = instances.find(i => i.id === activeInstanceId);

    const handlePing = async () => {
        if (!activeInstanceId) return;
        setPinging(true);
        setPingResult(null);
        try {
            const success = await pingInstance();
            setPingResult(success ? 'success' : 'error');
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                checkInstanceHealth();
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        } catch (err) {
            setPingResult('error');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setPinging(false);
        }
    };

    const handleAdd = async () => {
        if (!newUrl || !newKey) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }
        setIsConnecting(true);
        try {
            await addInstance(newName || 'Mi Instancia', newUrl, newKey);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIsAdding(false);
            setNewName('');
            setNewUrl('');
            setNewKey('');
        } catch (err) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsConnecting(false);
        }
    };

    const confirmRemove = (id: string, name: string) => {
        Alert.alert(
            "Eliminar Instancia",
            `¿Estás seguro que deseas eliminar "${name}"?`,
            [
                { text: "Cancelar", style: "cancel" },
                { 
                    text: "Eliminar", 
                    style: "destructive", 
                    onPress: () => removeInstance(id) 
                }
            ]
        );
    };

    const renderInstance = ({ item }: { item: any }) => {
        const isActive = item.id === activeInstanceId;
        return (
            <TouchableOpacity 
                style={[styles.instanceCard, isActive && styles.activeCard]}
                onPress={() => !isActive && switchInstance(item.id)}
            >
                <View style={styles.instanceInfo}>
                    <Text style={styles.instanceName}>{item.name}</Text>
                    <Text style={styles.instanceUrl}>{item.baseUrl}</Text>
                </View>
                {isActive ? (
                    <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>Activo</Text>
                    </View>
                ) : (
                    <TouchableOpacity 
                        style={styles.deleteButton}
                        onPress={() => confirmRemove(item.id, item.name)}
                    >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity 
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.title}>Ajustes & Perfiles</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Active Instance Settings */}
            {activeInstance && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Instancia Actual</Text>
                    <View style={styles.settingsCard}>
                        <View style={styles.row}>
                            <Text style={styles.label}>Nombre:</Text>
                            <Text style={styles.value}>{activeInstance.name}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.label}>URL:</Text>
                            <Text style={styles.value}>{activeInstance.baseUrl}</Text>
                        </View>
                        <View style={[styles.row, { borderBottomWidth: 0, marginBottom: 0, paddingBottom: 0 }]}>
                            <Text style={styles.label}>Ping API:</Text>
                            <TouchableOpacity 
                                style={styles.pingButton}
                                onPress={handlePing}
                                disabled={pinging}
                            >
                                {pinging ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.pingText}>Probar Conexión</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        {pingResult && (
                            <Text style={[
                                styles.pingResultText, 
                                { color: pingResult === 'success' ? '#00C7B7' : '#EF4444' }
                            ]}>
                                {pingResult === 'success' ? '✅ Conexión exitosa' : '❌ Error de conexión'}
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {/* Profiles Manager */}
            <View style={[styles.section, { flex: 1 }]}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Perfiles Guardados</Text>
                    {!isAdding && (
                        <TouchableOpacity onPress={() => setIsAdding(true)}>
                            <Ionicons name="add-circle" size={28} color="#FF6C37" />
                        </TouchableOpacity>
                    )}
                </View>

                {isAdding && (
                    <View style={styles.addForm}>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre (ej: Local, Producción)"
                            placeholderTextColor="#4A4F6A"
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="URL (https://n8n...)"
                            placeholderTextColor="#4A4F6A"
                            value={newUrl}
                            onChangeText={setNewUrl}
                            autoCapitalize="none"
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="API Key"
                            placeholderTextColor="#4A4F6A"
                            value={newKey}
                            onChangeText={setNewKey}
                            secureTextEntry
                        />
                        <View style={styles.formActions}>
                            <TouchableOpacity 
                                style={styles.cancelButton}
                                onPress={() => setIsAdding(false)}
                            >
                                <Text style={styles.cancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.saveButton, isConnecting && { opacity: 0.7 }]}
                                onPress={handleAdd}
                                disabled={isConnecting}
                            >
                                {isConnecting ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.saveText}>Añadir</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <FlatList
                    data={instances}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInstance}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
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
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#1A1C26',
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    section: {
        padding: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    settingsCard: {
        backgroundColor: '#1A1C26',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#2D3748',
    },
    label: {
        color: '#A0AEC0',
        fontSize: 14,
    },
    value: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '500',
    },
    pingButton: {
        backgroundColor: '#2D3748',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
    },
    pingText: {
        color: '#00C7B7',
        fontWeight: '600',
        fontSize: 12,
    },
    pingResultText: {
        marginTop: 12,
        fontSize: 12,
        textAlign: 'right',
    },
    addForm: {
        backgroundColor: '#1A1C26',
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    input: {
        backgroundColor: '#0F111A',
        color: '#FFFFFF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    formActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 4,
    },
    cancelButton: {
        padding: 12,
        marginRight: 12,
    },
    cancelText: {
        color: '#A0AEC0',
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#FF6C37',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
    },
    saveText: {
        color: '#FFFFFF',
        fontWeight: 'bold',
    },
    instanceCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#1A1C26',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    activeCard: {
        borderColor: '#FF6C37',
        backgroundColor: '#232533',
    },
    instanceInfo: {
        flex: 1,
    },
    instanceName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    instanceUrl: {
        color: '#718096',
        fontSize: 12,
    },
    activeBadge: {
        backgroundColor: 'rgba(255, 108, 55, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    activeBadgeText: {
        color: '#FF6C37',
        fontSize: 12,
        fontWeight: 'bold',
    },
    deleteButton: {
        padding: 8,
    }
});
