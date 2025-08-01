import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, Modal, Dimensions, Alert } from 'react-native';
import { supabase } from '../supabase';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../context/ThemeContext';
import { useAssetConfig } from '../context/AssetContext';
import { useAuth } from '../hooks/useAuth';
import ScanArea from '../components/ScanArea';

const { width, height } = Dimensions.get('window');

// Barcode validation utility
const validateBarcode = (barcode: string, config: any): { isValid: boolean; error?: string } => {
  if (!barcode || !barcode.trim()) {
    return { isValid: false, error: 'Barcode cannot be empty' };
  }

  const trimmedBarcode = barcode.trim();

  // Check if organization has specific barcode format
  if (config?.barcodeFormat?.pattern) {
    try {
      const regex = new RegExp(config.barcodeFormat.pattern);
      if (!regex.test(trimmedBarcode)) {
        return { 
          isValid: false, 
          error: `Invalid barcode format. Expected: ${config.barcodeFormat.description || 'matches organization pattern'}`
        };
      }
    } catch (error) {
      console.warn('Invalid regex pattern in barcode config:', error);
      // Fall back to basic validation if regex is invalid
    }
  }

  // Basic validation - no special characters that could cause issues
  const basicPattern = /^[A-Za-z0-9\-_*%]+$/;
  if (!basicPattern.test(trimmedBarcode)) {
    return { 
      isValid: false, 
      error: 'Barcode contains invalid characters. Only letters, numbers, and basic symbols are allowed.' 
    };
  }

  // Length validation
  if (trimmedBarcode.length < 3) {
    return { isValid: false, error: 'Barcode too short (minimum 3 characters)' };
  }
  
  if (trimmedBarcode.length > 50) {
    return { isValid: false, error: 'Barcode too long (maximum 50 characters)' };
  }

  return { isValid: true };
};

// Order number validation utility
const validateOrderNumber = (orderNumber: string, config: any): { isValid: boolean; error?: string } => {
  if (!orderNumber || !orderNumber.trim()) {
    return { isValid: false, error: 'Order number cannot be empty' };
  }

  const trimmedOrder = orderNumber.trim();

  // Check if organization has specific order number format
  if (config?.orderNumberFormat?.pattern) {
    try {
      const regex = new RegExp(config.orderNumberFormat.pattern);
      if (!regex.test(trimmedOrder)) {
        return { 
          isValid: false, 
          error: `Invalid order format. Expected: ${config.orderNumberFormat.description || 'matches organization pattern'}`
        };
      }
    } catch (error) {
      console.warn('Invalid regex pattern in order number config:', error);
    }
  }

  // Basic alphanumeric validation
  const basicPattern = /^[A-Za-z0-9\-_]+$/;
  if (!basicPattern.test(trimmedOrder)) {
    return { 
      isValid: false, 
      error: 'Order number contains invalid characters. Only letters, numbers, hyphens, and underscores are allowed.' 
    };
  }

  return { isValid: true };
};

export default function ScanCylindersScreen() {
  const [search, setSearch] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderError, setOrderError] = useState('');
  const [customerBarcodeError, setCustomerBarcodeError] = useState('');
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { config: assetConfig } = useAssetConfig();
  const { organization } = useAuth();
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'customer' | 'order' | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const scanDelay = 1500; // ms
  const [showCustomerPopup, setShowCustomerPopup] = useState(false);
  const [showCustomerScan, setShowCustomerScan] = useState(false);
  const [showOrderScan, setShowOrderScan] = useState(false);

  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase
        .from('customers')
        .select('name, barcode, CustomerListID');
      if (error) {
        setError('Failed to load customers');
        setCustomers([]);
      } else {
        setCustomers(data || []);
      }
      setLoading(false);
    };
    fetchCustomers();
  }, []);

  useEffect(() => {
    if (scannerVisible) {
      setScanned(false);
    }
  }, [scannerVisible]);

  // Validate order number when it changes
  useEffect(() => {
    if (orderNumber.trim()) {
      const validation = validateOrderNumber(orderNumber, assetConfig);
      setOrderError(validation.isValid ? '' : validation.error || '');
    } else {
      setOrderError('');
    }
  }, [orderNumber, assetConfig]);

  // Validate customer barcode when search changes
  useEffect(() => {
    if (search.trim() && !selectedCustomer) {
      const validation = validateBarcode(search, assetConfig);
      setCustomerBarcodeError(validation.isValid ? '' : validation.error || '');
    } else {
      setCustomerBarcodeError('');
    }
  }, [search, selectedCustomer, assetConfig]);

  const filteredCustomers = (() => {
    if (!search.trim()) return customers;
    const lower = search.toLowerCase();
    
    // Enhanced filtering to handle both 'A' and 'a' endings
    const startsWith = customers.filter(c => (c.name?.toLowerCase() || '').startsWith(lower));
    const contains = customers.filter(c =>
      (c.name?.toLowerCase() || '').includes(lower) && !(c.name?.toLowerCase() || '').startsWith(lower)
    );
    
    // Barcode matching with case-insensitive handling
    const barcodeMatches = customers.filter(c => {
      if (!c.barcode) return false;
      
      const customerBarcode = c.barcode.trim();
      const searchBarcode = search.trim();
      
      // Exact match
      if (customerBarcode === searchBarcode) return true;
      
      // Handle case variations for barcodes ending with 'A' or 'a'
      if (searchBarcode.endsWith('A') || searchBarcode.endsWith('a')) {
        const baseBarcode = searchBarcode.slice(0, -1);
        const uppercaseVersion = baseBarcode + 'A';
        const lowercaseVersion = baseBarcode + 'a';
        
        return customerBarcode === uppercaseVersion || customerBarcode === lowercaseVersion;
      }
      
      // Case-insensitive partial match
      return customerBarcode.toLowerCase().includes(searchBarcode.toLowerCase());
    });
    
    // Combine all matches, removing duplicates
    const allMatches = [...startsWith, ...contains, ...barcodeMatches];
    const uniqueMatches = allMatches.filter((customer, index, self) => 
      index === self.findIndex(c => c.CustomerListID === customer.CustomerListID)
    );
    
    return uniqueMatches;
  })();

  const handleBarcodeScanned = ({ type, data }: { type: string; data: string }) => {
    if (scanned) return;
    setScanned(true);
    
    // Validate the scanned barcode
    const validation = validateBarcode(data, assetConfig);
    
    if (!validation.isValid) {
      Alert.alert(
        'Invalid Barcode',
        validation.error || 'The scanned barcode is not valid for this organization.',
        [
          { text: 'Try Again', onPress: () => setScanned(false) },
          { text: 'Cancel', onPress: () => setScannerVisible(false) }
        ]
      );
      return;
    }

    if (scannerTarget === 'customer') {
      setSearch(data);
      setShowCustomerScan(false);
    } else if (scannerTarget === 'order') {
      setOrderNumber(data);
      setShowOrderScan(false);
    }
    
    setScannerVisible(false);
    setScannerTarget(null);
    
    // Reset scanned state after delay
    setTimeout(() => setScanned(false), scanDelay);
  };

  const openScanner = async (target: 'customer' | 'order') => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to scan barcodes.');
        return;
      }
    }
    
    setScannerTarget(target);
    if (target === 'customer') {
      setShowCustomerScan(true);
    } else {
      setShowOrderScan(true);
    }
    setScannerVisible(true);
  };

  const canProceed = selectedCustomer && orderNumber.trim() && !orderError && !customerBarcodeError;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }, (showCustomerScan || showOrderScan) && styles.fullscreenContainer]}>
      {!showCustomerScan && !showOrderScan && (
        <>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Scan {assetConfig.assetDisplayNamePlural}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Select customer and enter order details to begin scanning
            </Text>
          </View>

          {/* Order Number Input */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Order Number</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: orderError ? colors.error : colors.border,
                    color: colors.text 
                  }
                ]}
                placeholder={assetConfig?.orderNumberFormat?.description || "Enter order number"}
                placeholderTextColor={colors.textSecondary}
                value={orderNumber}
                onChangeText={setOrderNumber}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={() => openScanner('order')}
              >
                <Text style={styles.scanButtonText}>📷</Text>
              </TouchableOpacity>
            </View>
            {orderError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{orderError}</Text>
            ) : assetConfig?.orderNumberFormat?.examples?.length > 0 ? (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Examples: {assetConfig.orderNumberFormat.examples.slice(0, 2).join(', ')}
              </Text>
            ) : null}
          </View>

          {/* Customer Selection */}
          <View style={styles.inputSection}>
            <Text style={[styles.label, { color: colors.text }]}>Customer</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input, 
                  { 
                    backgroundColor: colors.surface, 
                    borderColor: customerBarcodeError ? colors.error : colors.border,
                    color: colors.text 
                  }
                ]}
                placeholder={assetConfig?.barcodeFormat?.description || "Search customer or scan barcode"}
                placeholderTextColor={colors.textSecondary}
                value={selectedCustomer ? selectedCustomer.name : search}
                onChangeText={(text) => {
                  setSearch(text);
                  setSelectedCustomer(null);
                }}
                autoCapitalize="characters"
              />
              <TouchableOpacity
                style={[styles.scanButton, { backgroundColor: colors.primary }]}
                onPress={() => openScanner('customer')}
              >
                <Text style={styles.scanButtonText}>📷</Text>
              </TouchableOpacity>
            </View>
            {customerBarcodeError ? (
              <Text style={[styles.errorText, { color: colors.error }]}>{customerBarcodeError}</Text>
            ) : assetConfig?.barcodeFormat?.examples?.length > 0 ? (
              <Text style={[styles.helperText, { color: colors.textSecondary }]}>
                Barcode examples: {assetConfig.barcodeFormat.examples.slice(0, 2).join(', ')}
              </Text>
            ) : null}
          </View>

          {/* Customer List */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading customers...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={filteredCustomers}
              keyExtractor={(item) => item.CustomerListID}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.customerItem,
                    { 
                      backgroundColor: colors.surface, 
                      borderColor: colors.border,
                      borderWidth: selectedCustomer?.CustomerListID === item.CustomerListID ? 2 : 1,
                      borderColor: selectedCustomer?.CustomerListID === item.CustomerListID ? colors.primary : colors.border
                    }
                  ]}
                  onPress={() => {
                    setSelectedCustomer(item);
                    setSearch(item.name);
                    setCustomerBarcodeError('');
                  }}
                >
                  <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
                  <Text style={[styles.customerId, { color: colors.textSecondary }]}>{item.CustomerListID}</Text>
                  {item.barcode && (
                    <Text style={[styles.customerBarcode, { color: colors.textSecondary }]}>Barcode: {item.barcode}</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.customerList}
              showsVerticalScrollIndicator={false}
            />
          )}

          {/* Continue Button */}
          <TouchableOpacity
            style={[
              styles.continueButton,
              {
                backgroundColor: canProceed ? colors.primary : colors.border,
                opacity: canProceed ? 1 : 0.6
              }
            ]}
            onPress={() => {
              if (canProceed) {
                navigation.navigate('ScanCylindersAction', {
                  customer: selectedCustomer,
                  orderNumber: orderNumber.trim()
                });
              }
            }}
            disabled={!canProceed}
          >
            <Text style={[styles.continueButtonText, { color: canProceed ? '#FFFFFF' : colors.textSecondary }]}>
              Continue to Scanning
            </Text>
          </TouchableOpacity>
        </>
      )}

      {/* Camera Scanner Modals */}
      {showCustomerScan && (
        <Modal visible={showCustomerScan} animationType="slide">
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'code93', 'codabar', 'ean13', 'ean8', 'upc_a', 'upc_e'],
              }}
            >
              <ScanArea 
                title="Scan Customer Barcode"
                subtitle="Position the barcode within the frame"
                onClose={() => {
                  setShowCustomerScan(false);
                  setScannerVisible(false);
                }}
              />
            </CameraView>
          </View>
        </Modal>
      )}

      {showOrderScan && (
        <Modal visible={showOrderScan} animationType="slide">
          <View style={styles.scannerContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ['qr', 'pdf417', 'code128', 'code39', 'code93', 'codabar', 'ean13', 'ean8', 'upc_a', 'upc_e'],
              }}
            >
              <ScanArea 
                title="Scan Order Number"
                subtitle="Position the order barcode within the frame"
                onClose={() => {
                  setShowOrderScan(false);
                  setScannerVisible(false);
                }}
              />
            </CameraView>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  fullscreenContainer: {
    padding: 0,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  inputSection: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanButtonText: {
    fontSize: 20,
  },
  errorText: {
    fontSize: 14,
    marginTop: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerList: {
    flex: 1,
    marginBottom: 20,
  },
  customerItem: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  customerId: {
    fontSize: 14,
    marginBottom: 2,
  },
  customerBarcode: {
    fontSize: 12,
  },
  continueButton: {
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scannerContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
}); 