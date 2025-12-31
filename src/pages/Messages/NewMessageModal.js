import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FaTimes, FaPaperPlane, FaUsers } from 'react-icons/fa';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import Select from '../../components/Common/Select';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import Loading from '../../components/Common/Loading';

const NewMessageModal = ({ isOpen, onClose, onSend, replyTo }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    recipient: '',
    recipients: [], // For broadcast
    subject: '',
    content: '',
    isBroadcast: false
  });

  // Fetch users for recipient selection
  useEffect(() => {
    if (isOpen && user?.role === 'admin') {
      fetchUsers();
    }
  }, [isOpen, user]);

  // Pre-fill form if replying
  useEffect(() => {
    if (replyTo) {
      setFormData({
        recipient: replyTo.sender._id,
        recipients: [],
        subject: `Re: ${replyTo.subject}`,
        content: '',
        isBroadcast: false
      });
    } else {
      setFormData({
        recipient: '',
        recipients: [],
        subject: '',
        content: '',
        isBroadcast: false
      });
    }
  }, [replyTo, isOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?isActive=true');
      // Filter out current user and only get employees for broadcast
      const filteredUsers = response.data.data.filter(u =>
        u._id !== user.id && u.role === 'employee'
      );
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRecipientChange = (e) => {
    setFormData(prev => ({
      ...prev,
      recipient: e.target.value
    }));
  };

  const handleRecipientsChange = (e) => {
    const selectedOptions = e.target.selectedOptions;
    if (selectedOptions) {
      const values = Array.from(selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        recipients: values
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.isBroadcast && !formData.recipient) {
      showError(t('messages.recipientRequired'));
      return;
    }

    if (formData.isBroadcast && formData.recipients.length === 0) {
      showError(t('messages.recipientsRequired'));
      return;
    }

    if (!formData.subject.trim()) {
      showError(t('messages.subjectRequired'));
      return;
    }

    if (!formData.content.trim()) {
      showError(t('messages.contentRequired'));
      return;
    }

    try {
      setSending(true);
      const payload = {
        subject: formData.subject,
        content: formData.content
      };

      if (formData.isBroadcast) {
        payload.isBroadcast = true;
        payload.recipients = formData.recipients;
      } else {
        // For employees, use adminUser._id if available
        if (user?.role === 'employee' && adminUser) {
          payload.recipient = adminUser._id;
        } else {
          payload.recipient = formData.recipient;
        }
      }

      await api.post('/messages', payload);
      showSuccess(t('messages.sentSuccess'));
      onSend();
    } catch (error) {
      console.error('Error sending message:', error);
      showError(t('messages.errorSending'));
    } finally {
      setSending(false);
    }
  };

  // Fetch admin user for employees
  const [adminUser, setAdminUser] = useState(null);

  useEffect(() => {
    if (isOpen && user?.role === 'employee') {
      fetchAdminUser();
    }
  }, [isOpen, user]);

  const fetchAdminUser = async () => {
    try {
      const response = await api.get('/users/admin');
      if (response.data.data) {
        setAdminUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    }
  };

  // For employees, recipient is always admin
  const getRecipientOptions = () => {
    if (user?.role === 'employee') {
      // Employees can only send to admin
      if (adminUser) {
        return [{ value: adminUser._id, label: adminUser.name || t('messages.admin') }];
      }
      return [];
    } else if (user?.role === 'admin') {
      // Admin can send to all employees
      return users.map(u => ({
        value: u._id,
        label: `${u.name} (${t(`departments.${u.department}`)})`
      }));
    }
    return [];
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {replyTo ? t('messages.reply') : t('messages.newMessage')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Broadcast option (Admin only) */}
          {user?.role === 'admin' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isBroadcast"
                name="isBroadcast"
                checked={formData.isBroadcast}
                onChange={handleChange}
                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="isBroadcast" className="flex items-center gap-2 text-sm text-gray-700">
                <FaUsers className="text-primary" />
                {t('messages.sendToMultiple')}
              </label>
            </div>
          )}

          {/* Recipient Selection */}
          {!formData.isBroadcast ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('messages.to')}
              </label>
              {user?.role === 'employee' ? (
                <div className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700">
                  {adminUser ? adminUser.name : t('messages.loading')}
                </div>
              ) : user?.role === 'admin' ? (
                <Select
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleRecipientChange}
                  options={getRecipientOptions()}
                  required
                  placeholder={t('messages.selectRecipient')}
                />
              ) : null}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('messages.recipients')}
              </label>
              <select
                multiple
                value={formData.recipients}
                onChange={handleRecipientsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent min-h-[120px]"
                required
              >
                {users.map(u => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({t(`departments.${u.department}`)})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('messages.selectMultipleHint')}
              </p>
            </div>
          )}

          {/* Subject */}
          <Input
            label={t('messages.subject')}
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            required
            placeholder={t('messages.subjectPlaceholder')}
          />

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('messages.message')}
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              required
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              placeholder={t('messages.messagePlaceholder')}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              icon={FaPaperPlane}
              loading={sending}
              disabled={sending}
            >
              {t('messages.send')}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default NewMessageModal;

