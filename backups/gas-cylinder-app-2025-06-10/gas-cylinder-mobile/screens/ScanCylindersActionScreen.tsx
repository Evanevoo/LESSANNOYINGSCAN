import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Dimensions, TextInput } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRoute } from '@react-navigation/native';
import { supabase } from '../supabase';

const { width } = Dimensions.get('window');

export default function ScanCylindersActionScreen() {
  const route = useRoute();
  const { customer, orderNumber } = route.params || {};
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [mode, setMode] = useState('SHIP'); // 'SHIP' or 'RETURN'
  const [shipCount, setShipCount] = useState(0);
  const [returnCount, setReturnCount] = useState(0);
  const [showManual, setShowManual] = useState(false);
  const [scanError, setScanError] = useState('');
  const [scannedShip, setScannedShip] = useState([]);
  const [scannedReturn, setScannedReturn] = useState([]);
  const [manualBarcode, setManualBarcode] = useState('');
  const [manualMode, setManualMode] = useState('SHIP');
  const [manualError, setManualError] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const isValidBarcode = (barcode) => /^\d{9}$/.test(barcode);

  const handleBarcodeScanned = ({ data }) => {
    const barcode = data.trim();
    if (!isValidBarcode(barcode)) {
      setScanError('Invalid barcode: must be exactly 9 numbers');
      setScanned(true);
      setTimeout(() => {
        setScanned(false);
        setScanError('');
      }, 1200);
      return;
    }
    // If barcode is in the other list, move it
    if (mode === 'SHIP' && scannedReturn.includes(barcode)) {
      setScannedReturn(list => list.filter(c => c !== barcode));
      setReturnCount(count => Math.max(0, count - 1));
      setScannedShip(list => [...list, barcode]);
      setShipCount(count => count + 1);
      setScanned(true);
      setTimeout(() => setScanned(false), 800);
      return;
    }
    if (mode === 'RETURN' && scannedShip.includes(barcode)) {
      setScannedShip(list => list.filter(c => c !== barcode));
      setShipCount(count => Math.max(0, count - 1));
      setScannedReturn(list => [...list, barcode]);
      setReturnCount(count => count + 1);
      setScanned(true);
      setTimeout(() => setScanned(false), 800);
      return;
    }
    // Prevent duplicate in the same list
    if ((mode === 'SHIP' && scannedShip.includes(barcode)) || (mode === 'RETURN' && scannedReturn.includes(barcode))) {
      setScanError('Barcode already scanned');
      setScanned(true);
      setTimeout(() => {
        setScanned(false);
        setScanError('');
      }, 1200);
      return;
    }
    setScanned(true);
    if (mode === 'SHIP') {
      setShipCount(count => count + 1);
      setScannedShip(list => [...list, barcode]);
    } else {
      setReturnCount(count => count + 1);
      setScannedReturn(list => [...list, barcode]);
    }
    setTimeout(() => setScanned(false), 800);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Text style={styles.header}>SCAN HERE</Text>
      {/* Scan Area */}
      <View style={styles.scanAreaWrapper}>
        {scanError ? (
          <View style={{ position: 'absolute', top: 10, left: 0, right: 0, alignItems: 'center', zIndex: 100 }}>
            <View style={{ backgroundColor: '#ff5a1f', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 14 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{scanError}</Text>
            </View>
          </View>
        ) : null}
        {!permission ? (
          <Text style={{ color: '#fff' }}>Requesting camera permission...</Text>
        ) : !permission.granted ? (
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', marginBottom: 16 }}>We need your permission to show the camera</Text>
            <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cameraContainer}>
            <CameraView
              style={styles.camera}
              facing="back"
              onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: [
                  'qr', 'ean13', 'ean8', 'upc_a', 'upc_e', 'code39', 'code93', 'code128', 'pdf417', 'aztec', 'datamatrix', 'itf14', 'interleaved2of5',
                ],
              }}
            />
            {/* Overlay border rectangle */}
            <View style={styles.scanBorder} />
            {/* Optional: darken area outside border */}
            <View style={styles.overlayTop} />
            <View style={styles.overlayBottom} />
            <View style={styles.overlayLeft} />
            <View style={styles.overlayRight} />
          </View>
        )}
      </View>
      {/* Mode Toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'SHIP' && styles.toggleButtonActive]}
          onPress={() => setMode('SHIP')}
        >
          <Text style={[styles.toggleText, mode === 'SHIP' && styles.toggleTextActive]}>SHIP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, mode === 'RETURN' && styles.toggleButtonActive]}
          onPress={() => setMode('RETURN')}
        >
          <Text style={[styles.toggleText, mode === 'RETURN' && styles.toggleTextActive]}>RETURN</Text>
        </TouchableOpacity>
      </View>
      {/* Counters */}
      <View style={styles.counterRow}>
        <View style={styles.counterBox}>
          <Text style={styles.counterNumber}>{shipCount}</Text>
          <Text style={styles.counterLabel}>SHIP</Text>
        </View>
        <View style={styles.counterBox}>
          <Text style={styles.counterNumber}>{returnCount}</Text>
          <Text style={styles.counterLabel}>RETURN</Text>
        </View>
      </View>
      {/* Scanned Barcodes List */}
      <View style={{ width: '90%', maxWidth: 400, marginBottom: 12 }}>
        {scannedShip.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 4 }}>Scanned for SHIP:</Text>
            {scannedShip.map((code, idx) => (
              <View key={code} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, backgroundColor: '#e0e7ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ flex: 1, color: '#222', fontSize: 15 }}>{code}</Text>
                <TouchableOpacity onPress={() => {
                  setScannedShip(list => list.filter(c => c !== code));
                  setShipCount(count => Math.max(0, count - 1));
                }} style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#ff5a1f', fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
        {scannedReturn.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 4 }}>Scanned for RETURN:</Text>
            {scannedReturn.map((code, idx) => (
              <View key={code} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2, backgroundColor: '#e0e7ff', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                <Text style={{ flex: 1, color: '#222', fontSize: 15 }}>{code}</Text>
                <TouchableOpacity onPress={() => {
                  setScannedReturn(list => list.filter(c => c !== code));
                  setReturnCount(count => Math.max(0, count - 1));
                }} style={{ marginLeft: 8 }}>
                  <Text style={{ color: '#ff5a1f', fontSize: 18 }}>🗑️</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
      {/* Manual Entry Button */}
      <TouchableOpacity style={styles.manualButton} onPress={() => setShowManual(true)}>
        <Text style={styles.manualButtonText}>Enter Barcode Manually</Text>
      </TouchableOpacity>
      {/* Manual Entry Modal (optional, can be implemented as needed) */}
      <Modal visible={showManual} transparent animationType="slide" onRequestClose={() => setShowManual(false)}>
        <View style={styles.manualModalBg}>
          <View style={styles.manualModalBox}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Manual Entry</Text>
            {/* Mode Toggle */}
            <View style={{ flexDirection: 'row', marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.toggleButton, manualMode === 'SHIP' && styles.toggleButtonActive]}
                onPress={() => setManualMode('SHIP')}
              >
                <Text style={[styles.toggleText, manualMode === 'SHIP' && styles.toggleTextActive]}>SHIP</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toggleButton, manualMode === 'RETURN' && styles.toggleButtonActive]}
                onPress={() => setManualMode('RETURN')}
              >
                <Text style={[styles.toggleText, manualMode === 'RETURN' && styles.toggleTextActive]}>RETURN</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.input, { marginBottom: 8 }]}
              placeholder="Enter barcode (numbers only)"
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="numeric"
              autoFocus
            />
            {manualError ? <Text style={{ color: '#ff5a1f', marginBottom: 8 }}>{manualError}</Text> : null}
            <TouchableOpacity
              style={[styles.manualButton, { marginBottom: 8 }]}
              onPress={() => {
                const barcode = manualBarcode.trim();
                if (!isValidBarcode(barcode)) {
                  setManualError('Invalid barcode: must be exactly 9 numbers');
                  return;
                }
                // If barcode is in the other list, move it
                if (manualMode === 'SHIP' && scannedReturn.includes(barcode)) {
                  setScannedReturn(list => list.filter(c => c !== barcode));
                  setReturnCount(count => Math.max(0, count - 1));
                  setScannedShip(list => [...list, barcode]);
                  setShipCount(count => count + 1);
                  setManualBarcode('');
                  setManualError('');
                  setShowManual(false);
                  return;
                }
                if (manualMode === 'RETURN' && scannedShip.includes(barcode)) {
                  setScannedShip(list => list.filter(c => c !== barcode));
                  setShipCount(count => Math.max(0, count - 1));
                  setScannedReturn(list => [...list, barcode]);
                  setReturnCount(count => count + 1);
                  setManualBarcode('');
                  setManualError('');
                  setShowManual(false);
                  return;
                }
                // Prevent duplicate in the same list
                if ((manualMode === 'SHIP' && scannedShip.includes(barcode)) || (manualMode === 'RETURN' && scannedReturn.includes(barcode))) {
                  setManualError('Barcode already scanned');
                  return;
                }
                if (manualMode === 'SHIP') {
                  setScannedShip(list => [...list, barcode]);
                  setShipCount(count => count + 1);
                } else {
                  setScannedReturn(list => [...list, barcode]);
                  setReturnCount(count => count + 1);
                }
                setManualBarcode('');
                setManualError('');
                setShowManual(false);
              }}
            >
              <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 16 }}>Add</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowManual(false)} style={styles.permissionButton}>
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Finish Button */}
      <View style={{ width: '100%', alignItems: 'center', marginTop: 16 }}>
        <TouchableOpacity
          style={[styles.manualButton, { backgroundColor: '#2563eb', marginBottom: 8 }]}
          disabled={syncing || (scannedShip.length === 0 && scannedReturn.length === 0)}
          onPress={() => setShowConfirm(true)}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 18 }}>Finish & Sync</Text>
        </TouchableOpacity>
        {syncing && <Text style={{ color: '#2563eb', marginTop: 8 }}>Syncing...</Text>}
        {syncResult ? <Text style={{ color: syncResult.startsWith('Error') ? '#ff5a1f' : '#2563eb', marginTop: 8 }}>{syncResult}</Text> : null}
      </View>
      {/* Confirmation Modal */}
      <Modal visible={showConfirm} transparent animationType="slide" onRequestClose={() => setShowConfirm(false)}>
        <View style={styles.manualModalBg}>
          <View style={[styles.manualModalBox, { maxHeight: '80%' }]}> 
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 12 }}>Confirm Sync</Text>
            <Text style={{ marginBottom: 8 }}>Please review all scanned/entered barcodes before syncing:</Text>
            {scannedShip.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 2 }}>SHIP:</Text>
                {scannedShip.map((code, idx) => (
                  <Text key={code} style={{ color: '#222', fontSize: 15 }}>{code}</Text>
                ))}
              </View>
            )}
            {scannedReturn.length > 0 && (
              <View style={{ marginBottom: 8 }}>
                <Text style={{ fontWeight: 'bold', color: '#2563eb', marginBottom: 2 }}>RETURN:</Text>
                {scannedReturn.map((code, idx) => (
                  <Text key={code} style={{ color: '#222', fontSize: 15 }}>{code}</Text>
                ))}
              </View>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.manualButton, { backgroundColor: '#e0e7ff', flex: 1, marginRight: 8 }]}
                onPress={() => setShowConfirm(false)}
              >
                <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.manualButton, { backgroundColor: '#2563eb', flex: 1, marginLeft: 8 }]}
                onPress={async () => {
                  setShowConfirm(false);
                  setSyncing(true);
                  setSyncResult('');
                  try {
                    const allBarcodes = [
                      ...scannedShip.map(bc => ({ order_number: orderNumber, cylinder_barcode: bc, mode: 'SHIP' })),
                      ...scannedReturn.map(bc => ({ order_number: orderNumber, cylinder_barcode: bc, mode: 'RETURN' })),
                    ];
                    const { error } = await supabase.from('scanned_cylinders').insert(allBarcodes);
                    if (error) setSyncResult('Error: ' + error.message);
                    else setSyncResult('Synced successfully!');
                  } catch (e) {
                    setSyncResult('Error: ' + e.message);
                  }
                  setSyncing(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Confirm & Sync</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const scanAreaSize = width * 0.7;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    paddingTop: 24,
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 1,
  },
  scanAreaWrapper: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 24,
  },
  cameraContainer: {
    width: scanAreaSize,
    height: scanAreaSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: scanAreaSize,
    height: scanAreaSize,
    borderRadius: 18,
    overflow: 'hidden',
  },
  scanBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: scanAreaSize,
    height: scanAreaSize,
    borderWidth: 4,
    borderColor: '#2563eb',
    borderRadius: 18,
    zIndex: 10,
  },
  overlayTop: {
    position: 'absolute',
    top: -scanAreaSize * 0.5,
    left: 0,
    width: scanAreaSize,
    height: scanAreaSize * 0.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: -scanAreaSize * 0.5,
    left: 0,
    width: scanAreaSize,
    height: scanAreaSize * 0.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
  },
  overlayLeft: {
    position: 'absolute',
    top: 0,
    left: -scanAreaSize * 0.2,
    width: scanAreaSize * 0.2,
    height: scanAreaSize,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  overlayRight: {
    position: 'absolute',
    top: 0,
    right: -scanAreaSize * 0.2,
    width: scanAreaSize * 0.2,
    height: scanAreaSize,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTopRightRadius: 18,
    borderBottomRightRadius: 18,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
    marginTop: 8,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 32,
    borderRadius: 16,
    backgroundColor: '#e0e7ff',
    marginHorizontal: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#2563eb',
  },
  toggleText: {
    fontSize: 18,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  toggleTextActive: {
    color: '#fff',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  counterBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 32,
    marginHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    minWidth: 90,
  },
  counterNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 4,
  },
  counterLabel: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  manualButton: {
    marginTop: 8,
    backgroundColor: '#e0e7ff',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  manualButtonText: {
    color: '#2563eb',
    fontWeight: 'bold',
    fontSize: 16,
  },
  permissionButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  manualModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manualModalBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    width: '80%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#2563eb',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
}); 