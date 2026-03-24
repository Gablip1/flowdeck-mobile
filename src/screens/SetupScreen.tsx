import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TextInput, 
    TouchableOpacity, 
    KeyboardAvoidingView, 
    Platform,
    ScrollView,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useN8nStore } from '../store/useN8nStore';
import * as Haptics from 'expo-haptics';

export const SetupScreen: React.FC = () => {
    const [name, setName] = useState('');
    const [url, setUrl] = useState('');
    const [key, setKey] = useState('');
    const [isConnecting, setIsConnecting] = useState(false);
    
    const addInstance = useN8nStore(state => state.addInstance);

    const handleConnect = async () => {
        if (!url || !key) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        setIsConnecting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await addInstance(name || 'Mi Instancia', url, key);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsConnecting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.header}>
                        <Text style={styles.logo}>n8n</Text>
                        <Text style={styles.title}>Mobile Manager</Text>
                        <Text style={styles.subtitle}>Configura el acceso a tu instancia de n8n VPS para empezar.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Nombre de la Instancia</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Ej: Producción, Test..."
                                placeholderTextColor="#4A4F6A"
                                value={name}
                                onChangeText={setName}
                                autoCorrect={false}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>URL de la Instancia</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="https://n8n.tu-vps.com"
                                placeholderTextColor="#4A4F6A"
                                value={url}
                                onChangeText={setUrl}
                                autoCapitalize="none"
                                autoCorrect={false}
                                keyboardType="url"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>n8n API Key</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="n8n_api_..."
                                placeholderTextColor="#4A4F6A"
                                value={key}
                                onChangeText={setKey}
                                secureTextEntry
                                autoCapitalize="none"
                                autoCorrect={false}
                            />
                        </View>

                        <TouchableOpacity 
                            style={[styles.button, isConnecting && styles.buttonDisabled]}
                            onPress={handleConnect}
                            disabled={isConnecting}
                        >
                            {isConnecting ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buttonText}>Conectar Instancia</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            Puedes generar tu API Key en la configuración de usuario de tu instancia de n8n.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F111A',
    },
    scrollContent: {
        padding: 24,
        flexGrow: 1,
        justifyContent: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    logo: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF6C37',
        marginBottom: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: '#A0AEC0',
        textAlign: 'center',
        lineHeight: 24,
    },
    form: {
        backgroundColor: '#1A1C26',
        borderRadius: 16,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#CBD5E0',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#0F111A',
        borderRadius: 8,
        padding: 12,
        color: '#FFFFFF',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#2D3748',
    },
    button: {
        backgroundColor: '#FF6C37',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    footer: {
        marginTop: 32,
        paddingHorizontal: 12,
    },
    footerText: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 20,
    },
});
