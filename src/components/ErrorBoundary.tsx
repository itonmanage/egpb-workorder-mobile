import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    public render() {
        if (this.state.hasError) {
            return (
                <SafeAreaView style={styles.container}>
                    <View style={styles.content}>
                        <Ionicons name="warning-outline" size={64} color={Colors.error} />
                        <Text style={styles.title}>Oops, something went wrong</Text>
                        <Text style={styles.message}>
                            An unexpected error has occurred. We apologize for the inconvenience.
                        </Text>

                        {/* Optionally show error details in dev (can be hidden in production) */}
                        {__DEV__ && this.state.error && (
                            <View style={styles.errorBox}>
                                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                            </View>
                        )}

                        <TouchableOpacity style={styles.button} onPress={this.handleReset}>
                            <Ionicons name="refresh" size={20} color={Colors.white} />
                            <Text style={styles.buttonText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: Spacing.xxxxl,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: 'bold',
        color: Colors.text,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        textAlign: 'center',
    },
    message: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xxl,
        lineHeight: 24,
    },
    errorBox: {
        backgroundColor: Colors.errorBg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        marginBottom: Spacing.xxl,
        width: '100%',
        borderWidth: 1,
        borderColor: Colors.errorBorder,
    },
    errorText: {
        color: Colors.error,
        fontSize: FontSize.xs,
        fontFamily: 'monospace',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.primary,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.lg,
        gap: Spacing.sm,
    },
    buttonText: {
        color: Colors.white,
        fontSize: FontSize.md,
        fontWeight: 'bold',
    },
});
