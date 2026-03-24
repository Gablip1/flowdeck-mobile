import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Animated } from 'react-native';

interface StatusBannerProps {
    message: string;
    type: 'success' | 'error' | 'info';
    onClose: () => void;
}

export const StatusBanner = ({ message, type, onClose }: StatusBannerProps) => {
    const translateY = new Animated.Value(-100);

    useEffect(() => {
        Animated.spring(translateY, {
            toValue: 20,
            useNativeDriver: true,
        }).start();

        const timer = setTimeout(() => {
            Animated.timing(translateY, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }).start(onClose);
        }, 3000);

        return () => clearTimeout(timer);
    }, [message]);

    const backgroundColor = 
        type === 'success' ? '#00C7B7' : 
        type === 'error' ? '#EF4444' : '#6B7280';

    return (
        <Animated.View style={[styles.banner, { backgroundColor, transform: [{ translateY }] }]}>
            <Text style={styles.text}>{message}</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: 40,
        left: 20,
        right: 20,
        padding: 12,
        borderRadius: 8,
        zIndex: 1000,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    text: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
});
