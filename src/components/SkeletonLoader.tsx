import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, Easing, interpolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

export const SkeletonLoader = ({ width, height, borderRadius = 24, style }: any) => {
    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withRepeat(
            withTiming(1, { duration: 1500, easing: Easing.linear }),
            -1,
            false
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => {
        const screenWidth = Dimensions.get('window').width;
        // Move the gradient from far left to far right
        const translateX = interpolate(progress.value, [0, 1], [-screenWidth, screenWidth]);
        return {
            transform: [{ translateX }]
        };
    });

    return (
        <View style={[{ width, height, borderRadius, backgroundColor: '#1A1C26', overflow: 'hidden', borderWidth: 1, borderColor: '#2D3748' }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
                <LinearGradient
                    colors={['transparent', 'rgba(255,255,255,0.06)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
};
