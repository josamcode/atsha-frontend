import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaReply, FaTrash, FaUser, FaEnvelope, FaEnvelopeOpen, FaClock } from 'react-icons/fa';
import Card from '../../components/Common/Card';
import Button from '../../components/Common/Button';

const MessageView = ({
  message,
  onReply,
  onDelete,
  isInbox,
  readOnly = false,
  scopeLabel = '',
  allowReply = false,
  allowDelete = false
}) => {
  const { t, i18n } = useTranslation();

  const formatTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {message.read ? (
                <FaEnvelopeOpen className="text-gray-400" />
              ) : (
                <FaEnvelope className="text-primary" />
              )}
              <h2 className="text-xl font-bold text-gray-900">{message.subject}</h2>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaUser className="text-gray-400" />
                {/* <span className="font-medium">
                  {readOnly
                    ? t('messages.from')
                    : (isInbox ? t('messages.from') : t('messages.to'))}:
                </span> */}
                <span className="flex items-center gap-2">
                  {readOnly ? (
                    <>
                      <span className="bg-primary/20 px-2 py-0.5 rounded-md">
                        {message.sender?.name || t('messages.unknown')}
                      </span>

                      <span className="bg-red-100 px-2 py-0.5 rounded-md">
                        {message.recipient?.name || t('messages.unknown')}
                      </span>
                    </>
                  ) : (
                    <span className="bg-gray-100 px-2 py-0.5 rounded-md">
                      {isInbox
                        ? message.sender?.name || t('messages.unknown')
                        : message.recipient?.name || t('messages.unknown')}
                    </span>
                  )}
                </span>
              </div>
              {scopeLabel ? (
                <div className="flex items-center gap-2">
                  <FaUser className="text-gray-400" />
                  <span className="font-medium">
                    {t('users.organization', { defaultValue: 'Organization' })}:
                  </span>
                  <span>{scopeLabel}</span>
                </div>
              ) : null}
              <div className="flex items-center gap-2">
                <FaClock className="text-gray-400" />
                <span>{formatTime(message.createdAt)}</span>
              </div>
            </div>
          </div>
          {(!readOnly || allowReply || allowDelete) && (
            <div className="flex items-center gap-2">
              {(isInbox || readOnly) && allowReply && (
                <Button
                  onClick={onReply}
                  variant="outline"
                  icon={FaReply}
                  size="sm"
                >
                  {t('messages.reply')}
                </Button>
              )}
              {allowDelete && (
                <Button
                  onClick={onDelete}
                  variant="outline"
                  icon={FaTrash}
                  size="sm"
                  className="text-primary hover:text-primary hover:border-primary"
                >
                  {t('messages.delete')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {message.content}
          </div>
        </div>
      </div>

      {/* Footer */}
      {message.readAt && isInbox && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {t('messages.readAt')}: {new Date(message.readAt).toLocaleString(i18n.language)}
          </p>
        </div>
      )}
    </Card>
  );
};

export default MessageView;

