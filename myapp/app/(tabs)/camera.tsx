import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  Platform,
  UIManager,
  StatusBar,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { FontAwesome5, AntDesign, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import ReactNativeModal from 'react-native-modal';
import * as ImageManipulator from 'expo-image-manipulator';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const API_BASE_URL = 'https://santalaceous-devout-ryder.ngrok-free.dev';
const BACKEND_URL = `${API_BASE_URL}/predict`;
const FRAME_SIZE = 280; 

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView | null>(null);

  // States
  const [facing, setFacing] = useState<'front' | 'back'>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // New state for saving to DB
  const [prediction, setPrediction] = useState<{ class_name: string; probability: number } | null>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0);
  const [makeVisible,setMakeVisible]=useState(false);
  if (!permission) return <View style={{ flex: 1, backgroundColor: '#020617' }} />;

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#10B981" />
        <Text style={styles.permissionText}>Camera access is required for scanning</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleFlash = () => {
    setFlash(current => {
      if (current === 'off') return 'on';
      if (current === 'on') return 'auto';
      return 'off';
    });
  };

  const takePhoto = async () => {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 1.0 });
    const scale = photo.width / screenWidth;
    const photoCenterX = photo.width / 2;
    const photoCenterY = photo.height / 2;
    const cropSize = FRAME_SIZE * scale;
    const originX = photoCenterX - (cropSize / 2);
    const originY = photoCenterY - (cropSize / 2);

    const cropped = await ImageManipulator.manipulateAsync(
      photo.uri,
      [{ crop: { originX, originY, width: cropSize, height: cropSize } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    setPhotoUri(cropped.uri);
    setVisible(true);
    sendForPrediction(cropped.uri);
  };

  const sendForPrediction = async (uri: string) => {
    try {
      setLoading(true);
      setError(null);
      setNutrition(null);

      const formData = new FormData();
      formData.append('file', { uri, name: 'food.jpg', type: 'image/jpeg' } as any);

      const res = await fetch(BACKEND_URL, { method: 'POST', body: formData });
      if (!res.ok) throw new Error();
      
      const json = await res.json();
      setPrediction({ class_name: json.food, probability: json.confidence });
      setNutrition(json.nutrition);
    } catch {
      setError('Analysis failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // --- NEW LOGIC: SAVE TO DAILY INTAKE ---
  const handleSaveToDailyIntake = async () => {
    if (!nutrition) return;

    try {
      setSaving(true);
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        Alert.alert("Error", "User not logged in");
        return;
      }

      // 1. Fetch current totals for today
      const getRes = await fetch(`${API_BASE_URL}/daily-activity/${userId}/today`);
      const getData = await getRes.json();

      if (getRes.ok) {
        const currentCals = getData.activity.calories_consumed || 0;
        const currentProtein = getData.activity.protein_consumed || 0;

        // 2. Calculate new totals
        const newCals = currentCals + (nutrition.calories_kcal || 0);
        const newProtein = currentProtein + (nutrition.protein_g || 0);

        // 3. Update the database
        const updateRes = await fetch(`${API_BASE_URL}/daily-activity/${userId}/today`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            calories_consumed: Math.ceil(newCals),
            protein_consumed: Math.ceil(newProtein)
          })
        });

        if (updateRes.ok) {
          setMakeVisible(true);
         
        } else {
          throw new Error("Failed to update daily log");
        }
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Error", "Could not save to daily intake.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView 
        ref={cameraRef} 
        style={styles.camera} 
        facing={facing} 
        zoom={zoom} 
        flash={flash}
      />

      <View style={styles.overlayContainer} pointerEvents="none">
        <View style={styles.scannerFrame}>
          <View style={styles.cornerTopLeft} />
          <View style={styles.cornerTopRight} />
          <View style={styles.cornerBottomLeft} />
          <View style={styles.cornerBottomRight} />
        </View>
        <Text style={styles.scanHint}>Focus food inside the square</Text>
      </View>

      <View style={styles.topControls}>
        <TouchableOpacity onPress={() => setFacing(f => f === 'back' ? 'front' : 'back')} style={styles.controlButton}>
          <MaterialCommunityIcons name="camera-flip" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={toggleFlash} style={[styles.controlButton, { marginTop: 15 }]}>
          <Ionicons 
            name={flash === 'on' ? "flash" : flash === 'auto' ? "flash-outline" : "flash-off"} 
            size={22} 
            color={flash === 'off' ? "#9CA3AF" : "#FBBF24"} 
          />
          {flash === 'auto' && <Text style={styles.autoText}>A</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInterface}>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={0.8}
          onValueChange={setZoom}
          minimumTrackTintColor="#10B981"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#fff"
        />
        <TouchableOpacity style={styles.captureOuter} onPress={takePhoto}>
          <LinearGradient colors={['#10B981', '#059669']} style={styles.captureInner}>
            <FontAwesome5 name="camera" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <ReactNativeModal isVisible={visible} style={{ margin: 0 }} backdropOpacity={1} >
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setVisible(false)} style={styles.closeButton}>
              <AntDesign name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nutrition Analysis</Text>
            <View style={{ width: 44 }} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 60 }}>
            {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} />}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.loadingText}>Analyzing Macros & Micros...</Text>
              </View>
            ) : prediction ? (
              <View style={styles.resultWrapper}>
                <LinearGradient colors={['#111827', '#020617']} style={styles.predictionCard}>
                  <Text style={styles.predictionEmoji}>🥗</Text>
                  <Text style={styles.predictionName}>{prediction.class_name}</Text>
                  <View style={styles.accuracyBadge}>
                    <Text style={styles.accuracyText}>{prediction.probability}% confidence</Text>
                  </View>
                </LinearGradient>

        
                <TouchableOpacity 
                  style={[styles.saveLogButton, saving && { opacity: 0.7 }]} 
                  onPress={handleSaveToDailyIntake}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="add-circle-outline" size={22} color="#fff" />
                      <Text style={styles.saveLogButtonText}>Add to Daily Intake</Text>
                    </>
                  )}
                </TouchableOpacity>

                {nutrition && (
                  <>
                    <Text style={styles.sectionLabel}>CORE MACROS</Text>
                    <View style={styles.statsGrid}>
                      <StatBox emoji="🔥" label="Calories" value={nutrition.calories_kcal} unit="kcal" color="#10B981" />
                      <StatBox emoji="💪" label="Protein" value={nutrition.protein_g} unit="g" color="#3b82f6" />
                      <StatBox emoji="🍚" label="Carbs" value={nutrition.carbs_g} unit="g" color="#f59e0b" />
                      <StatBox emoji="🥑" label="Fat" value={nutrition.fat_g} unit="g" color="#ec4899" />
                    </View>

                    {nutrition.vitamins && (
                      <>
                        <Text style={styles.sectionLabel}>VITAMINS 💊</Text>
                        <View style={styles.detailCard}>
                          {Object.entries(nutrition.vitamins).map(([key, val]) => (
                            <DetailRow key={key} label={key} value={val as string} color="#6366f1" />
                          ))}
                        </View>
                      </>
                    )}

                    {nutrition.minerals && (
                      <>
                        <Text style={styles.sectionLabel}>MINERALS ⚡</Text>
                        <View style={styles.detailCard}>
                          {Object.entries(nutrition.minerals).map(([key, val]) => (
                            <DetailRow key={key} label={key} value={val as string} color="#14b8a6" />
                          ))}
                        </View>
                      </>
                    )}
                  </>
                )}
              </View>
            ) : error && (
              <View style={styles.errorContainer}>
                <Text style={{ fontSize: 40 }}>⚠️</Text>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </ReactNativeModal>
      <ReactNativeModal  onBackdropPress={()=> setMakeVisible(false)} onBackButtonPress={()=>setMakeVisible(false)} isVisible={makeVisible} animationIn='slideInUp' animationOut='slideOutDown' backdropOpacity={0.5} style={{margin:0, justifyContent:'center', alignItems:'center',backgroundColor:'rgba(0,0,0,0.8)'}}>
        <View style={{justifyContent:'center',alignItems:'center',height:200,backgroundColor:'#717483ff',borderRadius:20}}>
          <Text style={{color:'#fff', fontSize:20}}>"Successfully added {prediction?.class_name} to  daily log!</Text>
          </View>

      </ReactNativeModal>
    </View>
  );
}

// Sub-components
const StatBox = ({ emoji, label, value, unit, color }) => (
  <View style={styles.statBox}>
    <Text style={styles.statEmoji}>{emoji}</Text>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label} ({unit})</Text>
  </View>
);

const DetailRow = ({ label, value, color }) => (
  <View style={styles.detailRow}>
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.detailLabel}>{label}</Text>
    </View>
    <Text style={styles.detailValue}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  camera: { flex: 1 },
  overlayContainer: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center' },
  scannerFrame: { width: FRAME_SIZE, height: FRAME_SIZE, position: 'relative' },
  scanHint: { color: '#fff', marginTop: 30, fontWeight: '700', fontSize: 13, textTransform: 'uppercase', opacity: 0.7, letterSpacing: 1 },
  
  cornerTopLeft: { position: 'absolute', top: 0, left: 0, width: 45, height: 45, borderLeftWidth: 4, borderTopWidth: 4, borderColor: '#10B981', borderTopLeftRadius: 24 },
  cornerTopRight: { position: 'absolute', top: 0, right: 0, width: 45, height: 45, borderRightWidth: 4, borderTopWidth: 4, borderColor: '#10B981', borderTopRightRadius: 24 },
  cornerBottomLeft: { position: 'absolute', bottom: 0, left: 0, width: 45, height: 45, borderLeftWidth: 4, borderBottomWidth: 4, borderColor: '#10B981', borderBottomLeftRadius: 24 },
  cornerBottomRight: { position: 'absolute', bottom: 0, right: 0, width: 45, height: 45, borderRightWidth: 4, borderBottomWidth: 4, borderColor: '#10B981', borderBottomRightRadius: 24 },

  topControls: { position: 'absolute', top: 60, right: 20, alignItems: 'center' },
  controlButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(17, 24, 39, 0.8)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  autoText: { position: 'absolute', bottom: 8, right: 8, color: '#FBBF24', fontSize: 10, fontWeight: '900' },

  bottomInterface: { position: 'absolute', bottom: 40, width: '100%', alignItems: 'center' },
  slider: { width: 220, height: 40, marginBottom: 20 },
  captureOuter: { width: 88, height: 88, borderRadius: 44, backgroundColor: 'rgba(16, 185, 129, 0.2)', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 68, height: 68, borderRadius: 34, alignItems: 'center', justifyContent: 'center' },

  modalContent: { flex: 1, backgroundColor: '#020617' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 60 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  closeButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#111827', alignItems: 'center', justifyContent: 'center' },
  
  previewImage: { width: screenWidth - 40, height: 280, borderRadius: 32, alignSelf: 'center', marginBottom: 25, borderWidth: 1, borderColor: '#1f2937' },
  resultWrapper: { paddingHorizontal: 20 },
  
  predictionCard: { padding: 30, borderRadius: 28, alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#1f2937' },
  predictionEmoji: { fontSize: 48, marginBottom: 10 },
  predictionName: { color: '#fff', fontSize: 32, fontWeight: '900', textTransform: 'capitalize' },
  accuracyBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 12 },
  accuracyText: { color: '#10B981', fontWeight: '800', fontSize: 13 },

  // New Save Button Styles
  saveLogButton: { 
    backgroundColor: '#10B981', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 30 
  },
  saveLogButtonText: { color: '#fff', fontWeight: '900', fontSize: 16, marginLeft: 10 },

  sectionLabel: { color: '#6B7280', fontSize: 12, fontWeight: '800', letterSpacing: 1.5, marginBottom: 15, marginLeft: 5 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  statBox: { width: '48%', backgroundColor: '#111827', padding: 20, borderRadius: 24, marginBottom: 15, borderWidth: 1, borderColor: '#1f2937' },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { color: '#9CA3AF', fontSize: 12, marginTop: 4, fontWeight: '600' },

  detailCard: { backgroundColor: '#111827', borderRadius: 24, padding: 20, marginBottom: 25, borderWidth: 1, borderColor: '#1f2937' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f2937' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  detailLabel: { color: '#E5E7EB', fontWeight: '700', fontSize: 15 },
  detailValue: { color: '#9CA3AF', fontWeight: '600' },

  loadingContainer: { alignItems: 'center', marginTop: 60 },
  loadingText: { color: '#9CA3AF', marginTop: 20, fontSize: 16, fontWeight: '700' },
  errorContainer: { alignItems: 'center', marginTop: 60 },
  errorText: { color: '#ef4444', marginTop: 15, fontWeight: '700' },
  
  permissionContainer: { flex: 1, backgroundColor: '#020617', justifyContent: 'center', alignItems: 'center', padding: 40 },
  permissionText: { color: '#fff', fontSize: 18, fontWeight: '700', marginVertical: 20, textAlign: 'center' },
  permissionButton: { backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  permissionButtonText: { color: '#fff', fontWeight: '800' },
});