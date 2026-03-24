import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { 
    useSharedValue, 
    useAnimatedStyle, 
    withSpring, 
    withDelay 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useN8nStore } from '../store/useN8nStore';
import * as Haptics from 'expo-haptics';

export const WelcomeScreen = ({ navigation }: any) => {
    const activeInstanceId = useN8nStore(state => state.activeInstanceId);
    const loadingCredentials = useN8nStore(state => state.loadingCredentials);

    // Initial state: 95% scale and 0 opacity
    const scale = useSharedValue(0.95);
    const opacity = useSharedValue(0);

    // Enter animation on mount
    useEffect(() => {
        // We use damping 15 and stiffness 100 for a slow, premium elastic pop
        const springConfig = { damping: 15, stiffness: 100 };
        
        opacity.value = withSpring(1, springConfig);
        scale.value = withSpring(1, springConfig);
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            opacity: opacity.value,
            transform: [{ scale: scale.value }],
            alignItems: 'center',
            justifyContent: 'center',
        };
    });

    const handlePress = () => {
        // Prevent navigation while SecureStore is still decoding the vaults
        if (loadingCredentials) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Push slightly for interaction feedback before navigating
        scale.value = withSpring(0.98, { damping: 15, stiffness: 200 }, () => {
            // Restore scale quietly in background
            scale.value = withSpring(1); 
        });

        requestAnimationFrame(() => {
            if (activeInstanceId) {
                navigation.replace('MainTabs');
            } else {
                navigation.replace('Setup');
            }
        });
    };

    return (
        <Pressable style={styles.container} onPress={handlePress}>
            <Animated.View style={animatedStyle}>
                
                {/* Minimal Logo Box */}
                <View style={styles.logoBox}>
                    <Ionicons name="layers" size={42} color="#FFFFFF" />
                </View>

                {/* Main Brand Title */}
                <Text style={styles.title}>FlowDeck</Text>

                {/* Subtitle */}
                <Text style={styles.subtitle}>Pro Client for n8n</Text>

            </Animated.View>
            
            <View style={styles.footerHint}>
                <Text style={styles.hintText}>Tap anywhere to continue</Text>
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Pure black per requirements
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoBox: {
        width: 80,
        height: 80,
        backgroundColor: '#111111',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        borderWidth: 1,
        borderColor: '#222222',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
    },
    title: {
        fontSize: 40,
        fontWeight: '800', // Extra bold system font
        color: '#FFFFFF',
        letterSpacing: -1, // Linear/Apple tight kerning
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#888888',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    footerHint: {
        position: 'absolute',
        bottom: 50,
        opacity: 0.4,
    },
    hintText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '500',
        letterSpacing: 1,
        textTransform: 'uppercase',
    }
});
