import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import Layout from '../../components/Layout/Layout';
import Loading from '../../components/Common/Loading';
import Button from '../../components/Common/Button';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import Modal from '../../components/Common/Modal';
import { showSuccess, showError, showWarning } from '../../utils/toast';
import { useConfirm } from '../../hooks/useConfirm';
import {
  FaArrowLeft,
  FaPrint,
  FaFilePdf,
  FaCheckCircle,
  FaTimesCircle,
  FaImage,
  FaTimes,
  FaCloudUploadAlt,
  FaTrash,
  FaExpand
} from 'react-icons/fa';

import FormDocument from './FormDocument';

const ViewForm = () => {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRTL = i18n.language === 'ar';

  const [formInstance, setFormInstance] = useState(null);
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { confirmState, confirm, closeConfirm } = useConfirm();

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

  // Check if template was deleted
  const isTemplateDeleted = formInstance && !formInstance.templateId;

  const handlePrint = () => {
    // Navigate to print page (view only)
    navigate(`/forms/print/${id}`);
  };

  const handleExportPDF = async () => {
    try {
      const response = await api.get(`/form-instances/${id}/export`, {
        responseType: 'blob',
        params: {
          language: i18n.language
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form-${id}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      showSuccess(t('forms.exportSuccess'));
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showError(t('forms.errorExporting'));
    }
  };

  const handleApprove = async () => {
    const confirmed = await confirm({
      title: t('forms.confirmApprove'),
      message: t('forms.confirmApproveMessage'),
      confirmText: t('common.approve'),
      cancelText: t('common.cancel'),
      type: 'success'
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      await api.put(`/form-instances/${id}/approve`, {
        status: 'approved',
        approvalNotes
      });
      showSuccess(t('forms.approvedSuccessfully'));
      fetchFormInstance();
      setApprovalNotes('');
    } catch (error) {
      console.error('Error approving form:', error);
      showError(t('forms.errorApproving'));
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!approvalNotes.trim()) {
      showWarning(t('forms.rejectionNotesRequired'));
      return;
    }

    const confirmed = await confirm({
      title: t('forms.confirmReject'),
      message: t('forms.confirmRejectMessage'),
      confirmText: t('common.reject'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    setProcessing(true);
    try {
      await api.put(`/form-instances/${id}/approve`, {
        status: 'rejected',
        approvalNotes
      });
      showSuccess(t('forms.rejectedSuccessfully'));
      fetchFormInstance();
      setApprovalNotes('');
    } catch (error) {
      console.error('Error rejecting form:', error);
      showError(t('forms.errorRejecting'));
    } finally {
      setProcessing(false);
    }
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImages(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('images', file);
      });

      const response = await api.post(`/form-instances/${id}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showSuccess(t('forms.imagesUploaded') || 'Images uploaded successfully');
      fetchFormInstance(); // Refresh form instance to show new images
      e.target.value = ''; // Reset input
    } catch (error) {
      console.error('Error uploading images:', error);
      showError(error.response?.data?.message || t('forms.errorUploadingImages') || 'Error uploading images');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleDeleteImage = async (imageId, e) => {
    if (e) {
      e.stopPropagation(); // Prevent opening modal when clicking delete
    }
    if (!imageId) return;

    const confirmed = await confirm({
      title: t('forms.confirmDeleteImage') || 'Delete Image',
      message: t('forms.confirmDeleteImageMessage') || 'Are you sure you want to delete this image?',
      confirmText: t('common.delete'),
      cancelText: t('common.cancel'),
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      await api.delete(`/form-instances/${id}/images/${imageId}`);
      showSuccess(t('forms.imageDeleted') || 'Image deleted successfully');
      fetchFormInstance(); // Refresh form instance
      if (selectedImage?._id === imageId) {
        setIsImageModalOpen(false);
        setSelectedImage(null);
      }
    } catch (error) {
      console.error('Error deleting image:', error);
      showError(error.response?.data?.message || t('forms.errorDeletingImage') || 'Error deleting image');
    }
  };

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsImageModalOpen(true);
  };

  if (loading) return <Loading />;
  if (!formInstance) return null;

  const canApprove = (user?.role === 'admin' || user?.role === 'supervisor') &&
    formInstance.status === 'submitted';

  // Show message if template was deleted
  if (isTemplateDeleted) {
    return (
      <Layout>
        <div className="space-y-6 pb-6">
          {/* Action Bar */}
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <button
                onClick={() => navigate('/forms')}
                className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
              >
                <FaArrowLeft />
                <span>{t('common.back')}</span>
              </button>
            </div>
          </div>

          {/* Template Deleted Message */}
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className={`flex flex-col items-center justify-center text-center ${isRTL ? 'rtl' : 'ltr'}`}>
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-yellow-100">
                  <FaTimesCircle className="h-10 w-10 text-yellow-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('forms.templateDeleted')}
              </h2>
              <p className="text-lg text-gray-600 mb-2 max-w-2xl">
                {t('forms.templateDeletedMessage')}
              </p>
              <p className="text-sm text-gray-500 mb-6 max-w-2xl">
                {t('forms.templateDeletedDescription')}
              </p>

              {/* Form Instance Info */}
              <div className="w-full max-w-2xl bg-gray-50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {t('forms.formDetails')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">{t('forms.formId')}:</span>
                    <span className="ml-2 text-gray-600">{formInstance._id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('forms.status')}:</span>
                    <span className="ml-2 text-gray-600">{t(`forms.${formInstance.status}`)}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('forms.department')}:</span>
                    <span className="ml-2 text-gray-600">{formInstance.department || t('common.unknown')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">{t('forms.date')}:</span>
                    <span className="ml-2 text-gray-600">
                      {formInstance.date ? new Date(formInstance.date).toLocaleDateString() : t('common.unknown')}
                    </span>
                  </div>
                  {formInstance.filledBy && (
                    <div>
                      <span className="font-medium text-gray-700">{t('forms.filledBy')}:</span>
                      <span className="ml-2 text-gray-600">{formInstance.filledBy.name}</span>
                    </div>
                  )}
                  {formInstance.createdAt && (
                    <div>
                      <span className="font-medium text-gray-700">{t('forms.submittedOn')}:</span>
                      <span className="ml-2 text-gray-600">
                        {new Date(formInstance.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {formInstance.shift && (
                    <div>
                      <span className="font-medium text-gray-700">{t('forms.shift')}:</span>
                      <span className="ml-2 text-gray-600">{t(`forms.${formInstance.shift}`)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // If template exists but is null/undefined, still show error
  if (!template) {
    return (
      <Layout>
        <div className="space-y-6 pb-6">
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className={`flex flex-col items-center justify-center text-center ${isRTL ? 'rtl' : 'ltr'}`}>
              <div className="mb-6">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100">
                  <FaTimesCircle className="h-10 w-10 text-red-600" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('forms.errorLoading')}
              </h2>
              <p className="text-lg text-gray-600 mb-6">
                {t('forms.errorLoadingTemplate')}
              </p>
              <Button onClick={() => navigate('/forms')}>
                {t('common.back')}
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 pb-6">
        {/* Action Bar */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <button
              onClick={() => navigate('/forms')}
              className="flex items-center gap-2 text-gray-600 hover:text-primary transition-colors"
            >
              <FaArrowLeft />
              <span>{t('common.back')}</span>
            </button>

            <div className="flex items-center gap-3">
              <Button onClick={() => navigate(`/forms/print/${id}`)}>
                <FaFilePdf />
                {t('forms.exportPDF')}
              </Button>
            </div>
          </div>
        </div>

        {/* Form Document */}
        <FormDocument
          formInstance={formInstance}
          template={template}
          canApprove={canApprove}
          approvalNotes={approvalNotes}
          setApprovalNotes={setApprovalNotes}
          handleApprove={handleApprove}
          handleReject={handleReject}
          processing={processing}
        />

        {/* Form Images Upload - Only for admins/supervisors */}
        {(user?.role === 'admin' || user?.role === 'supervisor') && (
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaImage />
              {t('forms.uploadFormImages') || 'Upload Form Images'}
            </h3>
            <div className="space-y-4">
              {/* Professional Upload Input */}
              <div>
                <label className={`block text-sm font-medium text-gray-700 mb-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('forms.uploadImages') || 'Upload Images'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImages}
                    id="image-upload-input"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${uploadingImages
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-300 hover:border-primary hover:bg-gray-50'
                    }`}>
                    <FaCloudUploadAlt className={`mx-auto text-3xl mb-2 ${uploadingImages ? 'text-primary animate-pulse' : 'text-gray-400'
                      }`} />
                    <p className={`text-sm font-medium ${uploadingImages ? 'text-primary' : 'text-gray-700'
                      }`}>
                      {uploadingImages
                        ? (t('forms.uploading') || 'Uploading...')
                        : (t('forms.clickOrDragImages') || 'Click or drag images here to upload')
                      }
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {t('forms.supportedFormats') || 'Supported formats: JPG, PNG, GIF'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Display Images */}
              {formInstance?.images && formInstance.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formInstance.images.map((image, idx) => (
                    <div
                      key={image._id || idx}
                      className="relative group cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    >
                      <div className="relative overflow-hidden rounded-lg border-2 border-gray-200 hover:border-primary transition-all">
                        <img
                          src={`${process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'}${image.path}`}
                          alt={image.filename}
                          className="w-full h-40 object-cover"
                          loading="lazy"
                        />
                        {/* Delete Button - Always visible on top */}
                        <button
                          onClick={(e) => handleDeleteImage(image._id, e)}
                          className="absolute top-2 right-2 bg-primary hover:bg-primary text-white p-2 rounded-full shadow-lg transition-all z-20"
                          title={t('common.delete')}
                        >
                          <FaTrash className="text-xs" />
                        </button>
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                          <FaExpand className="text-white text-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      <p className="mt-2 text-xs text-gray-600 truncate text-center">{image.filename}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image View Modal */}
        <Modal
          isOpen={isImageModalOpen}
          onClose={() => {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }}
          title={selectedImage?.filename || ''}
          size="xl"
        >
          {selectedImage && (
            <div className="relative">
              <img
                src={`${process.env.REACT_APP_API_URL?.replace(/\/api\/?$/, '') || 'http://localhost:5000'}${selectedImage.path}`}
                alt={selectedImage.filename}
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                loading="lazy"
              />
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-600">{selectedImage.filename}</p>
                <Button
                  onClick={(e) => handleDeleteImage(selectedImage._id, e)}
                  variant="danger"
                  size="sm"
                >
                  <FaTrash className="mr-2" />
                  {t('common.delete')}
                </Button>
              </div>
            </div>
          )}
        </Modal>

      </div>

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmState.isOpen}
        onClose={closeConfirm}
        onConfirm={confirmState.onConfirm}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        cancelText={confirmState.cancelText}
        type={confirmState.type}
      />
    </Layout>
  );
};

export default ViewForm;

