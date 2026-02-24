import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, DimensionValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, BorderRadius } from '../constants/theme';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: any;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = BorderRadius.md, style }: SkeletonProps) {
    const animatedValue = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(animatedValue, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(animatedValue, {
                    toValue: 0,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, [animatedValue]);

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [-300, 300],
    });

    return (
        <View style={[styles.skeletonContainer, { width, height, borderRadius }, style]}>
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}>
                <LinearGradient
                    colors={[Colors.borderLight, Colors.border, Colors.borderLight]}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 1, y: 0.5 }}
                    style={StyleSheet.absoluteFill}
                />
            </Animated.View>
        </View>
    );
}

export function TicketCardSkeleton() {
    return (
        <View style={styles.cardSkeleton}>
            <View style={styles.headerRow}>
                <Skeleton width={100} height={20} />
                <Skeleton width={60} height={20} borderRadius={10} />
            </View>
            <View style={styles.titleRow}>
                <Skeleton width="80%" height={24} />
            </View>
            <View style={styles.titleRow}>
                <Skeleton width="60%" height={16} />
            </View>
            <View style={styles.footerRow}>
                <Skeleton width={80} height={16} />
                <Skeleton width={80} height={16} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    skeletonContainer: {
        backgroundColor: Colors.borderLight,
        overflow: 'hidden',
    },
    cardSkeleton: {
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.lg,
        padding: 16,
        marginBottom: 12,
        marginHorizontal: 20,
        borderWidth: 1,
        borderColor: Colors.border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    titleRow: {
        marginBottom: 8,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
    },
});
