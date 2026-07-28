import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaTimesCircle, FaExclamationTriangle } from 'react-icons/fa';

import Button from '../../components/Common/Button';
import DocumentRenderer from '../../features/document-renderer/DocumentRenderer';
import useDocumentLayout from '../../features/document-renderer/useDocumentLayout';
import { useAuth } from '../../context/AuthContext';

/**
 * Renders a filled form as the physical document.
 *
 * The props are unchanged from the original implementation so every caller
 * (ViewForm, PrintForm, the builder preview) keeps working, but the rendering is
 * now the shared layout engine rather than a browser-only re-interpretation of
 * the template. The same primitives are drawn by `backend/utils/pdfGenerator.js`,
 * which is why the screen, the print dialog and the downloaded PDF agree.
 */
const FormDocument = ({
  formInstance,
  template,
  canApprove = false,
  approvalNotes = '',
  setApprovalNotes = () => {},
  handleApprove = () => {},
  handleReject = () => {},
  processing = false,
  isPrintMode = false
}) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language === 'ar' ? 'ar' : 'en';
  const { organization } = useAuth();

  const resolveDepartment = useMemo(() => (code) => {
    const normalized = String(code || '').trim().toLowerCase();
    const department = (organization?.departments || []).find((entry) => entry.code === normalized);
    return department?.name?.[language] || department?.name?.en || code || '';
  }, [organization, language]);

  const layout = useDocumentLayout({
    template,
    values: formInstance?.values || {},
    formInstance,
    language,
    mode: isPrintMode ? 'print' : 'preview',
    organization,
    resolveDepartment
  });

  if (!layout || !layout.ok) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
        <div className="flex items-start gap-3">
          <FaExclamationTriangle className="mt-1 shrink-0" />
          <div>
            <p className="font-semibold">
              {language === 'ar' ? 'تعذر عرض هذا المستند' : 'This document could not be displayed'}
            </p>
            <p className="mt-1 text-sm">
              {language === 'ar'
                ? (layout?.error?.messageAr || 'إصدار تخطيط المستند غير مدعوم.')
                : (layout?.error?.message || 'Unsupported document layout version.')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="overflow-x-auto pb-4">
        <DocumentRenderer
          layout={layout}
          mode={isPrintMode ? 'print' : 'preview'}
          language={language}
          showPageNumbers={!isPrintMode && layout.pages.length > 1}
        />
      </div>

      {canApprove && (
        <div className="doc-print-hidden mb-6 mt-6 rounded-xl bg-white p-6 shadow-md print:hidden">
          <h3 className="mb-4 text-lg font-bold text-gray-800">
            {t('forms.approvalActions')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('forms.approvalNotes')}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(event) => setApprovalNotes(event.target.value)}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder={t('forms.enterNotes')}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={handleApprove} disabled={processing} variant="success">
                <FaCheckCircle />
                {t('forms.approveForm')}
              </Button>
              <Button onClick={handleReject} disabled={processing} variant="danger">
                <FaTimesCircle />
                {t('forms.rejectForm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormDocument;
