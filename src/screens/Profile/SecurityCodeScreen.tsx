import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
	View,
	Text,
	StyleSheet,
	ScrollView,
	TouchableOpacity,
	ActivityIndicator,
	Alert,
	Modal,
	TextInput,
	RefreshControl,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { SIZES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import type { RootStackParamList } from '../../navigation';
import {
	securityPinService,
	SecurityPinStatus,
	TrustedDevice,
} from '../../services';

type SecurityCodeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SecurityCode'>;

type PinModalMode = 'change' | 'disable';

const PIN_LENGTH_OPTIONS: Array<{ value: 4 | 6; label: string; description: string }> = [
	{ value: 4, label: '4-Digit PIN', description: 'Fast unlock, suitable if your device is private.' },
	{ value: 6, label: '6-Digit PIN', description: 'Recommended for stronger protection.' },
];

const SecurityCodeScreen: React.FC = () => {
	const navigation = useNavigation<SecurityCodeScreenNavigationProp>();
	const { theme } = useTheme();
	const { refreshUser } = useAuth();
	const insets = useSafeAreaInsets();

	const [status, setStatus] = useState<SecurityPinStatus | null>(null);
	const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [errorMessage, setErrorMessage] = useState<string | null>(null);

	const [modalVisible, setModalVisible] = useState(false);
	const [modalMode, setModalMode] = useState<PinModalMode>('change');
	const [pinLength, setPinLength] = useState<4 | 6>(6);
	const [newPin, setNewPin] = useState('');
	const [confirmPin, setConfirmPin] = useState('');
	const [password, setPassword] = useState('');
	const [submitting, setSubmitting] = useState(false);

	const [revokingDeviceId, setRevokingDeviceId] = useState<string | null>(null);
	const [revokingAll, setRevokingAll] = useState(false);

	const fetchSecurityPinStatus = useCallback(async () => {
		try {
			setErrorMessage(null);
			const [statusResponse, devicesResponse] = await Promise.all([
				securityPinService.getStatus(),
				securityPinService.getTrustedDevices(),
			]);

			setStatus(statusResponse);
			setTrustedDevices(devicesResponse);
		} catch (error: any) {
			console.error('Security PIN status fetch error:', error);
			setErrorMessage(error?.message || 'Unable to load security PIN details.');
		} finally {
			setLoading(false);
			setRefreshing(false);
		}
	}, []);

	useFocusEffect(
		useCallback(() => {
			setLoading(true);
			fetchSecurityPinStatus();
		}, [fetchSecurityPinStatus]),
	);

	useEffect(() => {
		if (status?.pinLength === 4 || status?.pinLength === 6) {
			setPinLength(status.pinLength);
		}
	}, [status?.pinLength]);

	const handleRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchSecurityPinStatus();
	}, [fetchSecurityPinStatus]);

	const openChangeModal = useCallback(() => {
		setModalMode('change');
		setModalVisible(true);
		setNewPin('');
		setConfirmPin('');
		setPassword('');
	}, []);

	const openDisableModal = useCallback(() => {
		setModalMode('disable');
		setModalVisible(true);
		setNewPin('');
		setConfirmPin('');
		setPassword('');
	}, []);

	const closeModal = useCallback(() => {
		if (submitting) {
			return;
		}
		setModalVisible(false);
		setNewPin('');
		setConfirmPin('');
		setPassword('');
	}, [submitting]);

	const validatePinInput = useCallback(() => {
		if (modalMode !== 'change') {
			return true;
		}

		if (newPin.length !== pinLength) {
			Alert.alert('Invalid PIN', `Enter a ${pinLength}-digit PIN.`);
			return false;
		}

		if (confirmPin.length !== pinLength) {
			Alert.alert('Confirm PIN', 'Please re-enter the PIN to confirm.');
			return false;
		}

		if (newPin !== confirmPin) {
			Alert.alert('Mismatch', 'PINs do not match. Try again.');
			return false;
		}

		return true;
	}, [confirmPin, modalMode, newPin, pinLength]);

	const handleSubmitModal = useCallback(async () => {
		if (!password.trim()) {
			Alert.alert('Password Required', 'Enter your account password to continue.');
			return;
		}

		if (!validatePinInput()) {
			return;
		}

		try {
			setSubmitting(true);

			if (modalMode === 'change') {
				await securityPinService.change(password.trim(), newPin);
				Alert.alert('PIN Updated', 'Your security PIN has been updated successfully.');
			} else {
				await securityPinService.disable(password.trim());
				Alert.alert('PIN Disabled', 'Security PIN has been disabled. You can enable it again at any time.');
			}

			closeModal();
			await fetchSecurityPinStatus();
			await refreshUser();
		} catch (error: any) {
			console.error('Security PIN action error:', error);
			Alert.alert('Action Failed', error?.message || 'Unable to complete the request.');
		} finally {
			setSubmitting(false);
		}
	}, [closeModal, fetchSecurityPinStatus, modalMode, newPin, password, refreshUser, validatePinInput]);

	const confirmRevokeDevice = useCallback(
		(device: TrustedDevice) => {
			Alert.alert(
				'Remove Trusted Device',
				`This will require your security PIN the next time you log in from ${device.deviceName}. Continue?`,
				[
					{ text: 'Cancel', style: 'cancel' },
					{
						text: 'Remove',
						style: 'destructive',
						onPress: async () => {
							try {
								setRevokingDeviceId(device.id);
								await securityPinService.revokeDevice(device.id);
								await fetchSecurityPinStatus();
							} catch (error: any) {
								console.error('Revoke device error:', error);
								Alert.alert('Failed', error?.message || 'Unable to remove the device.');
							} finally {
								setRevokingDeviceId(null);
							}
						},
					},
				],
			);
		},
		[fetchSecurityPinStatus],
	);

	const confirmRevokeAll = useCallback(() => {
		Alert.alert(
			'Remove All Devices',
			'This will sign out all trusted devices. You will need your security PIN on every sign-in. Proceed?',
			[
				{ text: 'Cancel', style: 'cancel' },
				{
					text: 'Remove',
					style: 'destructive',
					onPress: async () => {
						try {
							setRevokingAll(true);
							await securityPinService.revokeAllDevices();
							await fetchSecurityPinStatus();
						} catch (error: any) {
							console.error('Revoke all devices error:', error);
							Alert.alert('Failed', error?.message || 'Unable to remove devices.');
						} finally {
							setRevokingAll(false);
						}
					},
				},
			],
		);
	}, [fetchSecurityPinStatus]);

	const handleNavigateToSetup = useCallback(() => {
		navigation.navigate('SecuritySetup');
	}, [navigation]);

	const formatDate = useCallback((value?: string) => {
		if (!value) {
			return '—';
		}

		try {
			const date = new Date(value);
			if (Number.isNaN(date.getTime())) {
				return '—';
			}
			return date.toLocaleString();
		} catch (error) {
			return value;
		}
	}, []);

	const headerOffsetStyle = useMemo(
		() => ({ paddingTop: Math.max(insets.top, 16) }),
		[insets.top],
	);

	if (loading) {
		return (
			<View style={[styles.loadingContainer, { backgroundColor: theme.background }]}> 
				<ActivityIndicator size="large" color={theme.primary} />
				<Text style={[styles.loadingText, { color: theme.textSecondary }]}>Checking your security settings…</Text>
			</View>
		);
	}

	return (
		<View style={[styles.container, { backgroundColor: theme.background }]}> 
			<View style={[styles.header, headerOffsetStyle]}> 
				<TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
					<Ionicons name="arrow-back" size={24} color={theme.text} />
				</TouchableOpacity>
				<Text style={[styles.headerTitle, { color: theme.text }]}>Security PIN</Text>
				<TouchableOpacity onPress={handleRefresh} style={styles.backButton}>
					{refreshing ? (
						<ActivityIndicator size="small" color={theme.text} />
					) : (
						<Ionicons name="refresh" size={22} color={theme.text} />
					)}
				</TouchableOpacity>
			</View>

			{errorMessage && (
				<View style={[styles.errorBanner, { backgroundColor: theme.error + '12', borderColor: theme.error + '40' }]}> 
					<Ionicons name="warning" size={18} color={theme.error} style={styles.errorIcon} />
					<Text style={[styles.errorText, { color: theme.error }]}>{errorMessage}</Text>
				</View>
			)}

			<ScrollView
				style={styles.scroll}
				refreshControl={(
					<RefreshControl
						refreshing={refreshing}
						onRefresh={handleRefresh}
						tintColor={theme.primary}
						colors={[theme.primary]}
					/>
				)}
				contentContainerStyle={styles.scrollContent}
				showsVerticalScrollIndicator={false}
			>
				<View style={[styles.card, { backgroundColor: theme.surface }]}> 
					<View style={styles.cardHeader}>
						<View style={[styles.cardIcon, { backgroundColor: theme.primary + '20' }]}> 
							<Ionicons name="keypad" size={24} color={theme.primary} />
						</View>
						<View style={styles.cardHeaderText}>
							<Text style={[styles.cardTitle, { color: theme.text }]}>
								{status?.hasPin ? 'Security PIN Enabled' : 'Security PIN Not Configured'}
							</Text>
							<Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
								{status?.hasPin
									? 'Your encrypted conversations are protected with a security PIN.'
									: 'Set up a security PIN to unlock encrypted messages on new devices.'}
							</Text>
						</View>
					</View>

					{status?.hasPin && (
						<View style={styles.metadataRow}>
							<View style={styles.metaItem}>
								<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>PIN Length</Text>
								<Text style={[styles.metaValue, { color: theme.text }]}>{status.pinLength} digits</Text>
							</View>
							<View style={styles.metaItem}>
								<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Created</Text>
								<Text style={[styles.metaValue, { color: theme.text }]}>{formatDate(status.createdAt)}</Text>
							</View>
							<View style={styles.metaItem}>
								<Text style={[styles.metaLabel, { color: theme.textSecondary }]}>Last Changed</Text>
								<Text style={[styles.metaValue, { color: theme.text }]}>{formatDate(status.lastChangedAt)}</Text>
							</View>
						</View>
					)}

					{status?.hasPin ? (
						<View style={styles.buttonGroup}>
							<TouchableOpacity style={styles.primaryButton} onPress={openChangeModal}>
								<LinearGradient colors={theme.gradient} style={styles.primaryButtonBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
									<Text style={styles.primaryButtonText}>Change PIN</Text>
								</LinearGradient>
							</TouchableOpacity>
							<TouchableOpacity style={styles.secondaryButton} onPress={openDisableModal}>
								<Text style={[styles.secondaryButtonText, { color: theme.error }]}>Disable PIN</Text>
							</TouchableOpacity>
						</View>
					) : (
						<TouchableOpacity style={styles.primaryButton} onPress={handleNavigateToSetup}>
							<LinearGradient colors={theme.gradient} style={styles.primaryButtonBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
								<Text style={styles.primaryButtonText}>Set Up Security PIN</Text>
							</LinearGradient>
						</TouchableOpacity>
					)}
				</View>

				<View style={[styles.card, { backgroundColor: theme.surface }]}> 
					<View style={styles.sectionHeader}>
						<Text style={[styles.sectionTitle, { color: theme.text }]}>Trusted Devices</Text>
						{trustedDevices.length > 0 && (
							<TouchableOpacity onPress={confirmRevokeAll} disabled={revokingAll}>
								{revokingAll ? (
									<ActivityIndicator size="small" color={theme.textSecondary} />
								) : (
									<Text style={[styles.inlineAction, { color: theme.primary }]}>Remove All</Text>
								)}
							</TouchableOpacity>
						)}
					</View>

					{trustedDevices.length === 0 ? (
						<View style={styles.emptyState}> 
							<Ionicons name="shield-checkmark" size={48} color={theme.primary + '60'} />
							<Text style={[styles.emptyTitle, { color: theme.text }]}>No trusted devices yet</Text>
							<Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>Devices you trust will appear here after verifying your security PIN during login.</Text>
						</View>
					) : (
						trustedDevices.map((device) => (
							<View key={device.id} style={[styles.deviceRow, { borderColor: theme.border }]}> 
								<View style={styles.deviceInfo}> 
									<Text style={[styles.deviceName, { color: theme.text }]}>{device.deviceName}</Text>
									<Text style={[styles.deviceMeta, { color: theme.textSecondary }]}>
										{device.deviceType} · Last used {formatDate(device.lastUsed)}
									</Text>
								</View>
								<TouchableOpacity
									style={styles.deviceAction}
									onPress={() => confirmRevokeDevice(device)}
									disabled={revokingDeviceId === device.id}
								>
									{revokingDeviceId === device.id ? (
										<ActivityIndicator size="small" color={theme.textSecondary} />
									) : (
										<Ionicons name="trash-outline" size={20} color={theme.error} />
									)}
								</TouchableOpacity>
							</View>
						))
					)}
				</View>

				<View style={[styles.card, { backgroundColor: theme.surface }]}> 
					<Text style={[styles.sectionTitle, { color: theme.text }]}>Best Practices</Text>
					<View style={styles.tipRow}>
						<Ionicons name="bulb" size={18} color={theme.primary} />
						<Text style={[styles.tipText, { color: theme.textSecondary }]}>Use a unique PIN that is not reused for device unlock or other apps.</Text>
					</View>
					<View style={styles.tipRow}>
						<Ionicons name="bulb" size={18} color={theme.primary} />
						<Text style={[styles.tipText, { color: theme.textSecondary }]}>Store your PIN in a password manager to keep it safe and memorable.</Text>
					</View>
					<View style={styles.tipRow}>
						<Ionicons name="bulb" size={18} color={theme.primary} />
						<Text style={[styles.tipText, { color: theme.textSecondary }]}>Revoke trusted devices you no longer use to reduce attack surface.</Text>
					</View>
				</View>
			</ScrollView>

			<Modal visible={modalVisible} transparent animationType="slide" onRequestClose={closeModal}>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalContent, { backgroundColor: theme.card }]}> 
						<View style={styles.modalHeader}>
							<Text style={[styles.modalTitle, { color: theme.text }]}>
								{modalMode === 'change' ? 'Change Security PIN' : 'Disable Security PIN'}
							</Text>
							<TouchableOpacity onPress={closeModal} disabled={submitting}>
								<Ionicons name="close" size={24} color={theme.textSecondary} />
							</TouchableOpacity>
						</View>

						{modalMode === 'change' && (
							<>
								<Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>Choose a PIN length and enter a new PIN.</Text>
								<View style={styles.pinLengthRow}>
									{PIN_LENGTH_OPTIONS.map((option) => (
										<TouchableOpacity
											key={option.value}
											style={[
												styles.lengthOption,
												{
													borderColor: pinLength === option.value ? theme.primary : theme.border,
													backgroundColor: pinLength === option.value ? theme.primary + '15' : theme.background,
												},
											]}
											onPress={() => setPinLength(option.value)}
											disabled={submitting}
										>
											<Text style={[styles.lengthLabel, { color: theme.text }]}>{option.label}</Text>
											<Text style={[styles.lengthDescription, { color: theme.textSecondary }]}>{option.description}</Text>
										</TouchableOpacity>
									))}
								</View>

								<View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
									<Text style={[styles.inputLabel, { color: theme.textSecondary }]}>New PIN</Text>
									<TextInput
										style={[styles.input, { color: theme.text }]}
										value={newPin}
										onChangeText={(value) => setNewPin(value.replace(/[^0-9]/g, ''))}
										keyboardType="number-pad"
										secureTextEntry
										maxLength={pinLength}
										editable={!submitting}
									/>
								</View>

								<View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
									<Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Confirm PIN</Text>
									<TextInput
										style={[styles.input, { color: theme.text }]}
										value={confirmPin}
										onChangeText={(value) => setConfirmPin(value.replace(/[^0-9]/g, ''))}
										keyboardType="number-pad"
										secureTextEntry
										maxLength={pinLength}
										editable={!submitting}
									/>
								</View>
							</>
						)}

						<View style={[styles.inputGroup, { backgroundColor: theme.surface, borderColor: theme.border }]}> 
							<Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Account Password</Text>
							<TextInput
								style={[styles.input, { color: theme.text }]}
								value={password}
								onChangeText={setPassword}
								secureTextEntry
								editable={!submitting}
							/>
						</View>

						<TouchableOpacity style={styles.modalPrimaryButton} onPress={handleSubmitModal} disabled={submitting}>
							<LinearGradient colors={theme.gradient} style={styles.modalPrimaryButtonBackground} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
								{submitting ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.modalPrimaryButtonText}>
										{modalMode === 'change' ? 'Save New PIN' : 'Disable PIN'}
									</Text>
								)}
							</LinearGradient>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</View>
	);
};

export default SecurityCodeScreen;

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	header: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingHorizontal: SIZES.padding,
	},
	backButton: {
		width: 44,
		height: 44,
		alignItems: 'center',
		justifyContent: 'center',
	},
	headerTitle: {
		fontSize: SIZES.h3,
		fontWeight: '700',
	},
	errorBanner: {
		flexDirection: 'row',
		alignItems: 'center',
		marginHorizontal: SIZES.padding,
		marginTop: 8,
		borderWidth: 1,
		borderRadius: 12,
		padding: 12,
		gap: 12,
	},
	errorIcon: {
		marginRight: 4,
	},
	errorText: {
		flex: 1,
		fontSize: SIZES.small,
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		padding: SIZES.padding,
		gap: 16,
		paddingBottom: 32,
	},
	card: {
		borderRadius: 20,
		padding: 20,
		gap: 16,
	},
	cardHeader: {
		flexDirection: 'row',
		gap: 16,
	},
	cardIcon: {
		width: 56,
		height: 56,
		borderRadius: 18,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardHeaderText: {
		flex: 1,
		gap: 4,
	},
	cardTitle: {
		fontSize: SIZES.h3,
		fontWeight: '700',
	},
	cardSubtitle: {
		fontSize: SIZES.body,
		lineHeight: 20,
	},
	metadataRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 16,
	},
	metaItem: {
		flexBasis: '30%',
		minWidth: 120,
		gap: 4,
	},
	metaLabel: {
		fontSize: SIZES.small,
		textTransform: 'uppercase',
		letterSpacing: 0.6,
	},
	metaValue: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	buttonGroup: {
		gap: 12,
	},
	primaryButton: {
		borderRadius: 16,
		overflow: 'hidden',
	},
	primaryButtonBackground: {
		height: 52,
		alignItems: 'center',
		justifyContent: 'center',
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: SIZES.body,
		fontWeight: '700',
	},
	secondaryButton: {
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 14,
		borderWidth: 1,
		borderColor: 'transparent',
	},
	secondaryButtonText: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	sectionHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	sectionTitle: {
		fontSize: SIZES.h4,
		fontWeight: '700',
	},
	inlineAction: {
		fontSize: SIZES.small,
		fontWeight: '600',
	},
	emptyState: {
		alignItems: 'center',
		gap: 12,
		paddingVertical: 24,
	},
	emptyTitle: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	emptySubtitle: {
		fontSize: SIZES.small,
		textAlign: 'center',
		lineHeight: 18,
		paddingHorizontal: 16,
	},
	deviceRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		paddingVertical: 16,
		borderTopWidth: 1,
	},
	deviceInfo: {
		flex: 1,
		gap: 4,
	},
	deviceName: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	deviceMeta: {
		fontSize: SIZES.small,
	},
	deviceAction: {
		padding: 10,
	},
	tipRow: {
		flexDirection: 'row',
		alignItems: 'flex-start',
		gap: 12,
	},
	tipText: {
		flex: 1,
		fontSize: SIZES.small,
		lineHeight: 18,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.45)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 24,
		gap: 16,
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	modalTitle: {
		fontSize: SIZES.h3,
		fontWeight: '700',
	},
	modalSubtitle: {
		fontSize: SIZES.small,
		lineHeight: 18,
	},
	pinLengthRow: {
		gap: 12,
	},
	lengthOption: {
		borderWidth: 1.5,
		borderRadius: 16,
		padding: 16,
		gap: 6,
	},
	lengthLabel: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	lengthDescription: {
		fontSize: SIZES.small,
		lineHeight: 18,
	},
	inputGroup: {
		borderWidth: 1,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 12,
		gap: 8,
	},
	inputLabel: {
		fontSize: SIZES.small,
		textTransform: 'uppercase',
		letterSpacing: 0.8,
	},
	input: {
		fontSize: SIZES.body,
		fontWeight: '600',
	},
	modalPrimaryButton: {
		borderRadius: 16,
		overflow: 'hidden',
	},
	modalPrimaryButtonBackground: {
		height: 52,
		justifyContent: 'center',
		alignItems: 'center',
	},
	modalPrimaryButtonText: {
		color: '#fff',
		fontSize: SIZES.body,
		fontWeight: '700',
	},
	loadingContainer: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		gap: 12,
		paddingHorizontal: 24,
	},
	loadingText: {
		fontSize: SIZES.body,
		textAlign: 'center',
	},
});
