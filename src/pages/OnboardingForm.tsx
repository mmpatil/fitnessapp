import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ClipboardList } from 'lucide-react';

export default function OnboardingForm() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    deliveryType: '',
    deliveryDate: '',
    prePregnancyWeight: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      let profileError;
      
      if (existingProfile) {
        // If profile exists, update it
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            first_name: formData.firstName.trim(),
            last_name: formData.lastName.trim(),
            username: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
            delivery_type: formData.deliveryType,
            delivery_date: formData.deliveryDate,
            pre_pregnancy_weight: parseFloat(formData.prePregnancyWeight),
          })
          .eq('id', user?.id);
        profileError = updateError;
      } else {
        // If profile doesn't exist, insert it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([
            {
              id: user?.id,
              first_name: formData.firstName.trim(),
              last_name: formData.lastName.trim(),
              username: `${formData.firstName.trim()} ${formData.lastName.trim()}`,
              delivery_type: formData.deliveryType,
              delivery_date: formData.deliveryDate,
              pre_pregnancy_weight: parseFloat(formData.prePregnancyWeight),
              weight_unit: 'kg', // Add default weight unit
            },
          ]);
        profileError = insertError;
      }

      if (profileError) throw profileError;
      navigate('/');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile information');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <ClipboardList className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="deliveryType" className="block text-sm font-medium text-gray-700">
                Type of Delivery
              </label>
              <select
                id="deliveryType"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.deliveryType}
                onChange={(e) => setFormData({ ...formData, deliveryType: e.target.value })}
              >
                <option value="">Select delivery type</option>
                <option value="c-section">C-Section</option>
                <option value="vaginal">Vaginal</option>
              </select>
            </div>
            <div>
              <label htmlFor="deliveryDate" className="block text-sm font-medium text-gray-700">
                Date of Delivery
              </label>
              <input
                id="deliveryDate"
                type="date"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.deliveryDate}
                onChange={(e) => setFormData({ ...formData, deliveryDate: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="prePregnancyWeight" className="block text-sm font-medium text-gray-700">
                Pre-pregnancy Weight (kg)
              </label>
              <input
                id="prePregnancyWeight"
                type="number"
                step="0.1"
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                value={formData.prePregnancyWeight}
                onChange={(e) => setFormData({ ...formData, prePregnancyWeight: e.target.value })}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Complete Profile
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}