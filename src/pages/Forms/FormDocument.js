import React, { useRef } from 'react'
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';
import { formatDate, formatTime, formatDateTime } from '../../utils/dateUtils';
import Button from '../../components/Common/Button';

import {
  FaCheckCircle,
  FaDiscord,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaGithub,
  FaInstagram,
  FaLinkedinIn,
  FaPinterestP,
  FaPhone,
  FaSnapchatGhost,
  FaTelegramPlane,
  FaTiktok,
  FaTimesCircle,
  FaTwitter,
  FaWhatsapp,
  FaYoutube
} from 'react-icons/fa';

import { getLeafTableColumns, normalizeTemplate } from './templateBuilderUtils';

const SOCIAL_ICON_MAP = {
  website: FaGlobe,
  email: FaEnvelope,
  facebook: FaFacebookF,
  instagram: FaInstagram,
  linkedin: FaLinkedinIn,
  youtube: FaYoutube,
  whatsapp: FaWhatsapp,
  telegram: FaTelegramPlane,
  x: FaTwitter,
  tiktok: FaTiktok,
  snapchat: FaSnapchatGhost,
  discord: FaDiscord,
  pinterest: FaPinterestP,
  github: FaGithub
};

const buildSocialHref = (type, value) => {
  const trimmedValue = String(value || '').trim();

  if (!trimmedValue) {
    return '';
  }

  if (type === 'email') {
    return trimmedValue.startsWith('mailto:') ? trimmedValue : `mailto:${trimmedValue}`;
  }

  if (/^(https?:|mailto:|tel:)/i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
};

const clampNumber = (value, fallback, min, max) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, numericValue));
};

const resolveFooterTemplate = (value) => (
  ['classic', 'centered', 'contact', 'minimal'].includes(value) ? value : 'classic'
);

const FormDocument = ({
  formInstance,
  template,
  canApprove = false,
  approvalNotes = '',
  setApprovalNotes = () => { },
  handleApprove = () => { },
  handleReject = () => { },
  processing = false,
  isPrintMode = false
}) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const normalizedTemplate = normalizeTemplate(template || {});
  const documentDirection = isRTL ? 'rtl' : 'ltr';
  const defaultTextAlign = isRTL ? 'right' : 'left';

  const printRef = useRef(null);

  const resolveTextAlign = (alignment, fallback = defaultTextAlign) => {
    if (alignment === 'center') {
      return 'center';
    }

    if (isRTL) {
      return 'right';
    }

    if (alignment === 'left' || alignment === 'right') {
      return alignment;
    }

    return fallback;
  };

  const resolveTableColumnWidths = (columns = []) => {
    const normalizedWidths = columns.map((column) => (typeof column?.width === 'string' ? column.width.trim() : ''));
    const percentValues = normalizedWidths.map((width) => {
      const match = width.match(/^(\d+(?:\.\d+)?)%$/);
      return match ? Number(match[1]) : null;
    });
    const frValues = normalizedWidths.map((width) => {
      const match = width.match(/^(\d+(?:\.\d+)?)fr$/i);
      return match ? Number(match[1]) : null;
    });
    const totalFr = frValues.reduce((sum, value) => sum + (value || 0), 0);
    const hasFrWidths = totalFr > 0;
    const autoColumnsCount = normalizedWidths.filter((width) => !width || width === 'auto').length;
    const totalFlexibleWeight = totalFr + (hasFrWidths ? autoColumnsCount : 0);
    const reservedPercent = percentValues.reduce((sum, value) => sum + (value || 0), 0);
    const availablePercent = Math.max(0, 100 - reservedPercent);

    return normalizedWidths.map((width, index) => {
      if (hasFrWidths && (!width || width === 'auto')) {
        return `${availablePercent / totalFlexibleWeight}%`;
      }

      if (!width || width === 'auto') {
        return undefined;
      }

      const frValue = frValues[index];
      if (frValue && totalFr > 0) {
        return `${(frValue / totalFlexibleWeight) * availablePercent}%`;
      }

      return width;
    });
  };

  // Helper function to get field value
  const getFieldValue = (sectionId, fieldKey) => {
    const key = `${sectionId}.${fieldKey}`;
    return formInstance.values[key];
  };

  // Helper function to format value based on type
  const formatValue = (value, type) => {
    if (value === undefined || value === null || value === '') return '-';

    switch (type) {
      case 'boolean':
        return value ? t('common.yes') : t('common.no');
      case 'date':
        try {
          // Handle date strings in YYYY-MM-DD format
          if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const date = new Date(value + 'T00:00:00');
            return formatDate(date, i18n.language);
          }
          return formatDate(value, i18n.language);
        } catch (e) {
          return value;
        }
      case 'time':
        // Time values are usually in HH:MM format
        try {
          // Format time to 12-hour format if needed
          if (typeof value === 'string' && value.match(/^\d{2}:\d{2}$/)) {
            const [hours, minutes] = value.split(':');
            const date = new Date();
            date.setHours(parseInt(hours, 10));
            date.setMinutes(parseInt(minutes, 10));
            return formatTime(date, i18n.language, { hour12: true });
          }
          return value;
        } catch (e) {
          return value;
        }
      case 'datetime':
        try {
          return formatDateTime(value, i18n.language);
        } catch (e) {
          return value;
        }
      case 'number':
        return typeof value === 'number' ? value.toString() : value;
      default:
        return value;
    }
  };

  return (
    <div
      className="w-full overflow-auto"
      dir={documentDirection}
      style={{
        minHeight: '100vh',
        scrollbarWidth: 'thin',
        scrollbarColor: '#cbd5e0 #f1f5f9',
        direction: documentDirection
      }}
    >
      <style>{`
        /* Custom Scrollbar for Webkit browsers (Chrome, Safari, Edge) */
        div[class*="overflow-auto"]::-webkit-scrollbar {
          width: 12px;
          height: 12px;
        }
        div[class*="overflow-auto"]::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 6px;
        }
        div[class*="overflow-auto"]::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 6px;
          border: 2px solid #f1f5f9;
        }
        div[class*="overflow-auto"]::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        div[class*="overflow-auto"]::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
      `}</style>
      <div
        ref={printRef}
        id="print-content"
        className={`mx-auto bg-white print:shadow-none relative print-content ${isRTL ? 'text-right' : 'text-left'}`}
        style={{
          minWidth: '1000px',
          direction: documentDirection,
          textAlign: defaultTextAlign
        }}
      >
        {/* Watermark */}
        {(() => {
          const branding = normalizedTemplate.pdfStyle?.branding || {};
          const watermarkUrl = branding.watermarkUrl || branding.logoUrl || '/logo.png';
          const watermarkSize = clampNumber(branding.watermarkSize, 55, 20, 100);
          const watermarkOpacity = clampNumber(branding.watermarkOpacity, 5, 0, 100) / 100;

          if (!watermarkUrl) {
            return null;
          }

          return (
            <div
              className="watermark absolute inset-0 flex items-center justify-center pointer-events-none z-0"
              style={{ opacity: watermarkOpacity }}
            >
              <img
                src={watermarkUrl}
                alt="Watermark"
                className="h-auto object-contain"
                style={{
                  width: `${watermarkSize}%`,
                  maxWidth: '100%',
                  maxHeight: '90%',
                  transform: 'rotate(10deg)'
                }}
              />
            </div>
          );
        })()}

        {/* Header with dashed border (PDF style) */}
        <div className="relative z-10">
          {/* Dashed border decoration */}
          <div className="absolute inset-0 border-4 border-dashed border-gray-400 rounded-lg m-4"></div>

          <div className="p-12 relative z-10">
            {/* Document Header */}
            {(() => {
              const pdfStyle = normalizedTemplate.pdfStyle || {};
              const headerConfig = pdfStyle.header || {};
              const branding = pdfStyle.branding || {};
              const primaryColor = branding.primaryColor || pdfStyle.colors?.primary || '#d4b900';
              const headerBgColor = headerConfig.backgroundColor || '#ffffff';
              const headerTextColor = headerConfig.textColor || '#000000';
              const companyName = branding.companyName?.[i18n.language] || branding.companyName?.en || 'atsha';
              const logoSize = clampNumber(headerConfig.logoSize, 64, 24, 160);
              const companyAddress = branding.companyAddress?.[i18n.language] || branding.companyAddress?.en || (isRTL ? 'مصر' : 'Egypt');

              if (headerConfig.enabled === false) return null;

              const headerLayout = headerConfig.layout || 'default';
              const showCompanyName = headerConfig.showCompanyName !== false;
              const showCompanyAddress = headerConfig.showCompanyAddress !== false;
              const borderConfig = headerConfig.border || {};
              const showBorder = borderConfig.show !== false;
              const borderWidth = borderConfig.width || 4;
              const borderStyle = borderConfig.style || 'solid';
              const borderColor = borderConfig.color || primaryColor;
              const borderPosition = borderConfig.position || 'bottom';

              // Calculate border style based on position
              const getBorderStyle = () => {
                if (!showBorder || borderPosition === 'none') {
                  return {};
                }

                const borderValue = `${borderWidth}px ${borderStyle} ${borderColor}`;

                switch (borderPosition) {
                  case 'top':
                    return { borderTop: borderValue };
                  case 'bottom':
                    return { borderBottom: borderValue };
                  case 'left':
                    return { borderLeft: borderValue };
                  case 'right':
                    return { borderRight: borderValue };
                  case 'all':
                    return { border: borderValue };
                  default:
                    return { borderBottom: borderValue };
                }
              };

              return (
                <div
                  className="p-8 print:p-6"
                  style={{
                    backgroundColor: headerBgColor,
                    color: headerTextColor,
                    ...getBorderStyle()
                  }}
                >
                  {headerLayout === 'split' ? (
                    // Split Layout: Logo + Company Left, Form Title Right
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      {/* Logo and Company Info - Left Side */}
                      <div className="flex items-center gap-4">
                        {headerConfig.showLogo !== false && (
                          <img
                            src={branding.logoUrl || branding.watermarkUrl || "/logo.png"}
                            alt={companyName}
                            className="w-auto flex-shrink-0 object-contain"
                            style={{ height: `${logoSize}px` }}
                          />
                        )}
                        {(showCompanyName || showCompanyAddress) && (
                          <div>
                            {showCompanyName && (
                              <h1
                                className="text-3xl font-bold"
                                style={{
                                  fontFamily: pdfStyle.fontFamily || 'Arial, sans-serif',
                                  color: primaryColor
                                }}
                              >
                                {companyName}
                              </h1>
                            )}
                            <p className="text-base mt-1" style={{ color: headerTextColor }}>
                              {isRTL ? t('users.atshaForFoodDelivery') : t('users.atshaForFoodDelivery')}
                            </p>
                            {showCompanyAddress && companyAddress && (
                              <p className="text-sm mt-1" style={{ color: headerTextColor }}>
                                {companyAddress}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Form Title - Right Side */}
                      {headerConfig.showTitle !== false && (
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h2
                            className="text-3xl font-bold"
                            style={{
                              color: headerTextColor,
                              fontSize: `${headerConfig.fontSize || 20}px`,
                              textAlign: isRTL ? 'right' : 'left'
                            }}
                          >
                            {isRTL ? normalizedTemplate.title.ar : normalizedTemplate.title.en}
                          </h2>
                          {normalizedTemplate.description && (
                            <p className="text-base mt-2" style={{ color: headerTextColor }}>
                              {isRTL ? normalizedTemplate.description.ar : normalizedTemplate.description.en}
                            </p>
                          )}
                          {/* Date */}
                          {headerConfig.showDate !== false && (
                            <div className="mt-4 text-base" style={{ color: headerTextColor }}>
                              {isRTL
                                ? `التاريخ: ${formatDate(new Date(), i18n.language)}`
                                : `Date: ${formatDate(new Date(), i18n.language)}`
                              }
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    // Default Layout: Company + Form Title Left, Logo Right
                    <div className="flex items-start justify-between gap-6 flex-wrap">
                      {/* Company Info + Form Title - Left Side */}
                      <div className="flex-1">
                        <div className="flex flex-col gap-4">
                          {/* Company Info */}
                          {(showCompanyName || showCompanyAddress) && (
                            <div>
                              {showCompanyName && (
                                <h1
                                  className="text-3xl font-bold"
                                  style={{
                                    fontFamily: pdfStyle.fontFamily || 'Arial, sans-serif',
                                    color: primaryColor
                                  }}
                                >
                                  {companyName}
                                </h1>
                              )}
                              {/* <p className="text-base mt-1" style={{ color: headerTextColor }}>
                                {isRTL ? 'نظام إدارة المطاعم' : 'Restaurant Management System'}
                              </p> */}
                              {/* {showCompanyAddress && companyAddress && (
                                <p className="text-sm mt-1" style={{ color: headerTextColor }}>
                                  {companyAddress}
                                </p>
                              )} */}
                            </div>
                          )}

                          {/* Form Title */}
                          {headerConfig.showTitle !== false && (
                            <div>
                              <h2
                                className="text-3xl font-bold"
                                style={{
                                  color: headerTextColor,
                                  fontSize: `${headerConfig.fontSize || 20}px`
                                }}
                              >
                                {isRTL ? normalizedTemplate.title.ar : normalizedTemplate.title.en}
                              </h2>
                              {normalizedTemplate.description && (
                                <p className="text-base mt-2" style={{ color: headerTextColor }}>
                                  {isRTL ? normalizedTemplate.description.ar : normalizedTemplate.description.en}
                                </p>
                              )}
                              {/* Date */}
                              {headerConfig.showDate !== false && (
                                <div className="mt-4 text-base" style={{ color: headerTextColor }}>
                                  {isRTL
                                    ? `التاريخ: ${formatDate(new Date(), i18n.language)}`
                                    : `Date: ${formatDate(new Date(), i18n.language)}`
                                  }
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Logo - Right Side */}
                      {headerConfig.showLogo !== false && (
                        <div className="flex-shrink-0">
                          <img
                            src={branding.logoUrl || branding.watermarkUrl || "/logo.png"}
                            alt={companyName}
                            className="w-auto object-contain"
                            style={{ height: `${logoSize}px` }}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Form Metadata */}
            {(() => {
              const pdfStyle = normalizedTemplate.pdfStyle || {};
              const metadataConfig = pdfStyle.metadata || {
                enabled: true,
                showFormId: true,
                showDate: true,
                showShift: true,
                showDepartment: true,
                showFilledBy: true,
                showSubmittedOn: true,
                showApprovedBy: true,
                showApprovalDate: true
              };
              const metadataEnabled = metadataConfig.enabled !== false;

              if (!metadataEnabled) return null;

              return (
                <div className="bg-gray-50 px-8 py-6 print:px-6 print:py-4 border-b border-gray-200">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {metadataConfig.showFormId !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.formId')}
                        </p>
                        <p className="text-base font-mono text-gray-800">
                          #{formInstance._id.slice(-8)}
                        </p>
                      </div>
                    )}
                    {metadataConfig.showDate !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.date')}
                        </p>
                        <p className="text-base text-gray-800">
                          {formatDate(formInstance.date, i18n.language)}
                        </p>
                      </div>
                    )}
                    {metadataConfig.showShift !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.shift')}
                        </p>
                        <p className="text-base text-gray-800 capitalize">
                          {t(`forms.${formInstance.shift}`)}
                        </p>
                      </div>
                    )}
                    {metadataConfig.showDepartment !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.department')}
                        </p>
                        <p className="text-base text-gray-800 capitalize">
                          {t(`departments.${formInstance.department}`)}
                        </p>
                      </div>
                    )}
                    {metadataConfig.showFilledBy !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.filledBy')}
                        </p>
                        <p className="text-base text-gray-800">
                          {formInstance.filledBy?.name || 'N/A'}
                        </p>
                      </div>
                    )}
                    {metadataConfig.showSubmittedOn !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.submittedOn')}
                        </p>
                        <p className="text-base text-gray-800">
                          {formatDate(formInstance.createdAt, i18n.language)}
                        </p>
                      </div>
                    )}
                    {formInstance.approvedBy && metadataConfig.showApprovedBy !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.approvedBy')}
                        </p>
                        <p className="text-base text-gray-800">
                          {formInstance.approvedBy?.name || 'N/A'}
                        </p>
                      </div>
                    )}
                    {formInstance.approvedBy && metadataConfig.showApprovalDate !== false && (
                      <div>
                        <p className="text-sm text-gray-500 uppercase font-semibold mb-2">
                          {t('forms.approvalDate')}
                        </p>
                        <p className="text-base text-gray-800">
                          {formatDate(formInstance.approvalDate, i18n.language)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Form Sections */}
            <div className="p-8 print:p-6 space-y-8">
              {(() => {
                // Get layout configuration
                const layout = normalizedTemplate.layout || {};
                const pdfStyle = normalizedTemplate.pdfStyle || {};
                const primaryColor = pdfStyle.colors?.primary || pdfStyle.branding?.primaryColor || '#d4b900';
                const textColor = pdfStyle.colors?.text || '#000000';
                const borderColor = pdfStyle.colors?.border || '#e5e7eb';
                const backgroundColor = pdfStyle.colors?.background || '#ffffff';
                const sectionSpacing = pdfStyle.spacing?.sectionSpacing || 20;

                // Get sections in order
                let sectionsToRender = normalizedTemplate.sections || [];
                if (layout.sectionOrder && layout.sectionOrder.length > 0) {
                  const sectionMap = new Map(sectionsToRender.map(s => [s.id, s]));
                  sectionsToRender = layout.sectionOrder
                    .map(id => sectionMap.get(id))
                    .filter(s => s !== undefined);

                  // Add any sections not in sectionOrder
                  const orderedIds = new Set(layout.sectionOrder);
                  normalizedTemplate.sections.forEach(section => {
                    if (!orderedIds.has(section.id)) {
                      sectionsToRender.push(section);
                    }
                  });
                }

                // Filter visible sections
                sectionsToRender = sectionsToRender.filter(section => section.visible !== false);

                return sectionsToRender.map((section, sIdx) => {
                  const sectionStyle = section.pdfStyle || {};
                  const sectionType = section.sectionType || 'normal';

                  // Get advanced layout configuration first (needed for styling.borderColor)
                  const advancedLayout = section.advancedLayout || {};
                  const advancedLayoutStyling = advancedLayout.styling || {};

                  const sectionBgColor = sectionStyle.backgroundColor || backgroundColor;
                  // Use borderColor from advancedLayout.styling.borderColor first (highest priority), 
                  // then section.pdfStyle.borderColor, then fallback to borderColor
                  const sectionBorderColor = advancedLayoutStyling.borderColor
                    || sectionStyle.borderColor
                    || borderColor;
                  const sectionBorderWidth = sectionStyle.borderWidth || 1;
                  const showBorder = sectionStyle.showBorder !== false;
                  const showBackground = sectionStyle.showBackground;
                  const layoutType = advancedLayout.layoutType || 'simple';
                  const tableColumns = advancedLayout.table?.columns || [];
                  const leafTableColumns = getLeafTableColumns(tableColumns);
                  const hasGroupedTableColumns = tableColumns.some((column) => Array.isArray(column?.children) && column.children.length > 0);
                  const resolvedTableColumnWidths = resolveTableColumnWidths(leafTableColumns);
                  const hasResolvedTableColumnWidths = resolvedTableColumnWidths.some(Boolean);
                  const advSpacing = advancedLayout.spacing || {};
                  const advSizing = advancedLayout.sizing || {};
                  const advPadding = advancedLayout.padding || {};
                  const advMargins = advancedLayout.margins || {};

                  // Helper function to check if title should be shown
                  const shouldShowTitle = () => {
                    // If styling doesn't exist, default to true (backward compatibility)
                    if (!advancedLayout.styling || advancedLayout.styling === null || advancedLayout.styling === undefined) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`[ViewForm] Section ${section.id}: styling not found, defaulting to showTitle=true`);
                      }
                      return true;
                    }
                    // If showTitle is explicitly false, hide it
                    if (advancedLayout.styling.showTitle === false) {
                      if (process.env.NODE_ENV === 'development') {
                        console.log(`[ViewForm] Section ${section.id}: showTitle=false, hiding title`);
                      }
                      return false;
                    }
                    // Otherwise, show it (default or true)
                    if (process.env.NODE_ENV === 'development') {
                      console.log(`[ViewForm] Section ${section.id}: showTitle=${advancedLayout.styling.showTitle}, showing title`);
                    }
                    return true;
                  };

                  // Get fields in order
                  let fieldsToRender = section.fields || [];
                  fieldsToRender = fieldsToRender.filter(field => field.visible !== false);
                  fieldsToRender.sort((a, b) => (a.order || 0) - (b.order || 0));

                  // Render field content helper
                  const renderFieldContent = (field, fIdx, containerStyle = {}) => {
                    const showLabel = field.pdfDisplay?.showLabel !== false;
                    const showValue = field.pdfDisplay?.showValue !== false;
                    const fieldFontSize = field.pdfDisplay?.fontSize || pdfStyle.fontSize?.field || 16;
                    const isBold = field.pdfDisplay?.bold || false;
                    const alignment = field.pdfDisplay?.alignment || field.layout?.alignment || 'left';
                    const fieldLayout = field.layout || {};
                    const fieldPadding = fieldLayout.padding || {};
                    const fieldMargin = fieldLayout.margin || {};

                    if (!showLabel && !showValue) return null;

                    const textAlign = resolveTextAlign(alignment);

                    return (
                      <div
                        key={`${section.id}-${field.key}-${fIdx}`}
                        style={{
                          padding: fieldPadding.top || fieldPadding.right || fieldPadding.bottom || fieldPadding.left
                            ? `${fieldPadding.top || 0}px ${fieldPadding.right || 0}px ${fieldPadding.bottom || 0}px ${fieldPadding.left || 0}px`
                            : undefined,
                          margin: fieldMargin.top || fieldMargin.right || fieldMargin.bottom || fieldMargin.left
                            ? `${fieldMargin.top || 0}px ${fieldMargin.right || 0}px ${fieldMargin.bottom || 0}px ${fieldMargin.left || 0}px`
                            : undefined,
                          width: fieldLayout.width || 'auto',
                          textAlign,
                          ...containerStyle
                        }}
                      >
                        {showLabel && (
                          <p
                            className="font-semibold mb-2"
                            style={{
                              color: textColor,
                              fontSize: `${fieldFontSize}px`,
                              fontWeight: isBold ? 'bold' : 'normal',
                              textAlign
                            }}
                          >
                            {isRTL ? field.label.ar : field.label.en}
                            {field.required && <span className="text-primary ml-1">*</span>}
                          </p>
                        )}
                        {showValue && (
                          <p
                            className="whitespace-pre-wrap"
                            style={{
                              color: textColor,
                              fontSize: `${fieldFontSize}px`,
                              fontWeight: isBold ? 'bold' : 'normal',
                              textAlign,
                              lineHeight: fieldLayout.lineSpacing || 1.5
                            }}
                          >
                            {field.type === 'static_text'
                              ? ((isRTL ? field.defaultValue?.ar : field.defaultValue?.en)
                                || field.defaultValue?.en
                                || field.defaultValue?.ar
                                || '-')
                              : formatValue(getFieldValue(section.id, field.key), field.type)}
                          </p>
                        )}
                      </div>
                    );
                  };

                  // Calculate section container styles
                  // Use padding from section.pdfStyle if available, otherwise use advancedLayout.padding
                  const sectionPadding = sectionStyle.padding !== undefined
                    ? `${sectionStyle.padding}px`
                    : (advPadding.top || advPadding.right || advPadding.bottom || advPadding.left
                      ? `${advPadding.top || 0}px ${advPadding.right || 0}px ${advPadding.bottom || 0}px ${advPadding.left || 0}px`
                      : '0');

                  // Use marginTop and marginBottom from section.pdfStyle if available
                  const sectionMarginTop = sectionStyle.marginTop !== undefined
                    ? `${sectionStyle.marginTop}px`
                    : `${advMargins.top || 0}px`;
                  const sectionMarginBottom = sectionStyle.marginBottom !== undefined
                    ? `${sectionStyle.marginBottom}px`
                    : `${advMargins.bottom || advSpacing.sectionSpacing || sectionSpacing}px`;

                  const sectionContainerStyle = {
                    marginTop: sectionMarginTop,
                    marginBottom: sectionMarginBottom,
                    marginLeft: `${advMargins.left || 0}px`,
                    marginRight: `${advMargins.right || 0}px`,
                    backgroundColor: showBackground ? sectionBgColor : 'transparent',
                    border: showBorder ? `${sectionBorderWidth}px solid ${sectionBorderColor}` : 'none',
                    borderRadius: showBorder ? '8px' : '0',
                    padding: sectionPadding,
                    width: advSizing.width || '100%',
                    maxWidth: advSizing.maxWidth || '100%',
                    minWidth: advSizing.minWidth || 'auto',
                    height: advSizing.height || 'auto'
                  };

                  return (
                    <div key={section.id} style={sectionContainerStyle}>
                      {/* Section Header */}
                      {sectionType === 'header' ? (
                        (() => {
                          // For header sections, also check showTitle
                          return shouldShowTitle() ? (
                            <div
                              className="text-center py-4"
                              style={{
                                color: primaryColor,
                                fontSize: `${(pdfStyle.fontSize?.section || 20) + 4}px`,
                                fontWeight: 'bold'
                              }}
                            >
                              {isRTL ? section.label.ar : section.label.en}
                            </div>
                          ) : null;
                        })()
                      ) : (
                        (() => {
                          // Check showTitle - default to true if undefined (backward compatibility)
                          return shouldShowTitle() ? (
                            <div
                              className="px-4 py-3 rounded-t-lg"
                              style={{
                                backgroundColor: sectionType === 'totals' ? primaryColor : '#374151',
                                color: '#ffffff'
                              }}
                            >
                              <h3
                                className="font-bold"
                                style={{ fontSize: `${pdfStyle.fontSize?.section || 20}px` }}
                              >
                                {sIdx + 1}. {isRTL ? section.label.ar : section.label.en}
                              </h3>
                            </div>
                          ) : null;
                        })()
                      )}

                      {/* Section Content - Based on Layout Type */}
                      {sectionType !== 'header' && (
                        <div className="overflow-hidden">
                          {/* Table Layout */}
                          {layoutType === 'table' && advancedLayout.table?.enabled && (
                            <div className="overflow-x-auto">
                              <table
                                className="w-full"
                                style={{
                                  borderCollapse: 'collapse',
                                  border: 'none', // Remove outer table border - section border handles it
                                  tableLayout: hasResolvedTableColumnWidths ? 'fixed' : 'auto'
                                }}
                              >
                                {hasResolvedTableColumnWidths && (
                                  <colgroup>
                                    {leafTableColumns.map((col, colIdx) => (
                                      <col
                                        key={col.id || colIdx}
                                        style={{ width: resolvedTableColumnWidths[colIdx] }}
                                      />
                                    ))}
                                  </colgroup>
                                )}
                                {advancedLayout.table?.showHeader !== false && advancedLayout.table?.columns?.length > 0 && (
                                  <thead>
                                    <tr>
                                      {tableColumns.map((col, colIdx) => {
                                        const childColumns = Array.isArray(col?.children) ? col.children : [];
                                        const leafCount = childColumns.length > 0 ? getLeafTableColumns(childColumns).length : 1;

                                        return (
                                          <th
                                            key={col.id || colIdx}
                                            colSpan={leafCount}
                                            rowSpan={hasGroupedTableColumns && childColumns.length === 0 ? 2 : 1}
                                            style={{
                                              backgroundColor: col.headerStyle?.backgroundColor || '#f3f4f6',
                                              color: col.headerStyle?.textColor || '#000000',
                                              fontSize: `${col.headerStyle?.fontSize || 18}px`,
                                              fontWeight: col.headerStyle?.bold ? 'bold' : 'normal',
                                              padding: '12px',
                                              textAlign: resolveTextAlign(col.alignment),
                                              border: !showBorder && advancedLayout.table?.showBorders !== false ? `1px solid ${borderColor}` : 'none',
                                              overflowWrap: 'anywhere',
                                              wordBreak: 'break-word'
                                            }}
                                          >
                                            {isRTL ? col.label?.ar || col.label?.en : col.label?.en || col.label?.ar}
                                          </th>
                                        );
                                      })}
                                    </tr>
                                    {hasGroupedTableColumns && (
                                      <tr>
                                        {tableColumns.flatMap((col) => {
                                          const childColumns = Array.isArray(col?.children) ? col.children : [];

                                          return childColumns.map((childCol, childIdx) => {
                                            const leafColumnIndex = leafTableColumns.findIndex((leafCol) => leafCol.id === childCol.id);

                                            return (
                                              <th
                                                key={childCol.id || `${col.id || 'group'}_${childIdx}`}
                                                style={{
                                                  backgroundColor: childCol.headerStyle?.backgroundColor || '#f3f4f6',
                                                  color: childCol.headerStyle?.textColor || '#000000',
                                                  fontSize: `${childCol.headerStyle?.fontSize || 18}px`,
                                                  fontWeight: childCol.headerStyle?.bold ? 'bold' : 'normal',
                                                  padding: '12px',
                                                  textAlign: resolveTextAlign(childCol.alignment),
                                                  border: !showBorder && advancedLayout.table?.showBorders !== false ? `1px solid ${borderColor}` : 'none',
                                                  width: resolvedTableColumnWidths[leafColumnIndex],
                                                  overflowWrap: 'anywhere',
                                                  wordBreak: 'break-word'
                                                }}
                                              >
                                                {isRTL ? childCol.label?.ar || childCol.label?.en : childCol.label?.en || childCol.label?.ar}
                                              </th>
                                            );
                                          });
                                        })}
                                      </tr>
                                    )}
                                  </thead>
                                )}
                                <tbody>
                                  {(() => {
                                    // Handle dynamic rows
                                    if (advancedLayout.table?.dynamicRows && advancedLayout.table?.rowSource) {
                                      const rowSourceField = fieldsToRender.find(f => f.key === advancedLayout.table.rowSource);
                                      const rowData = rowSourceField ? getFieldValue(section.id, advancedLayout.table.rowSource) : [];
                                      const rows = Array.isArray(rowData) ? rowData : [];

                                      return rows.length > 0 ? (
                                        rows.map((row, rowIdx) => (
                                          <tr
                                            key={rowIdx}
                                            style={{
                                              backgroundColor: advancedLayout.table?.stripedRows && rowIdx % 2 === 1 ? '#f9fafb' : 'transparent'
                                            }}
                                          >
                                            {leafTableColumns.map((col, colIdx) => {
                                              const valueKey = col.fieldKey || col.id || `col${colIdx + 1}`;
                                              const value = row[valueKey] ?? '-';
                                              // Use fieldType from column definition, or default to 'text'
                                              const fieldType = col.fieldType || 'text';
                                              return (
                                                <td
                                                  key={col.id || colIdx}
                                                  style={{
                                                    padding: '12px',
                                                    textAlign: resolveTextAlign(col.alignment),
                                                    border: !showBorder && advancedLayout.table?.showBorders !== false ? `1px solid ${borderColor}` : 'none',
                                                    fontSize: `${pdfStyle.fontSize?.field || 16}px`,
                                                    width: resolvedTableColumnWidths[colIdx],
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word'
                                                  }}
                                                >
                                                  {formatValue(value, fieldType)}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        ))
                                      ) : (
                                        <tr>
                                          <td
                                            colSpan={leafTableColumns.length}
                                            className="text-center py-8 text-gray-500 text-base"
                                          >
                                            {t('forms.noData')}
                                          </td>
                                        </tr>
                                      );
                                    } else {
                                      // Static rows - read values from formInstance.values
                                      const numberOfRows = advancedLayout.table?.numberOfRows || 10;

                                      return Array.from({ length: numberOfRows }).map((_, rowIdx) => {
                                        // Check if this row has any data
                                        const hasData = leafTableColumns.some((col, colIdx) => {
                                          const colId = col.id || `col${colIdx + 1}`;
                                          const cellKey = `${section.id}.row_${rowIdx}.col_${colId}`;
                                          const value = formInstance.values[cellKey];
                                          return value !== undefined && value !== null && value !== '';
                                        });

                                        // Only show rows that have data, or show first empty row if no data exists
                                        if (!hasData && rowIdx > 0) {
                                          // Skip empty rows after the first one
                                          return null;
                                        }

                                        return (
                                          <tr
                                            key={rowIdx}
                                            style={{
                                              backgroundColor: advancedLayout.table?.stripedRows && rowIdx % 2 === 1 ? '#f9fafb' : 'transparent'
                                            }}
                                          >
                                            {leafTableColumns.map((col, colIdx) => {
                                              // Match the key format used in FillForm: sectionId.row_rowIdx.col_colId
                                              // col.id is like "col1", so we use col_col1
                                              const colId = col.id || `col${colIdx + 1}`;
                                              const cellKey = `${section.id}.row_${rowIdx}.col_${colId}`;
                                              const cellValue = formInstance.values[cellKey];
                                              // Use fieldType from column definition, or default to 'text'
                                              const fieldType = col.fieldType || 'text';

                                              return (
                                                <td
                                                  key={col.id || colIdx}
                                                  style={{
                                                    padding: '12px',
                                                    textAlign: resolveTextAlign(col.alignment),
                                                    border: !showBorder && advancedLayout.table?.showBorders !== false ? `1px solid ${borderColor}` : 'none',
                                                    fontSize: `${pdfStyle.fontSize?.field || 16}px`,
                                                    width: resolvedTableColumnWidths[colIdx],
                                                    backgroundColor: advancedLayout.table?.cellStyle?.backgroundColor || 'transparent',
                                                    color: advancedLayout.table?.cellStyle?.textColor || '#000000',
                                                    overflowWrap: 'anywhere',
                                                    wordBreak: 'break-word'
                                                  }}
                                                >
                                                  {cellValue !== undefined && cellValue !== null && cellValue !== ''
                                                    ? formatValue(cellValue, fieldType)
                                                    : '-'}
                                                </td>
                                              );
                                            })}
                                          </tr>
                                        );
                                      }).filter(Boolean); // Remove null entries
                                    }
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          )}

                          {/* Column Layout */}
                          {layoutType === 'columns' && advancedLayout.columns?.enabled && (
                            <div
                              className="p-4"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: advancedLayout.columns?.equalWidths
                                  ? `repeat(${advancedLayout.columns.columnCount || 2}, 1fr)`
                                  : advancedLayout.columns?.columnWidths?.join(' ') || `repeat(${advancedLayout.columns.columnCount || 2}, 1fr)`,
                                gap: `${advancedLayout.columns?.columnGap || 20}px`
                              }}
                            >
                              {fieldsToRender.map((field, fIdx) => renderFieldContent(field, fIdx))}
                            </div>
                          )}

                          {/* Grid Layout */}
                          {layoutType === 'grid' && advancedLayout.grid?.enabled && (
                            <div
                              className="p-4"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: advancedLayout.grid?.template || `repeat(${advancedLayout.grid?.columns || 1}, 1fr)`,
                                gridTemplateRows: `repeat(${advancedLayout.grid?.rows || 1}, auto)`,
                                gap: `${advancedLayout.grid?.gap || 10}px`
                              }}
                            >
                              {fieldsToRender.map((field, fIdx) => renderFieldContent(field, fIdx))}
                            </div>
                          )}

                          {/* Simple Layout (Default) */}
                          {(layoutType === 'simple' || !advancedLayout.layoutType) && (
                            <div
                              className="p-4"
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: `${advSpacing.fieldSpacing || 16}px`
                              }}
                            >
                              {fieldsToRender.map((field, fIdx) => {
                                const fieldWidth = field.width || 'full';
                                const widthClass = {
                                  'full': 'col-span-2',
                                  'half': 'col-span-1',
                                  'third': 'col-span-1',
                                  'two-thirds': 'col-span-2',
                                  'quarter': 'col-span-1',
                                  'three-quarters': 'col-span-2'
                                }[fieldWidth] || 'col-span-2';

                                return (
                                  <div key={`${section.id}-${field.key}-${fIdx}`} className={widthClass}>
                                    {renderFieldContent(field, fIdx)}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Approval Notes */}
              {formInstance.approvalNotes && (
                <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-700 uppercase font-semibold mb-2">
                    {t('forms.approvalNotes')}
                  </p>
                  <p className="text-base text-gray-800 whitespace-pre-wrap">
                    {formInstance.approvalNotes}
                  </p>
                </div>
              )}

              {/* Signature Section */}
              {(() => {
                const signatureConfig = normalizedTemplate.pdfStyle?.signature || {
                  enabled: true,
                  showPreparedBy: true,
                  showApprovedBy: true
                };
                const signatureEntries = [];

                if (signatureConfig.enabled !== false && signatureConfig.showPreparedBy !== false) {
                  signatureEntries.push({
                    key: 'prepared',
                    label: t('forms.preparedBy'),
                    value: formInstance.filledBy?.name || '_______________'
                  });
                }

                if (signatureConfig.enabled !== false && signatureConfig.showApprovedBy !== false) {
                  signatureEntries.push({
                    key: 'approved',
                    label: t('forms.approvedBy'),
                    value: formInstance.approvedBy?.name || '_______________'
                  });
                }

                if (!signatureEntries.length) {
                  return null;
                }

                return (
                  <div className="pt-8 border-t-2 border-gray-200 mt-8">
                    <div className={`grid grid-cols-1 gap-8 ${signatureEntries.length > 1 ? 'md:grid-cols-2' : ''}`}>
                      {signatureEntries.map((entry) => (
                        <div key={entry.key} className={`text-center ${signatureEntries.length === 1 ? 'mx-auto w-full max-w-sm' : ''}`}>
                          <div className="border-t-2 border-gray-400 pt-2 mt-16">
                            <p className="text-base font-semibold text-gray-700">
                              {entry.label}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {entry.value}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Configured Footer */}
              {(() => {
                const pdfStyle = normalizedTemplate.pdfStyle || {};
                const footerConfig = pdfStyle.footer || {};
                const branding = pdfStyle.branding || {};
                const footerEnabled = footerConfig.enabled !== false;

                if (!footerEnabled) {
                  return null;
                }

                const footerBgColor = footerConfig.backgroundColor || pdfStyle.colors?.secondary || '#b51c20';
                const footerTextColor = footerConfig.textColor || '#ffffff';
                const footerBorderColor = pdfStyle.colors?.border || 'rgba(255,255,255,0.2)';
                const companyName = branding.companyName?.[i18n.language] || branding.companyName?.en || '';
                const footerText = footerConfig.content?.[i18n.language] || footerConfig.content?.en || '';
                const phoneNumber = footerConfig.phoneNumber || branding.companyPhone || '';
                const showPhone = footerConfig.showPhoneNumber && phoneNumber;
                const qrCodeValue = String(footerConfig.qrCodeValue || '').trim();
                const showQRCode = footerConfig.showQRCode && qrCodeValue;
                const qrPosition = footerConfig.qrCodePosition || 'center';
                const qrCodeSize = clampNumber(footerConfig.qrCodeSize, 84, 48, 160);
                const footerTemplate = resolveFooterTemplate(footerConfig.template);
                const socialLinks = footerConfig.showSocialIcons
                  ? (Array.isArray(footerConfig.socialLinks) ? footerConfig.socialLinks.filter((link) => String(link?.url || '').trim()) : [])
                  : [];
                const showCompanyInfo = footerConfig.showCompanyInfo !== false;
                const infoAlignmentClass = footerTemplate === 'centered' ? 'text-center' : (isRTL ? 'text-right' : 'text-left');
                const socialAlignmentClass = footerTemplate === 'centered'
                  ? 'justify-center'
                  : (isRTL ? 'justify-end' : 'justify-start md:justify-end');

                const infoBlock = (showCompanyInfo || showPhone) ? (
                  <div className={`space-y-2 ${infoAlignmentClass}`}>
                    {showCompanyInfo && companyName && (
                      <div className="text-lg font-bold">{companyName}</div>
                    )}
                    {showCompanyInfo && footerText && (
                      <div className="text-sm opacity-90">{footerText}</div>
                    )}
                    {showPhone && (
                      <a
                        href={`tel:${String(phoneNumber).replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold transition hover:underline"
                        style={{ color: footerTextColor }}
                      >
                        <FaPhone />
                        <span>{phoneNumber}</span>
                      </a>
                    )}
                  </div>
                ) : null;

                const socialBlock = socialLinks.length > 0 ? (
                  <div className={`flex flex-wrap gap-3 ${socialAlignmentClass}`}>
                    {socialLinks.map((link) => {
                      const href = buildSocialHref(link.type, link.url);
                      const Icon = SOCIAL_ICON_MAP[link.type] || FaGlobe;
                      const isExternalLink = /^https?:/i.test(href);

                      return (
                        <a
                          key={link.id || `${link.type}_${link.url}`}
                          href={href}
                          target={isExternalLink ? '_blank' : undefined}
                          rel={isExternalLink ? 'noreferrer' : undefined}
                          title={link.url}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/30 bg-white/10 text-base transition hover:bg-white/20"
                          style={{ color: footerTextColor }}
                        >
                          <Icon />
                        </a>
                      );
                    })}
                  </div>
                ) : null;

                const qrBlock = showQRCode ? (
                  <div className="inline-flex rounded-2xl bg-white p-3 shadow-sm">
                    <QRCodeSVG
                      value={qrCodeValue}
                      size={qrCodeSize}
                      bgColor="#ffffff"
                      fgColor={pdfStyle.colors?.primary || branding.primaryColor || '#111827'}
                    />
                  </div>
                ) : null;

                if (!infoBlock && !socialBlock && !qrBlock) {
                  return null;
                }

                const classicBlocks = [];
                if (qrBlock && qrPosition === 'left') {
                  classicBlocks.push({ key: 'qr-left', className: 'shrink-0', node: qrBlock });
                }
                if (infoBlock) {
                  classicBlocks.push({ key: 'info', className: 'min-w-[220px] flex-1', node: infoBlock });
                }
                if (qrBlock && qrPosition === 'center') {
                  classicBlocks.push({ key: 'qr-center', className: 'shrink-0', node: qrBlock });
                }
                if (socialBlock) {
                  classicBlocks.push({ key: 'social', className: 'min-w-[180px]', node: socialBlock });
                }
                if (qrBlock && qrPosition === 'right') {
                  classicBlocks.push({ key: 'qr-right', className: 'shrink-0', node: qrBlock });
                }

                const renderFooterBody = () => {
                  if (footerTemplate === 'centered') {
                    return (
                      <div className="flex flex-col items-center gap-4 p-6 text-center">
                        {qrBlock}
                        {infoBlock && (
                          <div className="w-full max-w-2xl text-center">
                            {infoBlock}
                          </div>
                        )}
                        {socialBlock && (
                          <div className="flex justify-center">
                            {socialBlock}
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (footerTemplate === 'contact') {
                    return (
                      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center">
                        {infoBlock && <div className="min-w-[240px] flex-1">{infoBlock}</div>}
                        {qrBlock && <div className="flex shrink-0 justify-center">{qrBlock}</div>}
                        {socialBlock && <div className="min-w-[180px] md:ml-auto">{socialBlock}</div>}
                      </div>
                    );
                  }

                  if (footerTemplate === 'minimal') {
                    return (
                      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                        {infoBlock && <div className="flex-1">{infoBlock}</div>}
                        {(socialBlock || qrBlock) && (
                          <div className={`flex flex-wrap items-center gap-4 ${isRTL ? 'justify-end' : 'justify-start md:justify-end'}`}>
                            {socialBlock}
                            {qrBlock}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
                      {classicBlocks.map((block) => (
                        <div key={block.key} className={block.className}>
                          {block.node}
                        </div>
                      ))}
                    </div>
                  );
                };

                return (
                  <div
                    className="mt-12 overflow-hidden rounded-[28px] border shadow-sm"
                    style={{ borderColor: footerBorderColor, backgroundColor: footerBgColor, color: footerTextColor }}
                  >
                    {renderFooterBody()}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* Form Images - Below PDF, Hidden in Print */}
      {/* {formInstance?.images && formInstance.images.length > 0 && !isPrintMode && (
        <div className="bg-white rounded-xl shadow-md p-6 print:hidden mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <FaImage />
            {t('forms.formImages') || 'Form Images'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {formInstance.images.map((image, idx) => (
              <div
                key={image._id || idx}
                className="relative group cursor-pointer"
                onClick={() => {
                  // This will be handled by parent component if needed
                  // For now, open in modal would require passing handler from ViewForm
                  window.open(`${process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'}${image.path}`, '_blank');
                }}
              >
                <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary transition-all">
                  <img
                    src={`${process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'}${image.path}`}
                    alt={image.filename}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <FaExpand className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-600 truncate text-center">{image.filename}</p>
              </div>
            ))}
          </div>
        </div>
      )} */}

      {/* Approval Actions - No Print */}
      {canApprove && (
        <div className="bg-white rounded-xl shadow-md p-6 print:hidden mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">
            {t('forms.approvalActions')}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('forms.approvalNotes')}
              </label>
              <textarea
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                rows={3}
                placeholder={t('forms.enterNotes')}
              />
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handleApprove}
                disabled={processing}
                variant="success"
              >
                <FaCheckCircle />
                {t('forms.approveForm')}
              </Button>
              <Button
                onClick={handleReject}
                disabled={processing}
                variant="danger"
              >
                <FaTimesCircle />
                {t('forms.rejectForm')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FormDocument
