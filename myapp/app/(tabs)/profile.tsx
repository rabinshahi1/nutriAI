import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router'; // Added for redirection
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const API_URL = 'https://santalaceous-devout-ryder.ngrok-free.dev';

// --- Helper Components ---

const calculateBMI = (weight, height) => {
  if (!weight || !height || height === 0) return "0.0";
  const heightInMeters = height / 100;
  return (weight / (heightInMeters * heightInMeters)).toFixed(1);
};

const getBMICategory = (bmiValue) => {
  const bmi = parseFloat(bmiValue);
  if (bmi < 18.5) return { status: 'Underweight', color: '#3b82f6', emoji: '📉' };
  if (bmi < 25) return { status: 'Healthy', color: '#10B981', emoji: '💚' };
  if (bmi < 30) return { status: 'Overweight', color: '#f59e0b', emoji: '⚠️' };
  return { status: 'Obese', color: '#ef4444', emoji: '🔴' };
};

const BMIScale = ({ bmi }) => {
  const minBMI = 15;
  const maxBMI = 35;
  const normalizedPosition = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
  const clampedPosition = Math.max(0, Math.min(100, normalizedPosition));

  return (
    <View style={styles.bmiScaleContainer}>
      <Text style={styles.bmiScaleTitle}>BMI Scale</Text>
      <View style={styles.scaleBar}>
        <View style={[styles.scaleSegment, { backgroundColor: '#3b82f6', width: '23%' }]} />
        <View style={[styles.scaleSegment, { backgroundColor: '#10B981', width: '31%' }]} />
        <View style={[styles.scaleSegment, { backgroundColor: '#f59e0b', width: '23%' }]} />
        <View style={[styles.scaleSegment, { backgroundColor: '#ef4444', width: '23%' }]} />
      </View>
      <View style={[styles.indicator, { left: `${clampedPosition}%` }]}>
        <View style={styles.indicatorDot} />
        <View style={styles.indicatorLine} />
      </View>
      <View style={styles.scaleLabels}>
        <Text style={styles.scaleLabel}>15</Text>
        <Text style={styles.scaleLabel}>18.5</Text>
        <Text style={styles.scaleLabel}>25</Text>
        <Text style={styles.scaleLabel}>30</Text>
        <Text style={styles.scaleLabel}>35</Text>
      </View>
    </View>
  );
};

// --- Main Screen ---

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    age: 25,
    weight: 70,
    height: 170,
    gender: 'Male',
    timezone: 'UTC'
  });
  const [userId, setUserId] = useState(null);
  const [logoutModalVisible,setLogoutModalVisible]=useState(false);
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        setLoading(false);
        return;
      }
      setUserId(storedUserId);

      const response = await fetch(`${API_URL}/user/profile/${storedUserId}`);
      const result = await response.json();

      if (response.ok) {
        setUser({
          name: result.username,
          email: result.email,
          age: result.age || 0,
          weight: result.weight_kg || 0,
          height: result.height_cm || 0,
          gender: result.gender || 'Not Set',
          timezone: result.timezone || 'Not Set',
        });
      }
    } catch (error) {
      console.error('Fetch Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`${API_URL}/user/profile/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          height_cm: parseFloat(editForm.height),
          weight_kg: parseFloat(editForm.weight),
          age: parseInt(editForm.age),
          gender: editForm.gender,
          timezone: editForm.timezone
        })
      });

      if (response.ok) {
        setUser({ ...editForm });
        setEditModalVisible(false);
        Alert.alert('Success', 'Profile updated successfully!');
      } else {
        const errorData = await response.json();
        Alert.alert('Error', errorData.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Update Error:', error);
      Alert.alert('Error', 'Network error occurred');
    }
  };

  // --- LOGOUT LOGIC ---
  const handleLogout = async () => {
    
            try {
              await AsyncStorage.clear(); // Clears userId and all local data
              router.replace('/(auth)/login'); // Redirects to login screen
            } catch (e) {
              Alert.alert("Error", "Failed to logout");
            }
         
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !user.height || !user.weight || !user.age) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>Complete Your Profile</Text>
          <Text style={styles.emptyText}>Add your health information to get personalized nutrition insights</Text>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => {
              setEditForm({
                name: user?.name || '',
                email: user?.email || '',
                age: 25,
                weight: 70,
                height: 170,
                gender: 'Male',
                timezone: 'UTC'
              });
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.setupButtonText}>Setup Profile</Text>
          </TouchableOpacity>
          
          {/* Logout even from empty state */}
          <TouchableOpacity style={[styles.logoutButton, { marginTop: 20 }]} onPress={()=>setLogoutModalVisible(true)}>
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
          <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.absoluteClose} onPress={() => setLogoutModalVisible(false)} />
          <View style={styles.logoutModalContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={40} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Wait a moment!</Text>
            <Text style={styles.modalSub}>Are you sure you want to log out of your profile?</Text>
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleLogout}>
                <Text style={styles.confirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
        </View>
        {renderEditModal()}
      </SafeAreaView>
    );
  }

  const bmiValue = calculateBMI(user.weight, user.height);
  const bmiInfo = getBMICategory(bmiValue);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#020617" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <Text style={styles.subTitle}>AI Nutrition Profile</Text>
          </View>
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => {
              setEditForm(user);
              setEditModalVisible(true);
            }}
          >
            <Text style={styles.editButtonText}>✏️ Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bmiHeroCard}>
          <View style={styles.bmiHeroTop}>
            <Text style={styles.bmiLabel}>Your BMI</Text>
            <View style={[styles.statusBadge, { backgroundColor: bmiInfo.color + '20' }]}>
              <Text style={[styles.statusBadgeText, { color: bmiInfo.color }]}>
                {bmiInfo.emoji} {bmiInfo.status}
              </Text>
            </View>
          </View>
          <Text style={[styles.bmiValue, { color: bmiInfo.color }]}>{bmiValue}</Text>
          <BMIScale bmi={parseFloat(bmiValue)} />
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard icon="⚖️" label="Weight" value={`${user.weight} kg`} />
          <MetricCard icon="📏" label="Height" value={`${user.height} cm`} />
          <MetricCard icon="🎂" label="Age" value={`${user.age} yrs`} />
          <MetricCard 
            icon={user.gender === 'Male' ? '👨' : user.gender === 'Female' ? '👩' : '🧑'} 
            label="Gender" 
            value={user.gender}
          />
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoCardTitle}>Additional Information</Text>
          <InfoRow icon="🌍" label="Timezone" value={user.timezone} />
          <InfoRow icon="📊" label="BMI Category" value={bmiInfo.status} highlight={bmiInfo.color} />
        </View>

        <View style={styles.tipCard}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipTitle}>Health Tip</Text>
          <Text style={styles.tipText}>
            Your BMI is {bmiValue}. {bmiInfo.status === 'Healthy' 
              ? 'Keep maintaining your consistency!' 
              : 'Focus on balanced nutrition and regular activity.'}
          </Text>
        </View>

        {/* LOGOUT BUTTON */}
        <View  style={{alignItems:"center",justifyContent:'center'}}>
        


        <TouchableOpacity 
          style={styles.logoutAction} 
          onPress={() => setLogoutModalVisible(true)}
        >
          <View style={styles.logoutInner}>
            <Ionicons name="log-out-outline" size={22} color="#ef4444" />
            <Text style={styles.logoutText}>Logout Account</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#334155" />
        </TouchableOpacity>
        
        </View>
        
        <View style={{ height: 40 }} /> 
      </ScrollView>
      <Modal visible={logoutModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Pressable style={styles.absoluteClose} onPress={() => setLogoutModalVisible(false)} />
          <View style={styles.logoutModalContent}>
            <View style={styles.iconCircle}>
              <Ionicons name="alert-circle" size={40} color="#ef4444" />
            </View>
            <Text style={styles.modalTitle}>Wait a moment!</Text>
            <Text style={styles.modalSub}>Are you sure you want to log out of your profile?</Text>
            
            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setLogoutModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Stay</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleLogout}>
                <Text style={styles.confirmBtnText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {renderEditModal()}
    </SafeAreaView>
  );

  function renderEditModal() {
    return (
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              <InputField label="Weight (kg)" value={editForm.weight?.toString()} 
                onChangeText={(t) => setEditForm({...editForm, weight: t})} keyboardType="decimal-pad" />
              <InputField label="Height (cm)" value={editForm.height?.toString()} 
                onChangeText={(t) => setEditForm({...editForm, height: t})} keyboardType="decimal-pad" />
              <InputField label="Age" value={editForm.age?.toString()} 
                onChangeText={(t) => setEditForm({...editForm, age: t})} keyboardType="number-pad" />
              
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderButtons}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity key={g} 
                    style={[styles.genderButton, editForm.gender === g && styles.genderButtonActive]}
                    onPress={() => setEditForm({...editForm, gender: g})}>
                    <Text style={[styles.genderButtonText, editForm.gender === g && styles.genderButtonTextActive]}>{g}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <InputField label="Timezone" value={editForm.timezone} onChangeText={(t) => setEditForm({...editForm, timezone: t})} />
              
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }
}

// --- Internal UI Components ---

const MetricCard = ({ icon, label, value }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const InfoRow = ({ icon, label, value, highlight }) => (
  <View style={styles.infoRow}>
    <View style={styles.infoRowLeft}>
      <Text style={styles.infoRowIcon}>{icon}</Text>
      <Text style={styles.infoRowLabel}>{label}</Text>
    </View>
    <Text style={[styles.infoRowValue, highlight && { color: highlight }]}>{value}</Text>
  </View>
);

const InputField = ({ label, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.inputLabel}>{label}</Text>
    <TextInput
      style={styles.textInput}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
      placeholderTextColor="#64748b"
    />
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },
  header: { paddingHorizontal: 20, paddingVertical: 20, flexDirection: 'row', justifyContent: 'space-between' },
  userName: { fontSize: 26, fontWeight: '900', color: '#fff' },
  userEmail: { color: '#64748b', fontSize: 13, marginTop: 4 },
  subTitle: { color: '#10B981', fontSize: 11, fontWeight: '800', marginTop: 8, letterSpacing: 1 },
  editButton: { backgroundColor: '#0f172a', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: '#1e293b' },
  editButtonText: { color: '#10B981', fontWeight: '800' },
  bmiHeroCard: { backgroundColor: '#0f172a', marginHorizontal: 20, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20 },
  bmiHeroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bmiLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 12, fontWeight: '900' },
  bmiValue: { fontSize: 48, fontWeight: '900', marginVertical: 10 },
  bmiScaleContainer: { marginTop: 10 },
  bmiScaleTitle: { color: '#64748b', fontSize: 10, marginBottom: 8, textTransform: 'uppercase' },
  scaleBar: { height: 8, borderRadius: 4, flexDirection: 'row', overflow: 'hidden' },
  scaleSegment: { height: '100%' },
  indicator: { position: 'absolute', top: 18, marginLeft: -8 },
  indicatorDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#fff', borderWidth: 3, borderColor: '#10B981' },
  indicatorLine: { width: 2, height: 10, backgroundColor: '#fff', alignSelf: 'center', opacity: 0.5 },
  scaleLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
  scaleLabel: { color: '#64748b', fontSize: 10 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  metricCard: { width: (width - 52) / 2, backgroundColor: '#0f172a', borderRadius: 20, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  metricIcon: { fontSize: 28, marginBottom: 8 },
  metricLabel: { color: '#64748b', fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  metricValue: { color: '#fff', fontSize: 16, fontWeight: '900' },
  infoCard: { backgroundColor: '#0f172a', marginHorizontal: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 20 },
  infoCardTitle: { color: '#fff', fontSize: 16, fontWeight: '900', marginBottom: 15 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  infoRowLeft: { flexDirection: 'row', alignItems: 'center' },
  infoRowIcon: { marginRight: 10 },
  infoRowLabel: { color: '#94a3b8', fontSize: 14 },
  infoRowValue: { color: '#fff', fontWeight: '800' },
  tipCard: { backgroundColor: '#0f172a', marginHorizontal: 20, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: '#1e293b', marginBottom: 40 },
  tipIcon: { fontSize: 24, marginBottom: 8 },
  tipTitle: { color: '#10B981', fontWeight: '900', marginBottom: 4 },
  tipText: { color: '#64748b', fontSize: 13, lineHeight: 18 },
  
  // LOGOUT BUTTON STYLES
  logoutButton: {
    marginHorizontal: 10,
    backgroundColor: '#1e293b',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f4343430',
    width:300
  },
  logoutButtonText: {
    color: '#ef4444',
    fontSize: 15,
    fontWeight: '800',
  },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#64748b', marginTop: 10 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  emptyText: { color: '#64748b', textAlign: 'center', marginBottom: 30 },
  setupButton: { backgroundColor: '#10B981', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 },
  setupButtonText: { color: '#fff', fontWeight: '900' },
  
  modalContent: { backgroundColor: '#0f172a', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, maxHeight: '85%',width:500,borderBottomLeftRadius:30,borderBottomRightRadius:30 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
 
  modalClose: { color: '#64748b', fontSize: 24 },
  inputGroup: { marginBottom: 15 },
  inputLabel: { color: '#94a3b8', fontSize: 12, fontWeight: '800', marginBottom: 5 },
  textInput: { backgroundColor: '#020617', borderRadius: 12, padding: 15, color: '#fff', borderWidth: 1, borderColor: '#1e293b' },
  genderButtons: { flexDirection: 'row', gap: 10, marginVertical: 10 },
  genderButton: { flex: 1, backgroundColor: '#020617', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  genderButtonActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  genderButtonText: { color: '#64748b', fontWeight: '800' },
  genderButtonTextActive: { color: '#fff' },
  saveButton: { backgroundColor: '#10B981', padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  saveButtonText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  logoutAction: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    backgroundColor: '#0f172a', 
    marginHorizontal: 20, 
    marginTop: 30,
    padding: 18, 
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ef444420'
  },
  logoutInner: { flexDirection: 'row', alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: '800', fontSize: 16, marginLeft: 12 },

  // --- MODAL STYLES ---
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center' },
  absoluteClose: { ...StyleSheet.absoluteFillObject },
  logoutModalContent: { width: width * 0.85, backgroundColor: '#0f172a', borderRadius: 32, padding: 30, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ef444415', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginBottom: 10 },
  modalSub: { color: '#94a3b8', textAlign: 'center', lineHeight: 22, marginBottom: 30 },
  modalActionRow: { flexDirection: 'row', gap: 15 },
  cancelBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#1e293b' },
  cancelBtnText: { color: '#fff', fontWeight: '800' },
  confirmBtn: { flex: 1, paddingVertical: 15, borderRadius: 16, alignItems: 'center', backgroundColor: '#ef4444' },
  confirmBtnText: { color: '#fff', fontWeight: '900' }
});