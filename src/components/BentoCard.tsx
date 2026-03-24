import React from 'react';
import { StyleSheet, Pressable, View, Text, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface BentoCardProps {
    title?: string;
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
}

export const BentoCard = ({ title, children, style, onPress }: BentoCardProps) => {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }]
    }));

    const handlePressIn = () => {
        if (!onPress) return;
        scale.value = withSpring(0.96);
    };

    const handlePressOut = () => {
        if (!onPress) return;
        scale.value = withSpring(1);
    };

    const handlePress = () => {
        if (!onPress) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
    };

    return (
        <Pressable 
            onPressIn={handlePressIn} 
            onPressOut={handlePressOut} 
            onPress={handlePress}
            disabled={!onPress}
            style={style}
        >
            <Animated.View style={[styles.card, animatedStyle]}>
                {title && <Text style={styles.title}>{title}</Text>}
                {children}
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#1A1C26',
        borderRadius: 24,
        padding: 24,
        borderWidth: 1,
        borderColor: '#2D3748',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
        overflow: 'hidden'
    },
    title: {
        color: '#A0AEC0',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    }
});
