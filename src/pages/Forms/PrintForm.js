import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../utils/api';
import Loading from '../../components/Common/Loading';
import FormDocument from './FormDocument';
import { showError, showSuccess } from '../../utils/toast';
import { FaPrint, FaFilePdf, FaTimesCircle, FaArrowLeft } from 'react-icons/fa';
import Button from '../../components/Common/Button';

const PrintForm = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const printRef = useRef();

  const [formInstance, setFormInstance] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchFormInstance();
  }, [id]);

  const fetchFormInstance = async () => {
    try {
      const response = await api.get(`/form-instances/${id}`);
      setFormInstance(response.data.data);
      setTemplate(response.data.data.templateId);
    } catch (error) {
      console.error('Error fetching form instance:', error);
      showError(t('forms.errorLoading'));
      navigate('/forms');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    setExporting(true);

    try {
      const element = printRef.current;

      // Wait a bit for any images/fonts to load
      await new Promise(resolve => setTimeout(resolve, 500));

      // Hide the action buttons temporarily
      const actionBar = document.querySelector('[data-action-bar]');
      if (actionBar) {
        actionBar.style.display = 'none';
      }

      // Get scroll dimensions
      const scrollWidth = element.scrollWidth;
      const scrollHeight = element.scrollHeight;

      // Create canvas with high quality settings
      const canvas = await html2canvas(element, {
        scale: 3, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: scrollWidth,
        height: scrollHeight,
        windowWidth: scrollWidth,
        windowHeight: scrollHeight,
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        // Force rendering of all elements
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('[data-print-content]');
          if (clonedElement) {
            clonedElement.style.display = 'block';
            clonedElement.style.opacity = '1';
            clonedElement.style.visibility = 'visible';
          }
        }
      });

      // Show action bar again
      if (actionBar) {
        actionBar.style.display = 'flex';
      }

      // Get canvas dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      // Convert pixels to mm (1px = 0.264583mm)
      const pdfWidth = (imgWidth * 0.264583) / 3; // Divide by scale
      const pdfHeight = (imgHeight * 0.264583) / 3;

      // Create PDF with exact dimensions
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight],
        compress: true
      });

      // Convert canvas to image
      const imgData = canvas.toDataURL('image/jpeg', 1.0);

      // Add image to PDF (full page, no margins)
      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, '', 'FAST');

      // Save the PDF
      pdf.save(`form_${formInstance?.formNumber || id}.pdf`);

      showSuccess(t('forms.exportSuccess') || 'PDF exported successfully');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError(t('forms.errorExporting') || 'Error exporting PDF');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <Loading />;
  if (!formInstance) return null;

  // Check if template was deleted
  const isTemplateDeleted = !formInstance.templateId;

  // Show message if template was deleted
  if (isTemplateDeleted) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '20px' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              margin: '0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '80px',
              width: '80px',
              borderRadius: '50%',
              background: '#fef3c7'
            }}>
              <FaTimesCircle style={{ height: '40px', width: '40px', color: '#d97706' }} />
            </div>
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            {t('forms.templateDeleted')}
          </h2>
          <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '8px', maxWidth: '600px', margin: '0 auto 8px' }}>
            {t('forms.templateDeletedMessage')}
          </p>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '32px', maxWidth: '600px', margin: '0 auto 32px' }}>
            {t('forms.templateDeletedDescription')}
          </p>
          <Button onClick={() => navigate(`/forms/view/${id}`)}>
            <FaArrowLeft style={{ marginRight: '8px' }} />
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '20px' }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          background: 'white',
          borderRadius: '12px',
          padding: '48px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '16px' }}>
            {t('forms.errorLoading')}
          </h2>
          <p style={{ fontSize: '18px', color: '#4b5563', marginBottom: '32px' }}>
            {t('forms.errorLoadingTemplate')}
          </p>
          <Button onClick={() => navigate('/forms')}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', padding: '20px' }}>
      {/* Action Bar */}
      <div
        data-action-bar
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}
      >
        <button
          onClick={handleExportPDF}
          disabled={exporting}
          style={{
            background: exporting ? '#9ca3af' : '#d4b900',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: exporting ? 'wait' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => !exporting && (e.target.style.background = '#b91c1c')}
          onMouseLeave={(e) => !exporting && (e.target.style.background = '#d4b900')}
        >
          <FaFilePdf />
          {exporting ? (t('forms.exporting') || 'Exporting...') : t('forms.exportPDF')}
        </button>
        <button
          onClick={() => navigate(`/forms/view/${id}`)}
          disabled={exporting}
          style={{
            background: '#6b7280',
            color: 'white',
            padding: '12px 24px',
            borderRadius: '8px',
            border: 'none',
            cursor: exporting ? 'not-allowed' : 'pointer',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            transition: 'background 0.2s',
            opacity: exporting ? 0.6 : 1
          }}
          onMouseEnter={(e) => !exporting && (e.target.style.background = '#4b5563')}
          onMouseLeave={(e) => !exporting && (e.target.style.background = '#6b7280')}
        >
          {t('common.close')}
        </button>
      </div>

      {/* Form Document - Full Page View */}
      <div
        ref={printRef}
        data-print-content
        style={{
          width: '100%',
          margin: '0 auto',
          background: 'white',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          minHeight: 'calc(100vh - 40px)',
          position: 'relative'
        }}
      >
        <FormDocument
          formInstance={formInstance}
          template={template}
          canApprove={false}
          isPrintMode={true}
        />
      </div>
    </div>
  );
};

export default PrintForm;