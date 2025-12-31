import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import Select from '../../components/Common/Select';
import { showSuccess, showError } from '../../utils/toast';
import { FaCalendarAlt } from 'react-icons/fa';

const NewLeave = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    type: '',
    startDate: '',
    endDate: '',
    date: '', // For permission type
    startTime: '', // For permission type
    endTime: '', // For permission type
    reason: '',
    days: 0,
    hours: 0 // For permission type
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate days when start or end date changes (for regular leaves)
  useEffect(() => {
    if (formData.type === 'permission') {
      // For permission, calculate hours
      if (formData.date && formData.startTime && formData.endTime) {
        const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
        const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

        if (endDateTime > startDateTime) {
          const diffTime = Math.abs(endDateTime - startDateTime);
          const hours = diffTime / (1000 * 60 * 60);
          // For permission, days = hours / 8 (assuming 8 hours work day)
          const days = hours / 8;
          setFormData(prev => ({
            ...prev,
            hours: parseFloat(hours.toFixed(2)),
            days: parseFloat(days.toFixed(2))
          }));
        } else {
          setFormData(prev => ({ ...prev, hours: 0, days: 0 }));
          if (formData.endTime && formData.startTime) {
            setError(t('leaves.endTimeBeforeStart'));
          }
        }
      } else {
        setFormData(prev => ({ ...prev, hours: 0, days: 0 }));
      }
    } else {
      // For regular leaves, calculate days
      if (formData.startDate && formData.endDate) {
        const start = new Date(formData.startDate);
        const end = new Date(formData.endDate);

        if (end >= start) {
          const diffTime = Math.abs(end - start);
          const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
          setFormData(prev => ({ ...prev, days }));
        } else {
          setFormData(prev => ({ ...prev, days: 0 }));
          setError(t('leaves.endDateBeforeStart'));
        }
      }
    }
  }, [formData.startDate, formData.endDate, formData.type, formData.date, formData.startTime, formData.endTime, t]);

  const handleChange = (e) => {
    const newFormData = { ...formData, [e.target.name]: e.target.value };

    // Reset permission fields when type changes
    if (e.target.name === 'type') {
      if (e.target.value !== 'permission') {
        newFormData.date = '';
        newFormData.startTime = '';
        newFormData.endTime = '';
        newFormData.hours = 0;
      } else {
        newFormData.startDate = '';
        newFormData.endDate = '';
      }
    }

    setFormData(newFormData);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let submitData = { ...formData };

    // Handle permission type differently
    if (formData.type === 'permission') {
      // Validate permission fields
      if (!formData.date || !formData.startTime || !formData.endTime) {
        setError(t('leaves.invalidTime'));
        setLoading(false);
        return;
      }

      // Validate end time is after start time
      const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

      if (endDateTime <= startDateTime) {
        setError(t('leaves.endTimeBeforeStart'));
        setLoading(false);
        return;
      }

      // Convert to startDate and endDate for backend
      submitData.startDate = `${formData.date}T${formData.startTime}`;
      submitData.endDate = `${formData.date}T${formData.endTime}`;

      // Ensure days is a number, not string
      submitData.days = parseFloat(submitData.days);

      // Remove permission-specific fields
      delete submitData.date;
      delete submitData.startTime;
      delete submitData.endTime;
      delete submitData.hours;
    } else {
      // Validate regular leave fields
      if (new Date(formData.endDate) < new Date(formData.startDate)) {
        setError(t('leaves.endDateBeforeStart'));
        setLoading(false);
        return;
      }

      // Remove permission-specific fields
      delete submitData.date;
      delete submitData.startTime;
      delete submitData.endTime;
      delete submitData.hours;
    }

    // Validate days is greater than 0
    if (submitData.days <= 0) {
      setError(formData.type === 'permission' ? t('leaves.invalidTime') : t('leaves.invalidDays'));
      setLoading(false);
      return;
    }

    try {
      await api.post('/leaves', submitData);
      showSuccess(t('leaves.submittedSuccessfully'));
      navigate('/leaves');
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showError(error.response?.data?.message || t('leaves.errorSubmitting'));
      setError(error.response?.data?.message || t('leaves.errorSubmitting'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <Card title={t('leaves.requestLeave')}>
          {error && (
            <div className="mb-4 bg-primary border border-primary text-white px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label={t('leaves.leaveType')}
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
              options={[
                { value: 'vacation', label: t('leaves.vacation') },
                { value: 'sick', label: t('leaves.sick') },
                { value: 'permission', label: t('leaves.permission') },
                { value: 'emergency', label: t('leaves.emergency') },
                { value: 'unpaid', label: t('leaves.unpaid') },
                { value: 'other', label: t('leaves.other') }
              ]}
            />

            {/* Permission Type: Date + Start Time + End Time */}
            {formData.type === 'permission' ? (
              <>
                <Input
                  label={t('leaves.date')}
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

                <Input
                  label={t('leaves.startTime')}
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />

                <Input
                  label={t('leaves.endTime')}
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  min={formData.startTime}
                />

                {/* Hours Display for Permission */}
                {formData.date && formData.startTime && formData.endTime && formData.hours > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">{t('leaves.totalHours')}</p>
                        <p className="text-2xl font-bold text-blue-600">{formData.hours} {t('leaves.hours')}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          ({formData.days} {t('leaves.days')})
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                <Input
                  label={t('leaves.startDate')}
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />

                <Input
                  label={t('leaves.endDate')}
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                  min={formData.startDate}
                />

                {/* Days Display */}
                {formData.startDate && formData.endDate && formData.days > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FaCalendarAlt className="text-blue-600 text-xl" />
                      <div>
                        <p className="text-sm text-gray-600">{t('leaves.totalDays')}</p>
                        <p className="text-2xl font-bold text-blue-600">{formData.days} {t('leaves.days')}</p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('leaves.reason')}
                <span className="text-primary ml-1">*</span>
              </label>
              <textarea
                name="reason"
                value={formData.reason}
                onChange={handleChange}
                required
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                // if formData.type === 'permission' then placeholder is "Please provide a reason for your leave request..."
                // else placeholder is "Please provide a reason for your leave request..."
                placeholder={formData.type === 'permission' ? t('leaves.permissionReasonPlaceholder') : t('leaves.reasonPlaceholder')}
              />
            </div>

            <div className="flex space-x-4">
              <Button type="submit" disabled={loading} fullWidth>
                {loading ? t('common.loading') : t('common.submit')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/leaves')}
                fullWidth
              >
                {t('common.cancel')}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </Layout>
  );
};

export default NewLeave;

