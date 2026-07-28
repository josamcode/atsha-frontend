import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { FaFilePdf, FaTimesCircle, FaArrowLeft, FaPrint } from 'react-icons/fa';

import api from '../../utils/api';
import Loading from '../../components/Common/Loading';
import FormDocument from './FormDocument';
import { showError, showSuccess } from '../../utils/toast';
import Button from '../../components/Common/Button';

/**
 * Print / export screen.
 *
 * Two export paths, both of which now produce the SAME document as the builder:
 *
 *  - Download PDF asks the server, which runs the shared layout engine through
 *    PDFKit. That is the canonical output: real pages, selectable vector text and
 *    a properly embedded Arabic face.
 *  - If the server is unreachable, a client fallback rasterises each rendered
 *    page element at its true paper size. It captures page-by-page instead of the
 *    old single canvas as tall as the whole document, so page count, page size
 *    and pagination still match.
 *  - Print uses the browser dialog; the renderer emits an `@page` rule with the
 *    template's physical size, so browser printing is finally supported.
 */
const PrintForm = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const surfaceRef = useRef(null);

  const [formInstance, setFormInstance] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchFormInstance = async () => {
      try {
        const response = await api.get(`/form-instances/${id}`);
        if (cancelled) return;
        setFormInstance(response.data.data);
        setTemplate(response.data.data.templateId);
      } catch (error) {
        if (cancelled) return;
        console.error('Error fetching form instance:', error);
        showError(t('forms.errorLoading'));
        navigate('/forms');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchFormInstance();
    return () => { cancelled = true; };
  }, [id, navigate, t]);

  /** Swap cross-origin images for data URIs so html2canvas can capture them. */
  const preloadProxiedImages = useCallback(async (root) => {
    const map = new Map();
    const images = [...root.querySelectorAll('img')];
    await Promise.all(images.map(async (img) => {
      const source = img.getAttribute('src') || '';
      if (!source || source.startsWith('data:') || !/^https?:\/\//i.test(source)) {
        return;
      }
      if (map.has(source)) return;
      try {
        const response = await api.get('/media/proxy-image', {
          params: { url: source },
          responseType: 'blob'
        });
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(response.data);
        });
        map.set(source, dataUrl);
      } catch (error) {
        console.warn(`[PDF Export] Could not proxy image ${source}:`, error.message);
      }
    }));
    return map;
  }, []);

  /** Fallback: rasterise each page element at its true paper size. */
  const exportClientSide = useCallback(async () => {
    const surface = surfaceRef.current;
    if (!surface) {
      throw new Error('Nothing to export');
    }

    const pageElements = [...surface.querySelectorAll('.doc-page')];
    if (pageElements.length === 0) {
      throw new Error('Nothing to export');
    }

    const proxied = await preloadProxiedImages(surface);
    const first = pageElements[0].getBoundingClientRect();
    const pxToMm = 25.4 / 96;
    const pageWidthMm = first.width * pxToMm;
    const pageHeightMm = first.height * pxToMm;

    const pdf = new jsPDF({
      orientation: pageWidthMm > pageHeightMm ? 'landscape' : 'portrait',
      unit: 'mm',
      format: [pageWidthMm, pageHeightMm],
      compress: true
    });

    for (let index = 0; index < pageElements.length; index += 1) {
      // eslint-disable-next-line no-await-in-loop
      const canvas = await html2canvas(pageElements[index], {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          clonedDoc.querySelectorAll('img').forEach((img) => {
            const dataUrl = proxied.get(img.getAttribute('src') || '');
            if (dataUrl) img.src = dataUrl;
          });
          clonedDoc.querySelectorAll('.doc-page__margins, .doc-page__grid, .doc-page__number')
            .forEach((node) => { node.style.display = 'none'; });
        }
      });

      if (index > 0) {
        pdf.addPage([pageWidthMm, pageHeightMm], pageWidthMm > pageHeightMm ? 'landscape' : 'portrait');
      }
      pdf.addImage(
        canvas.toDataURL('image/jpeg', 0.92),
        'JPEG',
        0,
        0,
        pageWidthMm,
        pageHeightMm,
        `page-${index}`,
        'FAST'
      );
    }

    pdf.save(`form_${id}.pdf`);
  }, [id, preloadProxiedImages]);

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      // Canonical path: the server renders the same layout with real vector text.
      const response = await api.get(`/form-instances/${id}/export`, {
        params: { language: i18n.language === 'ar' ? 'ar' : 'en' },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `form_${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showSuccess(t('forms.exportSuccess') || 'PDF exported successfully');
    } catch (serverError) {
      console.warn('Server export failed, falling back to client rendering:', serverError?.message);
      try {
        await exportClientSide();
        showSuccess(t('forms.exportSuccess') || 'PDF exported successfully');
      } catch (clientError) {
        console.error('Error exporting PDF:', clientError);
        showError(t('forms.errorExporting') || 'Error exporting PDF');
      }
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loading />;
  if (!formInstance) return null;

  const isTemplateDeleted = !formInstance.templateId;

  if (isTemplateDeleted) {
    return (
      <div className="min-h-screen bg-gray-100 p-5">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-12 text-center shadow">
          <div className="mb-6 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100">
              <FaTimesCircle className="h-10 w-10 text-amber-600" />
            </div>
          </div>
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{t('forms.templateDeleted')}</h2>
          <p className="mx-auto mb-2 max-w-xl text-lg text-gray-600">{t('forms.templateDeletedMessage')}</p>
          <p className="mx-auto mb-8 max-w-xl text-sm text-gray-500">{t('forms.templateDeletedDescription')}</p>
          <Button onClick={() => navigate(`/forms/view/${id}`)}>
            <FaArrowLeft />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-100 p-5">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-12 text-center shadow">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">{t('forms.errorLoading')}</h2>
          <p className="mb-8 text-lg text-gray-600">{t('forms.errorLoadingTemplate')}</p>
          <Button onClick={() => navigate('/forms')}>{t('common.back')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-5 print:bg-white print:p-0">
      <div
        data-action-bar
        className="doc-print-hidden fixed top-5 z-50 flex gap-2 print:hidden"
        style={{ insetInlineEnd: '20px' }}
      >
        <Button onClick={handleExportPDF} disabled={exporting}>
          <FaFilePdf />
          {exporting ? (t('forms.exporting') || 'Exporting…') : t('forms.exportPDF')}
        </Button>
        <Button onClick={() => window.print()} disabled={exporting} variant="outline">
          <FaPrint />
          {t('forms.print') || 'Print'}
        </Button>
        <Button onClick={() => navigate(`/forms/view/${id}`)} disabled={exporting} variant="secondary">
          {t('common.close')}
        </Button>
      </div>

      <div ref={surfaceRef} data-print-content className="pt-16 print:pt-0">
        <FormDocument
          formInstance={formInstance}
          template={template}
          canApprove={false}
          isPrintMode
        />
      </div>
    </div>
  );
};

export default PrintForm;
