import React, {
  useCallback, useEffect, useMemo, useReducer, useRef, useState
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaExclamationTriangle, FaMobileAlt } from 'react-icons/fa';

import api from '../../utils/api';
import Loading from '../../components/Common/Loading';
import ConfirmDialog from '../../components/Common/ConfirmDialog';
import { showError, showSuccess, showWarning } from '../../utils/toast';
import { useAuth } from '../../context/AuthContext';
import { useOrganization } from '../../context/OrganizationContext';

import BuilderToolbar from './components/BuilderToolbar';
import ComponentPalette from './components/ComponentPalette';
import LayersPanel from './components/LayersPanel';
import BuilderCanvas from './components/BuilderCanvas';
import InspectorPanel from './components/inspector/InspectorPanel';
import StarterTemplatePicker from './components/StarterTemplatePicker';
import DocumentRenderer from '../document-renderer/DocumentRenderer';
import { SECTION_VARIANTS } from './paletteItems';
import { builderReducer, createInitialState, createSection, SAVE_STATES } from './state/builderReducer';
import { finalizeTemplateForSave, validateTemplate } from './state/persistence';
import { saveDraft, readDraft, clearDraft } from './state/draftStorage';
import './builder.css';

const { layoutDocument } = require('../../document/layoutEngine');
const { resolveTemplateContract } = require('../../document/templateContract');
const { buildSampleValues, buildSampleInstance } = require('../../document/sampleData');
const { getDefaultDocument, createBlock, createId } = require('../../document/documentModel');

const DRAFT_DEBOUNCE_MS = 900;
const MOBILE_BREAKPOINT = 1024;

/** A brand-new template: one section, header, details, signatures and footer. */
const buildStarterTemplate = (organization) => {
  const branding = organization?.branding || {};
  const firstSection = createSection({
    label: { en: 'Details', ar: 'البيانات' },
    fields: []
  });

  const documentValue = getDefaultDocument();
  documentValue.blocks = [
    createBlock('header', { id: 'blk_header', placement: 'pageHeader' }),
    createBlock('metadata', { id: 'blk_metadata', row: 0 }),
    createBlock('section', { id: `blk_section_${firstSection.id}`, refId: firstSection.id, row: 1 }),
    createBlock('signature', { id: 'blk_signature', row: 2, keepTogether: true }),
    createBlock('footer', { id: 'blk_footer', placement: 'pageFooter' })
  ];

  return {
    title: { en: '', ar: '' },
    description: { en: '', ar: '' },
    sections: [firstSection],
    visibleToRoles: ['admin', 'supervisor', 'employee'],
    editableByRoles: ['admin', 'supervisor', 'employee'],
    departments: ['all'],
    requiresApproval: true,
    isActive: true,
    layoutVersion: 2,
    document: documentValue,
    layout: {
      sectionOrder: [firstSection.id],
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 40, right: 34, bottom: 40, left: 34 }
    },
    pdfStyle: {
      header: {
        enabled: true, showLogo: true, showTitle: true, showSubtitle: false, showDate: true,
        showCompanyName: true, showCompanyAddress: false, layout: 'default',
        subtitle: { en: '', ar: '' }, titleStyle: 'normal',
        titleColor: '', decorativeLineColor: '', dashedBorder: false,
        height: 80, logoSize: 56,
        backgroundColor: '#ffffff', textColor: '#111827', fontSize: 16, logoPosition: 'right',
        border: { show: true, width: 3, style: 'solid', color: branding.primaryColor || '#01c853', position: 'bottom' }
      },
      footer: {
        enabled: true, showPageNumbers: true, showCompanyInfo: true, showQRCode: false,
        showPhoneNumber: false, showSocialIcons: false, qrCodePosition: 'right', qrCodeSize: 64,
        template: 'classic', height: 40, backgroundColor: '#f8fafc', textColor: '#64748b',
        fontSize: 8, phoneNumber: '', qrCodeValue: '', companyName: '',
        socialLinks: [], content: { en: '', ar: '' }
      },
      branding: {
        primaryColor: branding.primaryColor || '#01c853',
        secondaryColor: branding.secondaryColor || '#059669',
        logoUrl: branding.logoUrl || '',
        watermarkUrl: branding.watermarkUrl || '',
        watermarkSize: 55, watermarkOpacity: 5,
        companyName: {
          en: branding.displayName || branding.shortName || 'AraRM',
          ar: branding.displayName || branding.shortName || 'AraRM'
        },
        companyAddress: { en: '', ar: '' },
        companyPhone: '', companyEmail: branding.supportEmail || ''
      },
      metadata: {
        enabled: true, showFormId: true, showDate: true, showShift: true, showDepartment: true,
        showFilledBy: true, showSubmittedOn: true, showApprovedBy: true, showApprovalDate: true
      },
      signature: { enabled: true, showPreparedBy: true, showApprovedBy: true },
      fontFamily: 'Helvetica',
      fontSize: { title: 18, section: 13, field: 10 },
      colors: {
        primary: branding.primaryColor || '#01c853',
        secondary: branding.secondaryColor || '#059669',
        text: '#111827', border: '#d1d5db', background: '#ffffff'
      },
      spacing: { sectionSpacing: 14, fieldSpacing: 9, lineSpacing: 1.35 }
    }
  };
};

const TemplateBuilderPage = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const uiLanguage = i18n.language === 'ar' ? 'ar' : 'en';
  const { organization } = useAuth();
  const { setOrganizationContext } = useOrganization();

  const [state, dispatch] = useReducer(builderReducer, null, () => createInitialState(buildStarterTemplate(organization)));
  const [loading, setLoading] = useState(isEditMode);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewLanguage, setPreviewLanguage] = useState(uiLanguage);
  const [sampleData, setSampleData] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showMargins, setShowMargins] = useState(true);
  const [zoom, setZoom] = useState(0.85);
  const [leftTab, setLeftTab] = useState('components');
  const [mobileTab, setMobileTab] = useState('structure');
  const [paletteDragItem, setPaletteDragItem] = useState(null);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [leaveConfirm, setLeaveConfirm] = useState(null);
  const [brandingUploading, setBrandingUploading] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isNarrow, setIsNarrow] = useState(
    () => (typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false)
  );
  // Only a brand-new template starts at the layout chooser.
  const [choosingStarter, setChoosingStarter] = useState(!isEditMode);

  const draftTimerRef = useRef(null);
  const organizationId = organization?._id || organization?.id || null;
  const isDirty = state.saveState === SAVE_STATES.DIRTY || state.saveState === SAVE_STATES.ERROR;

  /* ------------------------------------------------------------- loading */

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!isEditMode) {
        const draft = readDraft(organizationId, null);
        if (draft) {
          // An unsaved new template outranks the layout chooser.
          setPendingDraft(draft);
          setChoosingStarter(false);
        }
        setLoading(false);
        return;
      }

      try {
        const response = await api.get(`/form-templates/${id}`);
        if (cancelled) return;
        const loaded = response.data.data;
        dispatch({ type: 'RESET', template: loaded });

        const draft = readDraft(organizationId, id);
        if (draft) {
          // A draft older than the stored template means someone else saved in
          // the meantime; offering it silently would let stale local work
          // overwrite theirs, so say so and let the author decide.
          const serverUpdatedAt = Date.parse(loaded?.updatedAt || '') || 0;
          setPendingDraft({ ...draft, staleAgainstServer: serverUpdatedAt > Number(draft.savedAt || 0) });
        }
      } catch (error) {
        if (cancelled) return;
        console.error('Error loading template:', error);
        showError(uiLanguage === 'ar' ? 'تعذر تحميل النموذج' : 'Could not load the template');
        navigate('/templates');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isEditMode, organizationId]);

  /* --------------------------------------------------------------- draft */

  // Latest values for the unmount/beforeunload flush, which must not re-subscribe
  // on every keystroke.
  const flushRef = useRef({ dirty: false, template: null });
  flushRef.current = { dirty: isDirty, template: state.template };

  useEffect(() => {
    if (loading || !isDirty) return undefined;
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(() => {
      saveDraft(organizationId, id || null, state.template);
    }, DRAFT_DEBOUNCE_MS);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [state.template, isDirty, loading, organizationId, id]);

  /**
   * The debounce means the most recent edits are the ones NOT yet in the draft —
   * exactly the ones a user loses by navigating away. Flush them synchronously on
   * unmount and before the tab goes, so the promise made by the leave dialog is
   * actually kept.
   */
  useEffect(() => () => {
    if (flushRef.current.dirty && flushRef.current.template) {
      saveDraft(organizationId, id || null, flushRef.current.template);
    }
  }, [organizationId, id]);

  /* ------------------------------------------------- unsaved-change guard */

  useEffect(() => {
    const handler = (event) => {
      if (!flushRef.current.dirty) return undefined;
      saveDraft(organizationId, id || null, flushRef.current.template);
      event.preventDefault();
      // Chrome requires returnValue to be set for the native prompt to appear.
      event.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [organizationId, id]);

  /**
   * Browser Back. The builder is a full-screen shell with no other in-app exit,
   * so a single sentinel history entry is enough: when the user pops it we put it
   * back and ask, rather than losing the page silently.
   */
  useEffect(() => {
    if (!isDirty) return undefined;
    window.history.pushState({ araBuilderGuard: true }, '');
    const onPopState = () => {
      if (!flushRef.current.dirty) return;
      window.history.pushState({ araBuilderGuard: true }, '');
      setLeaveConfirm({ to: '/templates' });
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isDirty]);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  /**
   * A new template is seeded before the organization has necessarily resolved.
   * Once it does, fill in the branding the starter would have used — but only
   * while the author has not touched those values, so nothing is overwritten.
   */
  const brandingSeededRef = useRef(false);
  useEffect(() => {
    if (isEditMode || brandingSeededRef.current || !organization?.branding) return;
    brandingSeededRef.current = true;

    const branding = organization.branding;
    const current = state.template.pdfStyle?.branding || {};
    const patch = {};
    if (!current.logoUrl && branding.logoUrl) patch.logoUrl = branding.logoUrl;
    if (!current.watermarkUrl && branding.watermarkUrl) patch.watermarkUrl = branding.watermarkUrl;
    if (!current.companyEmail && branding.supportEmail) patch.companyEmail = branding.supportEmail;

    const name = branding.displayName || branding.shortName;
    const looksUnset = !current.companyName?.en || current.companyName.en === 'AraRM';
    if (name && looksUnset && current.companyName?.en !== name) {
      patch.companyName = { en: name, ar: name };
    }
    // Only dispatch when something would actually change — otherwise a brand-new
    // template would be marked unsaved before the author has touched it.
    if (Object.keys(patch).length > 0) {
      dispatch({ type: 'UPDATE_PDF_STYLE', patch: { branding: patch } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization, isEditMode]);

  /* -------------------------------------------------------------- layout */

  const contract = useMemo(
    () => resolveTemplateContract(state.template, { organization }),
    [state.template, organization]
  );

  const previewValues = useMemo(
    () => (sampleData ? buildSampleValues(contract, previewLanguage) : {}),
    [sampleData, contract, previewLanguage]
  );

  const previewInstance = useMemo(
    () => (sampleData
      ? buildSampleInstance(state.template, previewLanguage)
      : { _id: '', date: null, createdAt: null, filledBy: null, approvedBy: null, values: {} }),
    [sampleData, state.template, previewLanguage]
  );

  const layout = useMemo(() => layoutDocument({
    contract,
    values: previewValues,
    formInstance: previewInstance,
    language: previewLanguage,
    mode: previewMode ? 'preview' : 'edit'
  }), [contract, previewValues, previewInstance, previewLanguage, previewMode]);

  const overflowBlockIds = useMemo(
    () => new Set((layout.overflows || []).map((item) => item.blockId)),
    [layout]
  );

  const existingBlockTypes = useMemo(
    () => new Set(state.template.document.blocks.map((block) => block.type)),
    [state.template]
  );

  /* ------------------------------------------------------------ commands */

  const command = useCallback((action) => dispatch(action), []);

  // Screen readers only announce a live region when its text CHANGES, so two
  // identical results in a row (two "Moved up" presses) would be silent. A
  // zero-width joiner alternates without being read out.
  const announce = useCallback((message) => {
    setAnnouncement((current) => (current === message ? `${message}‍` : message));
  }, []);

  const handleSelect = useCallback((selection) => dispatch({ type: 'SELECT', selection }), []);

  const addPaletteItem = useCallback((item, target) => {
    // The id is minted here rather than inside the reducer so the new block can
    // be selected immediately — an author who just dropped a component expects
    // its properties, not the document settings.
    const blockId = createId('blk');
    const action = {
      type: 'ADD_BLOCK',
      id: blockId,
      blockType: item.type,
      placement: item.overlay ? 'overlay' : undefined,
      w: item.defaultW,
      row: target?.row,
      x: 0
    };

    if (item.type === 'section') {
      const base = createSection();
      action.section = item.variant && SECTION_VARIANTS[item.variant]
        ? SECTION_VARIANTS[item.variant](base)
        : base;
      action.select = { kind: 'block', blockId, sectionId: action.section.id };
    } else {
      action.select = { kind: 'block', blockId, sectionId: null };
    }

    dispatch(action);
    announce(uiLanguage === 'ar' ? 'تمت إضافة العنصر' : 'Component added');
  }, [announce, uiLanguage]);

  const handleReorder = useCallback((blockId, targetBlockId, position) => {
    if (!targetBlockId) {
      dispatch({ type: 'REORDER_BLOCK', blockId, direction: position });
      return;
    }
    const target = state.template.document.blocks.find((block) => block.id === targetBlockId);
    if (!target) return;
    dispatch({
      type: 'MOVE_BLOCK',
      blockId,
      row: position === 'before' ? target.row : target.row + 1,
      x: 0,
      insertRow: true
    });
  }, [state.template]);

  const handleCopy = useCallback((blockId) => {
    const block = state.template.document.blocks.find((item) => item.id === blockId);
    if (!block) return;
    const section = block.refId
      ? state.template.sections.find((item) => item.id === block.refId)
      : null;
    dispatch({ type: 'COPY', payload: { block, section } });
    announce(uiLanguage === 'ar' ? 'تم النسخ' : 'Copied');
  }, [state.template, announce, uiLanguage]);

  const handlePaste = useCallback(() => {
    if (!state.clipboard) return;
    dispatch({ type: 'PASTE', payload: state.clipboard });
    announce(uiLanguage === 'ar' ? 'تم اللصق' : 'Pasted');
  }, [state.clipboard, announce, uiLanguage]);

  /* ---------------------------------------------------------------- save */

  const performSave = useCallback(async () => {
    const errors = validateTemplate(state.template, uiLanguage);
    if (errors.length > 0) {
      showWarning(errors[0].message);
      const first = errors.find((error) => error.sectionId);
      if (first) {
        const block = state.template.document.blocks.find((item) => item.refId === first.sectionId);
        if (block) {
          handleSelect({
            kind: first.fieldKey ? 'field' : 'block',
            blockId: block.id,
            sectionId: first.sectionId,
            fieldKey: first.fieldKey
          });
        }
      } else {
        handleSelect({ kind: 'document' });
      }
      return false;
    }

    dispatch({ type: 'SAVE_START' });
    try {
      const payload = finalizeTemplateForSave(state.template);
      const response = isEditMode
        ? await api.put(`/form-templates/${id}`, payload)
        : await api.post('/form-templates', payload);

      dispatch({ type: 'SAVE_SUCCESS', at: Date.now() });
      clearDraft(organizationId, id || null);
      showSuccess(uiLanguage === 'ar' ? 'تم حفظ النموذج' : 'Template saved');

      if (!isEditMode && response.data?.data?._id) {
        clearDraft(organizationId, null);
        navigate(`/templates/edit/${response.data.data._id}`, { replace: true });
      }
      return true;
    } catch (error) {
      const message = error?.response?.data?.message
        || (uiLanguage === 'ar' ? 'تعذر حفظ النموذج' : 'Could not save the template');
      dispatch({ type: 'SAVE_FAILURE', error: message });
      showError(message);
      return false;
    }
  }, [state.template, uiLanguage, isEditMode, id, organizationId, navigate, handleSelect]);

  const handleBack = useCallback(() => {
    if (isDirty) {
      setLeaveConfirm({ to: '/templates' });
      return;
    }
    navigate('/templates');
  }, [isDirty, navigate]);

  const uploadBrandingAsset = useCallback(async (assetType, file) => {
    setBrandingUploading(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await api.post(
        `/organizations/current/settings/branding-assets/${assetType}`,
        body
      );
      const updated = response.data?.data?.organization || response.data?.data;
      if (updated) setOrganizationContext(updated);
      const url = assetType === 'logo'
        ? updated?.branding?.logoUrl
        : updated?.branding?.watermarkUrl;
      if (url) {
        dispatch({
          type: 'UPDATE_PDF_STYLE',
          patch: { branding: assetType === 'logo' ? { logoUrl: url } : { watermarkUrl: url } }
        });
      }
      showSuccess(uiLanguage === 'ar' ? 'تم رفع الملف' : 'Upload complete');
    } catch (error) {
      showError(uiLanguage === 'ar' ? 'تعذر رفع الملف' : 'Could not upload the file');
    } finally {
      setBrandingUploading(false);
    }
  }, [setOrganizationContext, uiLanguage]);

  /* ------------------------------------------------------------- render */

  if (loading) {
    return <Loading />;
  }

  const T = (en, ar) => (uiLanguage === 'ar' ? ar : en);

  if (choosingStarter) {
    return (
      <StarterTemplatePicker
        language={uiLanguage}
        branding={organization?.branding}
        onChoose={(starter) => {
          dispatch({ type: 'RESET', template: { ...starter, layoutVersion: 1 } });
          dispatch({ type: 'SELECT', selection: { kind: 'document' } });
          setChoosingStarter(false);
        }}
        onSkip={() => setChoosingStarter(false)}
      />
    );
  }

  if (state.contractError) {
    return (
      <div className="tb-shell" style={{ justifyContent: 'center', alignItems: 'center', padding: 24 }}>
        <div className="tb-group" style={{ maxWidth: 520 }}>
          <div className="tb-warning">
            <FaExclamationTriangle style={{ marginTop: 2, flex: 'none' }} />
            <span>
              {uiLanguage === 'ar' ? state.contractError.messageAr : state.contractError.message}
            </span>
          </div>
          <button type="button" className="tb-icon-button" onClick={() => navigate('/templates')}>
            {T('Back to templates', 'العودة للنماذج')}
          </button>
        </div>
      </div>
    );
  }

  const leftPanel = (
    <aside className="tb-panel" aria-label={T('Components and structure', 'المكونات والهيكل')}>
      <div className="tb-panel__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          className="tb-panel__tab"
          aria-selected={leftTab === 'components'}
          onClick={() => setLeftTab('components')}
        >
          {T('Components', 'المكونات')}
        </button>
        <button
          type="button"
          role="tab"
          className="tb-panel__tab"
          aria-selected={leftTab === 'layers'}
          onClick={() => setLeftTab('layers')}
        >
          {T('Structure', 'الهيكل')}
        </button>
      </div>
      <div className="tb-panel__scroll">
        {leftTab === 'components' ? (
          <ComponentPalette
            language={uiLanguage}
            existingTypes={existingBlockTypes}
            onAdd={(item) => addPaletteItem(item)}
            onDragStart={setPaletteDragItem}
            onDragEnd={() => setPaletteDragItem(null)}
          />
        ) : (
          <LayersPanel
            language={uiLanguage}
            document={state.template.document}
            sections={state.template.sections}
            selection={state.selection}
            overflowBlockIds={overflowBlockIds}
            onSelect={handleSelect}
            onToggleHidden={(blockId) => {
              const block = state.template.document.blocks.find((item) => item.id === blockId);
              dispatch({ type: 'UPDATE_BLOCK', blockId, patch: { hidden: !block.hidden } });
            }}
            onToggleLocked={(blockId) => {
              const block = state.template.document.blocks.find((item) => item.id === blockId);
              dispatch({ type: 'UPDATE_BLOCK', blockId, patch: { locked: !block.locked } });
            }}
            onDelete={(blockId) => dispatch({ type: 'DELETE_BLOCK', blockId })}
            onReorder={handleReorder}
          />
        )}
      </div>
    </aside>
  );

  const inspector = (
    <InspectorPanel
      language={uiLanguage}
      template={state.template}
      selection={state.selection}
      overflows={layout.overflows || []}
      onCommand={command}
      onSelect={handleSelect}
      onDuplicateBlock={(blockId) => dispatch({ type: 'DUPLICATE_BLOCK', blockId })}
      onDeleteBlock={(blockId) => dispatch({ type: 'DELETE_BLOCK', blockId })}
      onUploadBrandingAsset={uploadBrandingAsset}
      brandingUploading={brandingUploading}
    />
  );

  const canvas = previewMode ? (
    <div className="tb-canvas">
      <DocumentRenderer
        layout={layout}
        zoom={zoom}
        mode="preview"
        language={previewLanguage}
        showPageNumbers
      />
    </div>
  ) : (
    <BuilderCanvas
      layout={layout}
      language={previewLanguage}
      zoom={zoom}
      selection={state.selection}
      showGrid={showGrid}
      showMargins={showMargins}
      paletteDragItem={paletteDragItem}
      showAlignmentGuides={state.template.document.grid.snap}
      onSelect={handleSelect}
      onCommand={command}
      onBeginGesture={() => dispatch({ type: 'BEGIN_GESTURE' })}
      onEndGesture={() => dispatch({ type: 'END_GESTURE' })}
      onCancelGesture={() => dispatch({ type: 'CANCEL_GESTURE' })}
      onAbandonGesture={() => dispatch({ type: 'ABANDON_GESTURE' })}
      onDropPaletteItem={(item, target) => {
        addPaletteItem(item, target);
        setPaletteDragItem(null);
      }}
      onDuplicate={(blockId) => dispatch({ type: 'DUPLICATE_BLOCK', blockId })}
      onDelete={(blockId) => dispatch({ type: 'DELETE_BLOCK', blockId })}
      onCopy={handleCopy}
      onPaste={handlePaste}
      onUndo={() => dispatch({ type: 'UNDO' })}
      onRedo={() => dispatch({ type: 'REDO' })}
      announce={announce}
    />
  );

  return (
    <div className="tb-shell" dir={uiLanguage === 'ar' ? 'rtl' : 'ltr'}>
      <BuilderToolbar
        language={uiLanguage}
        title={uiLanguage === 'ar' ? (state.template.title?.ar || '') : (state.template.title?.en || '')}
        onTitleChange={(value) => dispatch({
          type: 'UPDATE_META',
          patch: {
            title: uiLanguage === 'ar'
              ? { ...state.template.title, ar: value }
              : { ...state.template.title, en: value }
          }
        })}
        saveState={state.saveState}
        saveError={state.saveError}
        lastSavedAt={state.lastSavedAt}
        canUndo={state.past.length > 0}
        canRedo={state.future.length > 0}
        zoom={zoom}
        previewMode={previewMode}
        previewLanguage={previewLanguage}
        sampleData={sampleData}
        showGrid={showGrid}
        showMargins={showMargins}
        overflowCount={(layout.overflows || []).length}
        pageCount={layout.pageCount || 1}
        onBack={handleBack}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onZoom={(delta) => setZoom((current) => Math.min(2, Math.max(0.25, Math.round((current + delta) * 100) / 100)))}
        onZoomReset={() => setZoom(1)}
        onTogglePreview={() => setPreviewMode((current) => !current)}
        onTogglePreviewLanguage={() => setPreviewLanguage((current) => (current === 'ar' ? 'en' : 'ar'))}
        onToggleSampleData={() => setSampleData((current) => !current)}
        onToggleGrid={() => setShowGrid((current) => !current)}
        onToggleMargins={() => setShowMargins((current) => !current)}
        onSave={performSave}
        saving={state.saveState === SAVE_STATES.SAVING}
      />

      {isNarrow ? (
        <div className="tb-body" style={{ gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <div className="tb-panel">
            <div className="tb-panel__tabs" role="tablist">
              {[
                ['structure', T('Structure', 'الهيكل')],
                ['add', T('Add', 'إضافة')],
                ['properties', T('Properties', 'الخصائص')],
                ['preview', T('Preview', 'معاينة')]
              ].map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  className="tb-panel__tab"
                  aria-selected={mobileTab === key}
                  onClick={() => setMobileTab(key)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="tb-panel__scroll">
              <div className="tb-mobile-notice">
                <FaMobileAlt style={{ marginTop: 2, flex: 'none' }} />
                <span>
                  {T(
                    'On a phone you can add components, reorder them and edit every property. Precise on-page dragging and resizing needs a larger screen.',
                    'على الهاتف يمكنك إضافة المكونات وإعادة ترتيبها وتعديل كل الخصائص. السحب الدقيق وتغيير الحجم على الصفحة يحتاجان شاشة أكبر.'
                  )}
                </span>
              </div>

              {mobileTab === 'structure' && (
                <LayersPanel
                  language={uiLanguage}
                  document={state.template.document}
                  sections={state.template.sections}
                  selection={state.selection}
                  overflowBlockIds={overflowBlockIds}
                  onSelect={(selection) => { handleSelect(selection); setMobileTab('properties'); }}
                  onToggleHidden={(blockId) => {
                    const block = state.template.document.blocks.find((item) => item.id === blockId);
                    dispatch({ type: 'UPDATE_BLOCK', blockId, patch: { hidden: !block.hidden } });
                  }}
                  onToggleLocked={(blockId) => {
                    const block = state.template.document.blocks.find((item) => item.id === blockId);
                    dispatch({ type: 'UPDATE_BLOCK', blockId, patch: { locked: !block.locked } });
                  }}
                  onDelete={(blockId) => dispatch({ type: 'DELETE_BLOCK', blockId })}
                  onReorder={handleReorder}
                />
              )}

              {mobileTab === 'add' && (
                <ComponentPalette
                  language={uiLanguage}
                  existingTypes={existingBlockTypes}
                  onAdd={(item) => { addPaletteItem(item); setMobileTab('structure'); }}
                  onDragStart={() => {}}
                  onDragEnd={() => {}}
                />
              )}

              {mobileTab === 'properties' && (
                <div style={{ margin: '-12px' }}>{inspector}</div>
              )}

              {mobileTab === 'preview' && (
                <div style={{ overflowX: 'auto' }}>
                  <DocumentRenderer
                    layout={layout}
                    zoom={Math.min(1, (window.innerWidth - 60) / (layout.geometry.widthMm * 3.7795))}
                    mode="preview"
                    language={previewLanguage}
                    showPageNumbers
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="tb-body">
          {leftPanel}
          {canvas}
          {inspector}
        </div>
      )}

      <footer className="tb-statusbar">
        <span>
          {T('Page size', 'حجم الصفحة')}: <strong>{state.template.document.page.size}</strong>
          {' · '}
          {state.template.document.page.orientation === 'portrait' ? T('Portrait', 'طولي') : T('Landscape', 'عرضي')}
        </span>
        <span>{T('Pages', 'الصفحات')}: <strong>{layout.pageCount}</strong></span>
        <span>{T('Blocks', 'العناصر')}: <strong>{state.template.document.blocks.length}</strong></span>
        {(layout.overflows || []).length > 0 && (
          <span style={{ color: '#c2410c' }}>
            <FaExclamationTriangle style={{ marginInlineEnd: 4 }} />
            {uiLanguage === 'ar' ? layout.overflows[0].messageAr : layout.overflows[0].message}
          </span>
        )}
        <span className="tb-statusbar__spacer" />
        <span>
          {T('Arrow keys move · Alt+arrows resize · Ctrl+Z undo', 'الأسهم للتحريك · Alt+الأسهم لتغيير الحجم · Ctrl+Z للتراجع')}
        </span>
      </footer>

      <div className="tb-visually-hidden" role="status" aria-live="polite">{announcement}</div>

      {pendingDraft && (
        <ConfirmDialog
          isOpen
          type="info"
          title={T('Recover unsaved work?', 'استعادة العمل غير المحفوظ؟')}
          message={[
            T(
              `A draft from ${new Date(pendingDraft.savedAt).toLocaleString()} was found on this device.`,
              `تم العثور على مسودة بتاريخ ${new Date(pendingDraft.savedAt).toLocaleString('ar-EG')} على هذا الجهاز.`
            ),
            pendingDraft.staleAgainstServer
              ? T(
                'Warning: this template has been saved by someone since then. Restoring the draft will replace their version when you save.',
                'تحذير: تم حفظ هذا النموذج بواسطة شخص آخر بعد ذلك التاريخ. استعادة المسودة ستحل محل نسختهم عند الحفظ.'
              )
              : T('Restore it, or keep the saved version.', 'استعدها أو أبقِ النسخة المحفوظة.')
          ].join(' ')}
          confirmText={T('Restore draft', 'استعادة المسودة')}
          cancelText={T('Keep the saved version', 'الإبقاء على النسخة المحفوظة')}
          onConfirm={() => {
            dispatch({ type: 'RESTORE_DRAFT', template: pendingDraft.template });
            setPendingDraft(null);
            showSuccess(T('Draft restored', 'تمت استعادة المسودة'));
          }}
          /*
            Dismissing must not delete the draft: the same callback fires for the
            backdrop and the ✕, and an accidental click outside a dialog is not a
            decision to throw work away. The draft stays until it is saved over or
            expires.
          */
          onClose={() => setPendingDraft(null)}
        />
      )}

      {leaveConfirm && (
        <ConfirmDialog
          isOpen
          type="warning"
          title={T('Leave without saving?', 'المغادرة دون حفظ؟')}
          message={T(
            'You have unsaved changes. They stay available as a draft on this device, but the saved template will not include them.',
            'لديك تغييرات غير محفوظة. ستبقى كمسودة على هذا الجهاز، لكن النموذج المحفوظ لن يتضمنها.'
          )}
          confirmText={T('Leave', 'مغادرة')}
          cancelText={T('Stay', 'البقاء')}
          onConfirm={() => {
            const target = leaveConfirm.to;
            setLeaveConfirm(null);
            navigate(target);
          }}
          onClose={() => setLeaveConfirm(null)}
        />
      )}
    </div>
  );
};

export { buildStarterTemplate };
export default TemplateBuilderPage;
