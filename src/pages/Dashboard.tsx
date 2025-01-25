{/* Previous imports remain the same */}
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Activity, Weight, Ruler, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { convertWeight, formatWeight, convertLength, formatLength } from '../lib/units';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

{/* Previous interfaces remain the same */}
interface Profile {
  username: string;
  first_name: string;
  last_name: string;
  delivery_type: string;
  delivery_date: string;
  pre_pregnancy_weight: number;
  weight_unit: 'kg' | 'lbs';
}

interface Measurement {
  id: string;
  date: string;
  weight?: number;
  waist_size?: number;
  hip_size?: number;
  bust_size?: number;
}

interface ExerciseLog {
  id: string;
  date: string;
  exercise_type: string;
  duration_minutes: number;
  notes?: string;
}

// New interface for exercise suggestions
interface ExerciseSuggestion {
  name: string;
  description: string;
  duration: string;
  frequency: string;
  cautions?: string[];
}

interface Supplement {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  notes?: string;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'bedtime';
}

interface SupplementLog {
  id: string;
  supplement_id: string;
  supplement_name: string;
  date: string;
  taken: boolean;
  taken_at: string;
}

export default function Dashboard() {
  // Previous state declarations remain the same
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([]);
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [measurementUnit] = useState<'cm' | 'in'>('cm');

  const [newMeasurement, setNewMeasurement] = useState<Partial<Measurement>>({
    date: new Date().toISOString().split('T')[0],
  });
  const [newExercise, setNewExercise] = useState<Partial<ExerciseLog>>({
    date: new Date().toISOString().split('T')[0],
    exercise_type: '',
    duration_minutes: 0,
  });
  const [editingProfile, setEditingProfile] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Profile | null>(null);
  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [newSupplement, setNewSupplement] = useState<Partial<Supplement>>({
    name: '',
    dosage: '',
    frequency: 'daily',
    time_of_day: 'morning'
  });
  const [activeTab, setActiveTab] = useState<'measurements' | 'progress' | 'exercises' | 'profile' | 'supplements'>('measurements');

  // Function to calculate postpartum week
  const calculatePostpartumWeek = (deliveryDate: string): number => {
    const delivery = new Date(deliveryDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - delivery.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 7);
  };

  // Exercise suggestions based on postpartum week and delivery type
  const getExerciseSuggestions = (week: number, deliveryType: string): ExerciseSuggestion[] => {
    const suggestions: ExerciseSuggestion[] = [];

    // Basic breathing exercises (always included)
    suggestions.push({
      name: "Deep Breathing",
      description: "Practice deep diaphragmatic breathing while lying down or sitting comfortably.",
      duration: "5-10 minutes",
      frequency: "3-4 times daily",
    });

    // Pelvic floor exercises (always included)
    suggestions.push({
      name: "Kegel Exercises",
      description: "Gently contract and relax your pelvic floor muscles.",
      duration: "5-10 minutes",
      frequency: "3 times daily",
      cautions: ["Stop if you feel pain", "Don't hold your breath"],
    });

    if (week <= 2) {
      // Week 1-2
      suggestions.push({
        name: "Gentle Walking",
        description: "Short, slow walks around your home or garden.",
        duration: "5-10 minutes",
        frequency: "2-3 times daily",
        cautions: ["Listen to your body", "Stop if you feel dizzy or tired"],
      });

      if (deliveryType === 'vaginal') {
        suggestions.push({
          name: "Pelvic Tilts",
          description: "Lying on your back, gently tilt your pelvis while engaging your core.",
          duration: "5 minutes",
          frequency: "2-3 times daily",
          cautions: ["Keep movements small and gentle"],
        });
      }

    } else if (week <= 4) {
      // Week 3-4
      suggestions.push({
        name: "Extended Walking",
        description: "Gradually increase walking distance and duration.",
        duration: "15-20 minutes",
        frequency: "1-2 times daily",
        cautions: ["Maintain good posture", "Wear supportive shoes"],
      });

      suggestions.push({
        name: "Shoulder Rolls",
        description: "Gentle shoulder rotations to relieve upper body tension.",
        duration: "5 minutes",
        frequency: "2-3 times daily",
      });

      if (deliveryType === 'vaginal') {
        suggestions.push({
          name: "Bridge Pose",
          description: "Lying on your back, gently lift your hips off the ground.",
          duration: "5-10 minutes",
          frequency: "Once daily",
          cautions: ["Stop if you feel any discomfort"],
        });
      }

    } else if (week <= 6) {
      // Week 5-6
      suggestions.push({
        name: "Brisk Walking",
        description: "Increase walking pace while maintaining comfort.",
        duration: "20-30 minutes",
        frequency: "Daily",
      });

      suggestions.push({
        name: "Modified Planks",
        description: "Start with knee planks, focusing on proper form.",
        duration: "30 seconds",
        frequency: "2-3 sets daily",
        cautions: ["Check for diastasis recti", "Maintain proper alignment"],
      });

      if (deliveryType === 'c-section') {
        suggestions.push({
          name: "Scar Tissue Massage",
          description: "Gentle massage around the scar area (after healing).",
          duration: "5 minutes",
          frequency: "2-3 times daily",
          cautions: ["Wait for complete healing", "Use gentle pressure"],
        });
      }

    } else if (week <= 8) {
      // Week 7-8
      suggestions.push({
        name: "Swimming",
        description: "Gentle swimming or water walking (if cleared by doctor).",
        duration: "20-30 minutes",
        frequency: "2-3 times weekly",
        cautions: ["Wait for bleeding to stop", "Start slowly"],
      });

      suggestions.push({
        name: "Modified Squats",
        description: "Bodyweight squats with proper form.",
        duration: "10-15 repetitions",
        frequency: "2-3 sets daily",
        cautions: ["Keep feet hip-width apart", "Don't overexert"],
      });

    } else {
      // Week 8+
      suggestions.push({
        name: "Strength Training",
        description: "Light weights or resistance bands (if cleared by doctor).",
        duration: "20-30 minutes",
        frequency: "2-3 times weekly",
        cautions: ["Start with light weights", "Focus on form"],
      });

      suggestions.push({
        name: "Yoga",
        description: "Postpartum yoga classes or gentle home practice.",
        duration: "30 minutes",
        frequency: "2-3 times weekly",
        cautions: ["Modify poses as needed", "Listen to your body"],
      });
    }

    return suggestions;
  };

  // Previous useEffect and handlers remain the same
  useEffect(() => {
    async function loadData() {
      try {
        if (!user) {
          navigate('/login');
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile(profileData);
          setWeightUnit(profileData.weight_unit || 'kg');
        }

        const { data: measurementsData, error: measurementsError } = await supabase
          .from('measurements')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: true });

        if (measurementsError) throw measurementsError;

        const { data: exerciseData, error: exerciseError } = await supabase
          .from('exercise_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (exerciseError) throw exerciseError;

        setMeasurements(measurementsData || []);
        setExerciseLogs(exerciseData || []);

        // Load supplements and logs
        const { data: supplementsData, error: supplementsError } = await supabase
          .from('supplements')
          .select('*')
          .eq('user_id', user.id)
          .order('name');

        if (supplementsError) throw supplementsError;

        const { data: supplementLogsData, error: logsError } = await supabase
          .from('supplement_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(100);

        if (logsError) throw logsError;

        setSupplements(supplementsData || []);
        setSupplementLogs(supplementLogsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, navigate]);

  // Previous handlers remain the same
  const handleAddMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const measurementData = {
        user_id: user.id,
        date: newMeasurement.date,
        weight: newMeasurement.weight ? convertWeight(newMeasurement.weight, weightUnit, 'kg') : null,
        waist_size: newMeasurement.waist_size ? convertLength(newMeasurement.waist_size, measurementUnit, 'cm') : null,
        hip_size: newMeasurement.hip_size ? convertLength(newMeasurement.hip_size, measurementUnit, 'cm') : null,
        bust_size: newMeasurement.bust_size ? convertLength(newMeasurement.bust_size, measurementUnit, 'cm') : null,
      };

      const { error } = await supabase
        .from('measurements')
        .insert([measurementData]);

      if (error) throw error;

      const { data: newMeasurements, error: fetchError } = await supabase
        .from('measurements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true });

      if (fetchError) throw fetchError;

      setMeasurements(newMeasurements || []);
      setNewMeasurement({ date: new Date().toISOString().split('T')[0] });
    } catch (error) {
      console.error('Error adding measurement:', error);
    }
  };

  const handleAddExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newExercise.exercise_type || !newExercise.duration_minutes) return;

    try {
      const exerciseData = {
        user_id: user.id,
        date: newExercise.date,
        exercise_type: newExercise.exercise_type,
        duration_minutes: newExercise.duration_minutes,
        notes: newExercise.notes,
      };

      const { error } = await supabase
        .from('exercise_logs')
        .insert([exerciseData]);

      if (error) throw error;

      const { data: newExercises, error: fetchError } = await supabase
        .from('exercise_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

      if (fetchError) throw fetchError;

      setExerciseLogs(newExercises || []);
      setNewExercise({
        date: new Date().toISOString().split('T')[0],
        exercise_type: '',
        duration_minutes: 0,
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !editedProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: editedProfile.first_name,
          last_name: editedProfile.last_name,
          username: editedProfile.username,
          delivery_type: editedProfile.delivery_type,
          delivery_date: editedProfile.delivery_date,
          pre_pregnancy_weight: editedProfile.pre_pregnancy_weight,
          weight_unit: editedProfile.weight_unit,
        })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(editedProfile);
      setEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleAddSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newSupplement.name || !newSupplement.dosage) return;

    try {
      const supplementData = {
        user_id: user.id,
        name: newSupplement.name,
        dosage: newSupplement.dosage,
        frequency: newSupplement.frequency,
        time_of_day: newSupplement.time_of_day,
        notes: newSupplement.notes
      };

      const { error } = await supabase
        .from('supplements')
        .insert([supplementData]);

      if (error) throw error;

      const { data: updatedSupplements, error: fetchError } = await supabase
        .from('supplements')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (fetchError) throw fetchError;

      setSupplements(updatedSupplements || []);
      setNewSupplement({
        name: '',
        dosage: '',
        frequency: 'daily',
        time_of_day: 'morning'
      });
    } catch (error) {
      console.error('Error adding supplement:', error);
    }
  };

  const handleLogSupplement = async (supplementId: string, taken: boolean) => {
    if (!user) return;

    try {
      // Find the supplement to get its name
      const supplement = supplements.find(s => s.id === supplementId);
      if (!supplement) {
        console.error('Supplement not found');
        return;
      }

      // First check if a log exists for today
      const { data: existingLogs, error: checkError } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('supplement_id', supplementId)
        .eq('date', new Date().toISOString().split('T')[0]);

      if (checkError) throw checkError;

      let error;
      if (existingLogs && existingLogs.length > 0) {
        // Update existing log
        ({ error } = await supabase
          .from('supplement_logs')
          .update({
            taken,
            taken_at: taken ? new Date().toISOString() : null
          })
          .eq('id', existingLogs[0].id));
      } else {
        // Create new log
        ({ error } = await supabase
          .from('supplement_logs')
          .insert([{
            user_id: user.id,
            supplement_id: supplementId,
            supplement_name: supplement.name,
            date: new Date().toISOString().split('T')[0],
            taken,
            taken_at: taken ? new Date().toISOString() : null
          }]));
      }

      if (error) throw error;

      // Refresh the supplement logs after updating
      const { data: updatedLogs, error: fetchError } = await supabase
        .from('supplement_logs')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date');

      if (fetchError) throw fetchError;

      setSupplementLogs(updatedLogs || []);
    } catch (error) {
      console.error('Error logging supplement:', error);
    }
  };

  // Chart data configuration remains the same
  const chartData = {
    labels: [...measurements].reverse().map(m => format(new Date(m.date), 'MMM d')),
    datasets: [
      {
        label: 'Weight',
        data: [...measurements].reverse().map(m => m.weight ? convertWeight(m.weight, 'kg', weightUnit) : null),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Waist Size',
        data: [...measurements].reverse().map(m => m.waist_size ? convertLength(m.waist_size, 'cm', measurementUnit) : null),
        borderColor: 'rgb(251, 146, 60)',
        backgroundColor: 'rgba(251, 146, 60, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Hip Size',
        data: [...measurements].reverse().map(m => m.hip_size ? convertLength(m.hip_size, 'cm', measurementUnit) : null),
        borderColor: 'rgb(52, 211, 153)',
        backgroundColor: 'rgba(52, 211, 153, 0.5)',
        tension: 0.3,
      },
      {
        label: 'Bust Size',
        data: [...measurements].reverse().map(m => m.bust_size ? convertLength(m.bust_size, 'cm', measurementUnit) : null),
        borderColor: 'rgb(236, 72, 153)',
        backgroundColor: 'rgba(236, 72, 153, 0.5)',
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Recovery Progress',
      },
    },
    scales: {
      y: {
        beginAtZero: false,
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!profile?.username) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">Please complete your profile</h2>
          <p className="mt-2 text-gray-600">You need to complete your profile before accessing the dashboard.</p>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Complete Profile
          </button>
        </div>
      </div>
    );
  }

  const latestMeasurement = measurements[measurements.length - 1];
  const postpartumWeek = calculatePostpartumWeek(profile.delivery_date);
  const exerciseSuggestions = getExerciseSuggestions(postpartumWeek, profile.delivery_type);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Previous header and navigation remain the same */}
        <div className="md:flex md:items-center md:justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Welcome back, {profile.first_name}!
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {profile.delivery_type === 'c-section' ? 'C-Section' : 'Vaginal'} delivery on {format(new Date(profile.delivery_date), 'MMMM d, yyyy')}
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4 space-x-3">
            <button
              onClick={() => setActiveTab('measurements')}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                activeTab === 'measurements'
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              Measurements
            </button>
            <button
              onClick={() => setActiveTab('progress')}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                activeTab === 'progress'
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              Progress
            </button>
            <button
              onClick={() => setActiveTab('exercises')}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                activeTab === 'exercises'
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              Exercises
            </button>
              <button
              onClick={() => setActiveTab('supplements')}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                activeTab === 'supplements'
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              Supplements
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
                activeTab === 'profile'
                  ? 'border-transparent text-white bg-indigo-600 hover:bg-indigo-700'
                  : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
            >
              Profile
            </button>
          </div>
        </div>

        {activeTab === 'measurements' ? (
          <>
            {/* Previous measurements content remains the same */}
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Calendar className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Latest Entry</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {latestMeasurement ? format(new Date(latestMeasurement.date), 'MMM d, yyyy') : 'No entries yet'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Weight className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Current Weight</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {latestMeasurement?.weight
                            ? formatWeight(convertWeight(latestMeasurement.weight, 'kg', weightUnit), weightUnit)
                            : 'Not recorded'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Ruler className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Waist Size</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {latestMeasurement?.waist_size
                            ? formatLength(convertLength(latestMeasurement.waist_size, 'cm', measurementUnit), measurementUnit)
                            : 'Not recorded'}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <Activity className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">Recovery Progress</dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {Math.floor((Date.now() - new Date(profile.delivery_date).getTime()) / (1000 * 60 * 60 * 24))} days
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <form onSubmit={handleAddMeasurement} className="space-y-8 divide-y divide-gray-200 bg-white shadow sm:rounded-lg p-6">
                <div className="space-y-6">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Measurement</h3>
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                        Date
                      </label>
                      <div className="mt-1">
                        <input
                          type="date"
                          name="date"
                          id="date"
                          value={newMeasurement.date}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, date: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="weight" className="block text-sm font-medium text-gray-700">
                        Weight ({weightUnit})
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          step="0.1"
                          name="weight"
                          id="weight"
                          value={newMeasurement.weight || ''}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, weight: parseFloat(e.target.value) || undefined })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="waist" className="block text-sm font-medium text-gray-700">
                        Waist ({measurementUnit})
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          step="0.1"
                          name="waist"
                          id="waist"
                          value={newMeasurement.waist_size || ''}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, waist_size: parseFloat(e.target.value) || undefined })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="hips" className="block text-sm font-medium text-gray-700">
                        Hips ({measurementUnit})
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          step="0.1"
                          name="hips"
                          id="hips"
                          value={newMeasurement.hip_size || ''}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, hip_size: parseFloat(e.target.value) || undefined })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor="bust" className="block text-sm font-medium text-gray-700">
                        Bust ({measurementUnit})
                      </label>
                      <div className="mt-1">
                        <input
                          type="number"
                          step="0.1"
                          name="bust"
                          id="bust"
                          value={newMeasurement.bust_size || ''}
                          onChange={(e) => setNewMeasurement({ ...newMeasurement, bust_size: parseFloat(e.target.value) || undefined })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Measurement
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </>
        ) : activeTab === 'progress' ? (
          <div className="mt-8 bg-white shadow rounded-lg p-6">
            <Line options={chartOptions} data={chartData} />
          </div>
        ) : activeTab === 'exercises' ? (
          <div className="mt-8">
            <div className="bg-white shadow sm:rounded-lg mb-8">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Recommended Exercises - Week {postpartumWeek}
                </h3>
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11- 2 0 1 1 0 0zm0-2a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-yellow-800">Important Safety Guidelines</h3>
                        <div className="mt-2 text-sm text-yellow-700">
                          <ul className="list-disc pl-5 space-y-1">
                            <li>Always consult your healthcare provider before starting any exercise routine</li>
                            <li>Stop immediately if you experience pain or discomfort</li>
                            <li>Listen to your body and don't overexert yourself</li>
                            <li>Stay hydrated and maintain good posture</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {exerciseSuggestions.map((exercise, index) => (
                      <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
                        <div className="px-4 py-5 sm:p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-2">{exercise.name}</h4>
                          <p className="text-sm text-gray-500 mb-4">{exercise.description}</p>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Duration</dt>
                              <dd className="mt-1 text-sm text-gray-900">{exercise.duration}</dd>
                            </div>
                            <div className="sm:col-span-1">
                              <dt className="text-sm font-medium text-gray-500">Frequency</dt>
                              <dd className="mt-1 text-sm text-gray-900">{exercise.frequency}</dd>
                            </div>
                          </dl>
                          {exercise.cautions && (
                            <div className="mt-4">
                              <h5 className="text-sm font-medium text-red-800">Cautions:</h5>
                              <ul className="mt-2 list-disc pl-5 text-sm text-red-700">
                                {exercise.cautions.map((caution, idx) => (
                                  <li key={idx}>{caution}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Exercise Log</h3>
                <div className="mt-4 border-t border-gray-200">
                  <form onSubmit={handleAddExercise} className="space-y-6 divide-y divide-gray-200">
                    <div className="pt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label htmlFor="exercise-date" className="block text-sm font-medium text-gray-700">
                          Date
                        </label>
                        <div className="mt-1">
                          <input
                            type="date"
                            id="exercise-date"
                            value={newExercise.date}
                            onChange={(e) => setNewExercise({ ...newExercise, date: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="exercise-type" className="block text-sm font-medium text-gray-700">
                          Exercise Type
                        </label>
                        <div className="mt-1">
                          <select
                            id="exercise-type"
                            value={newExercise.exercise_type}
                            onChange={(e) => setNewExercise({ ...newExercise, exercise_type: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="">Select type</option>
                            <option value="walking">Walking</option>
                            <option value="swimming">Swimming</option>
                            <option value="yoga">Yoga</option>
                            <option value="stretching">Stretching</option>
                            <option value="kegel">Kegel Exercises</option>
                            <option value="pelvic-floor">Pelvic Floor Exercises</option>
                            <option value="light-cardio">Light Cardio</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                          Duration (minutes)
                        </label>
                        <div className="mt-1">
                          <input
                            type="number"
                            id="duration"
                            min="1"
                            value={newExercise.duration_minutes || ''}
                            onChange={(e) => setNewExercise({ ...newExercise, duration_minutes: parseInt(e.target.value) })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          Notes
                        </label>
                        <div className="mt-1">
                          <textarea
                            id="notes"
                            rows={3}
                            value={newExercise.notes || ''}
                            onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                            className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-5">
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Log Exercise
                        </button>
                      </div>
                    </div>
                  </form>
                </div>

                <div className="mt-8">
                  <h4 className="text-base font-medium text-gray-900">Recent Exercise History</h4>
                  <div className="mt-4 flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                  Date
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Exercise Type
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Duration
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Notes
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {exerciseLogs.map((log) => (
                                <tr key={log.id}>
                                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                    {format(new Date(log.date), 'MMM d, yyyy')}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {log.exercise_type.charAt(0).toUpperCase() + log.exercise_type.slice(1).replace('-', ' ')}
                                  </td>
                                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                    {log.duration_minutes} minutes
                                  </td>
                                  <td className="px-3 py-4 text-sm text-gray-500">
                                    {log.notes || '-'}
                                  </td>
                                </tr>
                              ))}
                              {exerciseLogs.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 text-center">
                                    No exercise logs yet
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'supplements' ? (
          <div className="mt-8">
            <div className="bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Supplement</h3>
                <form onSubmit={handleAddSupplement} className="mt-5 space-y-6">
                  <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2">
                      <label htmlFor="supplement-name" className="block text-sm font-medium text-gray-700">
                        Supplement Name
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="supplement-name"
                          value={newSupplement.name}
                          onChange={(e) => setNewSupplement({ ...newSupplement, name: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                        />
                      </div>
                    </div>
      
                    <div className="sm:col-span-2">
                      <label htmlFor="dosage" className="block text-sm font-medium text-gray-700">
                        Dosage
                      </label>
                      <div className="mt-1">
                        <input
                          type="text"
                          id="dosage"
                          value={newSupplement.dosage}
                          onChange={(e) => setNewSupplement({ ...newSupplement, dosage: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          required
                          placeholder="e.g., 1000mg"
                        />
                      </div>
                    </div>
      
                    <div className="sm:col-span-2">
                      <label htmlFor="time-of-day" className="block text-sm font-medium text-gray-700">
                        Time of Day
                      </label>
                      <div className="mt-1">
                        <select
                          id="time-of-day"
                          value={newSupplement.time_of_day}
                          onChange={(e) => setNewSupplement({ ...newSupplement, time_of_day: e.target.value as any })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="bedtime">Bedtime</option>
                        </select>
                      </div>
                    </div>
      
                    <div className="sm:col-span-6">
                      <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                        Notes
                      </label>
                      <div className="mt-1">
                        <textarea
                          id="notes"
                          rows={3}
                          value={newSupplement.notes || ''}
                          onChange={(e) => setNewSupplement({ ...newSupplement, notes: e.target.value })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          placeholder="Optional: Add any special instructions or notes"
                        />
                      </div>
                    </div>
                  </div>
      
                  <div>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Add Supplement
                    </button>
                  </div>
                </form>
              </div>
            </div>
      
            <div className="mt-8 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Today's Supplements</h3>
                <div className="mt-6 divide-y divide-gray-200">
                  {supplements.map((supplement) => {
                    const log = supplementLogs.find(
                      (log) => log.supplement_id === supplement.id && 
                      log.date === new Date().toISOString().split('T')[0]
                    );
                    
                    return (
                      <div key={supplement.id} className="py-4 flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{supplement.name}</h4>
                          <p className="text-sm text-gray-500">
                            {supplement.dosage} - {supplement.time_of_day.charAt(0).toUpperCase() + supplement.time_of_day.slice(1)}
                          </p>
                          {supplement.notes && (
                            <p className="mt-1 text-sm text-gray-500">{supplement.notes}</p>
                          )}
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          <button
                            onClick={() => handleLogSupplement(supplement.id, !log?.taken)}
                            className={`inline-flex items-center px-3 py-1.5 border text-sm font-medium rounded-md ${
                              log?.taken
                                ? 'border-transparent text-white bg-green-600 hover:bg-green-700'
                                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500`}
                          >
                            {log?.taken ? 'Taken' : 'Mark as Taken'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {supplements.length === 0 && (
                    <p className="py-4 text-sm text-gray-500 text-center">
                      No supplements added yet. Add your first supplement above.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Add new Supplement History section */}
            <div className="mt-8 bg-white shadow sm:rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Supplement History</h3>
                <div className="mt-6">
                  <div className="flex flex-col">
                    <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                      <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                          <table className="min-w-full divide-y divide-gray-300">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                  Date
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Supplement
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Time Taken
                                </th>
                                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                              {supplementLogs
                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                .map((log) => {
                                  const supplement = supplements.find(s => s.id === log.supplement_id);
                                  return (
                                    <tr key={log.id}>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                        {format(new Date(log.date), 'MMM d, yyyy')}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {supplement?.name || log.supplement_name}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {log.taken_at ? format(new Date(log.taken_at), 'h:mm a') : '-'}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span
                                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                            log.taken
                                              ? 'bg-green-100 text-green-800'
                                              : 'bg-yellow-100 text-yellow-800'
                                          }`}
                                        >
                                          {log.taken ? 'Taken' : 'Not Taken'}
                                        </span>
                                      </td>
                                    </tr>
                                  );
                                })}
                              {supplementLogs.length === 0 && (
                                <tr>
                                  <td colSpan={4} className="px-3 py-4 text-sm text-gray-500 text-center">
                                    No supplement history available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
            {/* Profile content remains the same */}
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and recovery information.</p>
              </div>
              <div className="space-x-3">
                {!editingProfile && (
                  <>
                    <button
                      onClick={() => {
                        setEditedProfile(profile);
                        setEditingProfile(true);
                      }}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Edit Profile
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await signOut();
                          navigate('/login');
                        } catch (error) {
                          console.error('Error signing out:', error);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Sign Out
                    </button>
                  </>
                )}
              </div>
            </div>
            {editingProfile && editedProfile ? (
              <form onSubmit={handleUpdateProfile} className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">First Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <input
                        type="text"
                        value={editedProfile.first_name}
                        onChange={(e) => setEditedProfile({ 
                          ...editedProfile, 
                          first_name: e.target.value,
                          username: `${e.target.value} ${editedProfile.last_name}`
                        })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <input
                        type="text"
                        value={editedProfile.last_name}
                        onChange={(e) => setEditedProfile({ 
                          ...editedProfile, 
                          last_name: e.target.value,
                          username: `${editedProfile.first_name} ${e.target.value}`
                        })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <select
                        value={editedProfile.delivery_type}
                        onChange={(e) => setEditedProfile({ ...editedProfile, delivery_type: e.target.value })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      >
                        <option value="c-section">C-Section</option>
                        <option value="vaginal">Vaginal</option>
                      </select>
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <input
                        type="date"
                        value={editedProfile.delivery_date}
                        onChange={(e) => setEditedProfile({ ...editedProfile, delivery_date: e.target.value })}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      />
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Pre-pregnancy Weight</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          step="0.1"
                          value={editedProfile.pre_pregnancy_weight}
                          onChange={(e) => setEditedProfile({ ...editedProfile, pre_pregnancy_weight: parseFloat(e.target.value) })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        />
                        <select
                          value={editedProfile.weight_unit}
                          onChange={(e) => setEditedProfile({ ...editedProfile, weight_unit: e.target.value as 'kg' | 'lbs' })}
                          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-24 sm:text-sm border-gray-300 rounded-md"
                        >
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                      </div>
                    </dd>
                  </div>
                </dl>
                <div className="px-4 py-3 bg-gray-50 text-right sm:px-6 space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProfile(false);
                      setEditedProfile(null);
                    }}
                    className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-gray-200">
                <dl>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">First Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.first_name}</dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Last Name</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{profile.last_name}</dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery Type</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {profile.delivery_type === 'c-section' ? 'C-Section' : 'Vaginal'}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Delivery Date</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {format(new Date(profile.delivery_date), 'MMMM d, yyyy')}
                    </dd>
                  </div>
                  <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Pre-pregnancy Weight</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {formatWeight(convertWeight(profile.pre_pregnancy_weight, 'kg', weightUnit), weightUnit)}
                    </dd>
                  </div>
                  <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">Recovery Progress</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {Math.floor((Date.now() - new Date(profile.delivery_date).getTime()) / (1000 * 60 * 60 * 24))} days
                    </dd>
                  </div>
                </dl>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}