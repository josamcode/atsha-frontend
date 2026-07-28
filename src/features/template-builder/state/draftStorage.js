/**
 * Local draft recovery for the Template Builder.
 *
 * A visual editor produces a lot of work between saves, so an accidental refresh,
 * a closed tab or a navigation must not lose it. Drafts are written to
 * localStorage under a key scoped by organization + template so two tenants (or a
 * new template and an edited one) can never collide.
 *
 * A draft is only ever OFFERED, never applied silently — restoring it is the
 * user's decision, which is also what keeps a stale draft from quietly
 * overwriting a template someone else edited in the meantime.
 */

const DRAFT_PREFIX = 'ararm.templateBuilder.draft';
const DRAFT_VERSION = 2;
/** Older drafts are almost always stale enough to be misleading. */
const MAX_DRAFT_AGE_MS = 1000 * 60 * 60 * 24 * 7;

const storage = () => {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch (error) {
    return null;
  }
};

const draftKey = (organizationId, templateId) => (
  `${DRAFT_PREFIX}:${organizationId || 'default'}:${templateId || 'new'}`
);

const saveDraft = (organizationId, templateId, template) => {
  const store = storage();
  if (!store) return false;
  try {
    store.setItem(draftKey(organizationId, templateId), JSON.stringify({
      version: DRAFT_VERSION,
      savedAt: Date.now(),
      templateId: templateId || null,
      template
    }));
    return true;
  } catch (error) {
    // Quota exceeded or private mode — draft recovery is best-effort and must
    // never break editing.
    console.warn('[templateBuilder] Could not store the local draft:', error.message);
    return false;
  }
};

const readDraft = (organizationId, templateId) => {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(draftKey(organizationId, templateId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.version !== DRAFT_VERSION || !parsed.template) return null;
    if (Date.now() - Number(parsed.savedAt || 0) > MAX_DRAFT_AGE_MS) {
      store.removeItem(draftKey(organizationId, templateId));
      return null;
    }
    return parsed;
  } catch (error) {
    return null;
  }
};

const clearDraft = (organizationId, templateId) => {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(draftKey(organizationId, templateId));
  } catch (error) {
    // ignore
  }
};

export {
  DRAFT_PREFIX,
  DRAFT_VERSION,
  MAX_DRAFT_AGE_MS,
  draftKey,
  saveDraft,
  readDraft,
  clearDraft
};
