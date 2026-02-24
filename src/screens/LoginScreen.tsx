/**
 * Login Screen
 * Branded login matching the web app's green theme
 */
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { Colors, Spacing, FontSize, FontWeight, BorderRadius, Shadow } from '../constants/theme';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            setError('Please enter username and password');
            return;
        }

        setLoading(true);
        setError(null);

        const result = await login(username.trim(), password);

        if (!result.success) {
            setError(result.error || 'Login failed');
        }
        setLoading(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            {/* Background gradient effect */}
            <View style={styles.bgTop} />
            <View style={styles.bgBottom} />

            <View style={styles.innerContainer}>
                {/* Logo / Brand */}
                <View style={styles.logoContainer}>
                    <View style={styles.logoIcon}>
                        <Text style={styles.logoLetter}>E</Text>
                    </View>
                    <Text style={styles.brandName}>
                        EGPB<Text style={styles.brandAccent}>Ticket</Text>
                    </Text>
                    <Text style={styles.subtitle}>Work Order Management</Text>
                </View>

                {/* Login Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Sign In</Text>
                    <Text style={styles.cardSubtitle}>Welcome back! Please enter your details.</Text>

                    {error && (
                        <View style={styles.errorBox}>
                            <Ionicons name="alert-circle" size={16} color={Colors.error} />
                            <Text style={styles.errorText}>{error}</Text>
                        </View>
                    )}

                    {/* Username */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Username</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="person-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your username"
                                placeholderTextColor={Colors.textTertiary}
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                autoCorrect={false}
                                returnKeyType="next"
                            />
                        </View>
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Password</Text>
                        <View style={styles.inputWrapper}>
                            <Ionicons name="lock-closed-outline" size={18} color={Colors.textTertiary} style={styles.inputIcon} />
                            <TextInput
                                style={[styles.input, { flex: 1 }]}
                                placeholder="Enter your password"
                                placeholderTextColor={Colors.textTertiary}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                returnKeyType="done"
                                onSubmitEditing={handleLogin}
                            />
                            <TouchableOpacity
                                onPress={() => setShowPassword(!showPassword)}
                                style={styles.eyeButton}
                            >
                                <Ionicons
                                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                                    size={20}
                                    color={Colors.textTertiary}
                                />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Sign in Button */}
                    <TouchableOpacity
                        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <ActivityIndicator size="small" color={Colors.white} />
                        ) : (
                            <>
                                <Ionicons name="log-in-outline" size={20} color={Colors.white} />
                                <Text style={styles.loginButtonText}>Sign In</Text>
                            </>
                        )}
                    </TouchableOpacity>

                </View>

                {/* Footer */}
                <Text style={styles.footer}>© 2025 EGPB Ticket System</Text>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    bgTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%',
        backgroundColor: Colors.primary,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
    },
    bgBottom: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '45%',
        backgroundColor: Colors.primaryDark,
        borderBottomLeftRadius: 40,
        borderBottomRightRadius: 40,
        opacity: 0.3,
    },
    innerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: Spacing.xxl,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: Spacing.xxxl,
    },
    logoIcon: {
        width: 60,
        height: 60,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: Spacing.md,
        ...Shadow.lg,
    },
    logoLetter: {
        fontSize: 28,
        fontWeight: FontWeight.extrabold,
        color: Colors.primary,
    },
    brandName: {
        fontSize: FontSize.xxl,
        fontWeight: FontWeight.bold,
        color: Colors.white,
    },
    brandAccent: {
        color: '#bbf7d0',
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    card: {
        width: Math.min(width - 48, 400),
        backgroundColor: Colors.white,
        borderRadius: BorderRadius.xl,
        padding: Spacing.xxl,
        ...Shadow.lg,
    },
    cardTitle: {
        fontSize: FontSize.xl,
        fontWeight: FontWeight.bold,
        color: Colors.text,
        marginBottom: 4,
    },
    cardSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.xl,
    },
    errorBox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.errorBg,
        borderWidth: 1,
        borderColor: Colors.errorBorder,
        borderRadius: BorderRadius.md,
        padding: Spacing.md,
        marginBottom: Spacing.lg,
    },
    errorText: {
        fontSize: FontSize.sm,
        color: Colors.error,
        flex: 1,
    },
    inputGroup: {
        marginBottom: Spacing.lg,
    },
    label: {
        fontSize: FontSize.sm,
        fontWeight: FontWeight.medium,
        color: Colors.text,
        marginBottom: 6,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.md,
        overflow: 'hidden',
    },
    inputIcon: {
        marginLeft: Spacing.md,
    },
    input: {
        flex: 1,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        fontSize: FontSize.md,
        color: Colors.text,
    },
    eyeButton: {
        padding: Spacing.md,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.sm,
        ...Shadow.md,
    },
    loginButtonDisabled: {
        opacity: 0.7,
    },
    loginButtonText: {
        fontSize: FontSize.md,
        fontWeight: FontWeight.semibold,
        color: Colors.white,
    },
    footer: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.5)',
        marginTop: Spacing.xxl,
    },
});
