import React, { useState, useEffect ,useCallback} from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const API_URL = 'https://santalaceous-devout-ryder.ngrok-free.dev';

export default function ChartScreen() {
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [dailyTarget, setDailyTarget] = useState(null);
  const [todayActivity, setTodayActivity] = useState(null);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editForm, setEditForm] = useState({
    calories_target: '',
    protein_target: ''
  });
  const [saving, setSaving] = useState(false);
   

  const [chartData, setChartData] = useState(null);


  
  // This hook runs every single time the user navigates TO this screen
  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );
  const fetchData = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      setUserId(storedUserId);

      // Fetch daily targets
      const targetResponse = await fetch(`${API_URL}/daily-targets/${storedUserId}`);
      const targetData = await targetResponse.json();

      // Fetch today's activity
      const activityResponse = await fetch(`${API_URL}/daily-activity/${storedUserId}/today`);
      const activityData = await activityResponse.json();

      if (targetResponse.ok) {
        setDailyTarget(targetData.target);
        setEditForm({
          calories_target: targetData.target?.calories_target?.toString() || '',
          protein_target: targetData.target?.protein_target?.toString() || ''
        });
      }

      if (activityResponse.ok) {
        setTodayActivity(activityData.activity);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTarget = async () => {
    if (!editForm.calories_target || !editForm.protein_target) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`${API_URL}/daily-targets/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          calories_target: parseInt(editForm.calories_target),
          protein_target: parseInt(editForm.protein_target)
        })
      });

      const result = await response.json();

      if (response.ok) {
        setDailyTarget(result.target);
        setEditModalVisible(false);
        Alert.alert('Success', 'Daily target updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update target');
      }
    } catch (error) {
      console.error('Error saving target:', error);
      Alert.alert('Error', 'Network error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show setup screen if no target
  if (!dailyTarget) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🎯</Text>
          <Text style={styles.emptyTitle}>Set Your Daily Goals</Text>
          <Text style={styles.emptyText}>
            Define your daily calorie and protein targets to start tracking your nutrition
          </Text>
          <TouchableOpacity 
            style={styles.setupButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.setupButtonText}>Set Daily Target</Text>
          </TouchableOpacity>
        </View>

        {/* Target Setup Modal */}
        <TargetModal 
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          editForm={editForm}
          setEditForm={setEditForm}
          onSave={handleSaveTarget}
          saving={saving}
          title="Set Daily Target"
        />
      </SafeAreaView>
    );
  }

  const caloriesPercent = todayActivity 
    ? Math.min((todayActivity.calories_consumed / dailyTarget.calories_target) * 100, 100)
    : 0;

  const proteinPercent = todayActivity 
    ? Math.min((todayActivity.protein_consumed / dailyTarget.protein_target) * 100, 100)
    : 0;

  const caloriesRemaining = dailyTarget.calories_target - (todayActivity?.calories_consumed || 0);
  const proteinRemaining = dailyTarget.protein_target - (todayActivity?.protein_consumed || 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Daily Nutrition</Text>
            <Text style={styles.headerSubtitle}>Track your progress</Text>
          </View>
          <TouchableOpacity 
            style={styles.editTargetButton}
            onPress={() => setEditModalVisible(true)}
          >
            <Text style={styles.editTargetText}>⚙️ Edit Target</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Summary Card */}
        <View style={styles.summaryCard}>
          <LinearGradient
            colors={['#10B981', '#059669']}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 1}}
            style={styles.summaryGradient}
          >
            <Text style={styles.summaryDate}>Today's Progress</Text>
            <Text style={styles.summaryPercentage}>
              {Math.round((caloriesPercent + proteinPercent) / 2)}%
            </Text>
            <Text style={styles.summaryLabel}>Overall Completion</Text>
          </LinearGradient>
        </View>

        {/* Calories Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>🔥 Calories</Text>
              <Text style={styles.progressSubtitle}>
                {todayActivity?.calories_consumed || 0} / {dailyTarget.calories_target} kcal
              </Text>
            </View>
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingText}>
                {caloriesRemaining > 0 ? `${caloriesRemaining} left` : 'Goal reached! 🎉'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${caloriesPercent}%`,
                    backgroundColor: caloriesPercent >= 100 ? '#10B981' : '#f59e0b'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentText}>{Math.round(caloriesPercent)}%</Text>
          </View>

          {/* Mini Stats */}
          <View style={styles.miniStats}>
            <MiniStat label="Target" value={`${dailyTarget.calories_target}`} />
            <MiniStat label="Consumed" value={`${todayActivity?.calories_consumed || 0}`} />
            <MiniStat label="Remaining" value={`${Math.max(caloriesRemaining, 0)}`} />
          </View>
        </View>

        {/* Protein Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View>
              <Text style={styles.progressTitle}>💪 Protein</Text>
              <Text style={styles.progressSubtitle}>
                {todayActivity?.protein_consumed || 0} / {dailyTarget.protein_target} g
              </Text>
            </View>
            <View style={styles.remainingBadge}>
              <Text style={styles.remainingText}>
                {proteinRemaining > 0 ? `${proteinRemaining}g left` : 'Goal reached! 🎉'}
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill, 
                  { 
                    width: `${proteinPercent}%`,
                    backgroundColor: proteinPercent >= 100 ? '#10B981' : '#3b82f6'
                  }
                ]} 
              />
            </View>
            <Text style={styles.progressPercentText}>{Math.round(proteinPercent)}%</Text>
          </View>

          {/* Mini Stats */}
          <View style={styles.miniStats}>
            <MiniStat label="Target" value={`${dailyTarget.protein_target}g`} />
            <MiniStat label="Consumed" value={`${todayActivity?.protein_consumed || 0}g`} />
            <MiniStat label="Remaining" value={`${Math.max(proteinRemaining, 0)}g`} />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
           
            <ActionButton icon="📊" label="View History" />
            <ActionButton icon="📈" label="Analytics" />
          </View>
        </View>

      </ScrollView>

      {/* Target Edit Modal */}
      <TargetModal 
        visible={editModalVisible}
        onClose={() => setEditModalVisible(false)}
        editForm={editForm}
        setEditForm={setEditForm}
        onSave={handleSaveTarget}
        saving={saving}
        title="Edit Daily Target"
      />
    </SafeAreaView>
  );
}

const MiniStat = ({ label, value }) => (
  <View style={styles.miniStatItem}>
    <Text style={styles.miniStatLabel}>{label}</Text>
    <Text style={styles.miniStatValue}>{value}</Text>
  </View>
);

const ActionButton = ({ icon, label, onPress }) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <Text style={styles.actionIcon}>{icon}</Text>
    <Text style={styles.actionLabel}>{label}</Text>
  </TouchableOpacity>
);

const TargetModal = ({ visible, onClose, editForm, setEditForm, onSave, saving, title }) => (
  <Modal
    visible={visible}
    animationType="slide"
    transparent={true}
    onRequestClose={onClose}
  >
    <SafeAreaView style={styles.modalOverlay} edges={['top']}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.modalClose}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>🔥 Daily Calorie Target</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.calories_target}
              onChangeText={(text) => setEditForm({...editForm, calories_target: text})}
              keyboardType="number-pad"
              placeholder="e.g., 2000"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.inputHint}>Recommended: 1800-2500 kcal per day</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>💪 Daily Protein Target</Text>
            <TextInput
              style={styles.textInput}
              value={editForm.protein_target}
              onChangeText={(text) => setEditForm({...editForm, protein_target: text})}
              keyboardType="number-pad"
              placeholder="e.g., 150"
              placeholderTextColor="#64748b"
            />
            <Text style={styles.inputHint}>Recommended: 0.8-2.0g per kg body weight</Text>
          </View>

          <TouchableOpacity 
            style={[styles.saveButton, saving && styles.saveButtonDisabled]} 
            onPress={onSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Target</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </SafeAreaView>
  </Modal>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020617' },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    marginTop: 16,
    fontSize: 16,
    fontWeight: '600',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 30,
  },
  setupButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  setupButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#fff',
  },
  headerSubtitle: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
  },
  editTargetButton: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  editTargetText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
  },

  summaryCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    overflow: 'hidden',
  },
  summaryGradient: {
    padding: 32,
    alignItems: 'center',
  },
  summaryDate: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  summaryPercentage: {
    color: '#fff',
    fontSize: 56,
    fontWeight: '900',
    marginBottom: 4,
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontWeight: '700',
  },

  progressCard: {
    backgroundColor: '#0f172a',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  progressTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '900',
    marginBottom: 4,
  },
  progressSubtitle: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },
  remainingBadge: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  remainingText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },

  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBarBackground: {
    flex: 1,
    height: 16,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 20,
  },
  progressPercentText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    width: 50,
  },

  miniStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  miniStatItem: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  miniStatLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  miniStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },

  actionsCard: {
    backgroundColor: '#0f172a',
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent:'center',
    alignItems:'center'
  },
  actionsTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    justifyContent:'space-between',
    gap: 12,
  },
  actionButton: {
    width: (width - 88) / 2,
    backgroundColor: '#020617',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
  },
  modalClose: {
    color: '#64748b',
    fontSize: 28,
    fontWeight: '600',
  },

  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#020617',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 8,
  },
  inputHint: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },

  saveButton: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    marginTop: 10,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
});