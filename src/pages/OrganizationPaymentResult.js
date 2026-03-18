import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Layout from '../components/Layout/Layout';
import Card from '../components/Common/Card';
import Button from '../components/Common/Button';
import { useOrganization } from '../context/OrganizationContext';
import { buildPathWithOrganization } from '../utils/organization';

const OrganizationPaymentResult = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { organizationSlug, refreshOrganization } = useOrganization();
  const [searchParams] = useSearchParams();

  const status = String(searchParams.get('status') || '').trim().toLowerCase();
  const invoiceId = searchParams.get('invoiceId');
  const redirectOrganizationSlug = searchParams.get('organization') || organizationSlug || null;
  const isSuccess = status === 'success' || status === 'paid';
  const isProcessing = status === 'processing';
  const isCancelled = status === 'cancelled';

  useEffect(() => {
    if (!isSuccess) {
      return;
    }

    refreshOrganization().catch(() => {
      // Ignore refresh failures on the result page.
    });
  }, [isSuccess, refreshOrganization]);

  const title = isProcessing
    ? t('organizationSettings.subscription.paymentResult.processingTitle', {
      defaultValue: 'Payment verification is in progress'
    })
    : isSuccess
      ? t('organizationSettings.subscription.paymentResult.successTitle', {
        defaultValue: 'Payment completed successfully'
      })
      : isCancelled
        ? t('organizationSettings.subscription.paymentResult.cancelledTitle', {
          defaultValue: 'Payment was cancelled'
        })
        : t('organizationSettings.subscription.paymentResult.failedTitle', {
          defaultValue: 'Payment was not completed'
        });

  const message = isProcessing
    ? t('organizationSettings.subscription.paymentResult.processingMessage', {
      defaultValue: 'Please wait a moment while we confirm the payment with MyFatoorah.'
    })
    : isSuccess
      ? t('organizationSettings.subscription.paymentResult.successMessage', {
        defaultValue: 'The organization subscription has been updated and the new plan is now active.'
      })
      : isCancelled
        ? t('organizationSettings.subscription.paymentResult.cancelledMessage', {
          defaultValue: 'The payment session was cancelled before completion. You can start a new checkout whenever you are ready.'
        })
        : t('organizationSettings.subscription.paymentResult.failedMessage', {
          defaultValue: 'The payment could not be confirmed. You can retry the checkout from the subscription page.'
        });

  const subscriptionPath = buildPathWithOrganization('/organization', redirectOrganizationSlug, {
    tab: 'subscription'
  });
  const dashboardPath = buildPathWithOrganization('/dashboard', redirectOrganizationSlug);

  return (
    <Layout>
      <div className="mx-auto max-w-3xl">
        <Card className="p-0 overflow-hidden">
          <div className={`px-8 py-10 ${
            isProcessing
              ? 'bg-amber-50'
              : isSuccess
                ? 'bg-emerald-50'
                : 'bg-rose-50'
          }`}>
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
              isProcessing
                ? 'bg-amber-100 text-amber-600'
                : isSuccess
                  ? 'bg-emerald-100 text-emerald-600'
                  : 'bg-rose-100 text-rose-600'
            }`}>
              {isProcessing ? (
                <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : isSuccess ? (
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <div className="mt-5 text-center">
              <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600">{message}</p>
              {invoiceId && (
                <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                  {t('organizationSettings.subscription.paymentResult.invoice', {
                    defaultValue: 'Invoice'
                  })}: {invoiceId}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 px-8 py-6 sm:flex-row sm:justify-center">
            <Button onClick={() => navigate(subscriptionPath)}>
              {t('organizationSettings.subscription.paymentResult.backToSubscription', {
                defaultValue: 'Back to Subscription'
              })}
            </Button>
            <Button variant="outline" onClick={() => navigate(dashboardPath)}>
              {t('organizationSettings.subscription.paymentResult.backToDashboard', {
                defaultValue: 'Back to Dashboard'
              })}
            </Button>
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default OrganizationPaymentResult;
