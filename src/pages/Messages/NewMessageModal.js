import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { FaTimes, FaPaperPlane, FaUsers } from 'react-icons/fa';
import Modal from '../../components/Common/Modal';
import Input from '../../components/Common/Input';
import Button from '../../components/Common/Button';
import UserPicker from '../../components/Common/UserPicker';
import api from '../../utils/api';
import { showSuccess, showError } from '../../utils/toast';
import {
  getUserOrganizationRole,
  roleMatches
} from '../../utils/organization';

const NewMessageModal = ({ isOpen, onClose, onSend, replyTo }) => {
  const { t } = useTranslation();
  const { user, organization } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [formData, setFormData] = useState({
    recipient: '',
    recipients: [], // For broadcast
    subject: '',
    content: '',
    isBroadcast: false
  });
  const organizationRole = getUserOrganizationRole(user);
  const isEmployee = organizationRole === 'employee';
  const canBroadcast = roleMatches(user, ['platform_admin', 'organization_admin']);
  const canChooseDirectRecipient = !isEmployee;
  const currentUserId = user?._id || user?.id;

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/users?isActive=true');
      const responseUsers = Array.isArray(response.data?.data) ? response.data.data : [];
      const filteredUsers = responseUsers.filter((candidate) => {
        const candidateId = candidate?._id || candidate?.id;

        return (
          candidateId &&
          String(candidateId) !== String(currentUserId) &&
          candidate.isActive !== false
        );
      });

      setUsers(filteredUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  // Fetch users for recipient selection
  useEffect(() => {
    if (isOpen && canChooseDirectRecipient) {
      fetchUsers();
    }
  }, [canChooseDirectRecipient, fetchUsers, isOpen]);

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
    const values = Array.isArray(e?.target?.value) ? e.target.value : [];
    setFormData(prev => ({
      ...prev,
      recipients: values
    }));
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
        if (isEmployee && adminUser) {
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

  const fetchAdminUser = useCallback(async () => {
    try {
      setAdminLoading(true);
      const response = await api.get('/users/admin');
      if (response.data.data) {
        setAdminUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching admin user:', error);
    } finally {
      setAdminLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && isEmployee) {
      fetchAdminUser();
    }
  }, [fetchAdminUser, isEmployee, isOpen]);

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
          {canBroadcast && (
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
              {isEmployee ? (
                <UserPicker
                  name="recipient"
                  value={adminUser?._id || ''}
                  onChange={() => {}}
                  users={adminUser ? [adminUser] : []}
                  organization={organization}
                  loading={adminLoading}
                  disabled
                  placeholder={adminLoading ? t('messages.loading') : t('messages.admin')}
                />
              ) : canChooseDirectRecipient ? (
                <UserPicker
                  name="recipient"
                  value={formData.recipient}
                  onChange={handleRecipientChange}
                  users={users}
                  organization={organization}
                  loading={loading}
                  placeholder={t('messages.selectRecipient')}
                />
              ) : null}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('messages.recipients')}
              </label>
              <UserPicker
                name="recipients"
                value={formData.recipients}
                onChange={handleRecipientsChange}
                users={users}
                organization={organization}
                loading={loading}
                multiple
                placeholder={t('messages.recipients')}
              />
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

