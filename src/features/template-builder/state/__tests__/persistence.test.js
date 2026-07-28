import { finalizeTemplateForSave, validateTemplate, fillBothLocales } from '../persistence';
import { saveDraft, readDraft, clearDraft, draftKey, DRAFT_VERSION } from '../draftStorage';
import { builderReducer, createInitialState } from '../builderReducer';

const { resolveTemplateContract } = require('../../../../document/templateContract');
const fixtures = require('../../../../document/__fixtures__/templates');

const editorState = (template = fixtures.groupedTableForm()) => createInitialState(template).template;

describe('finalizeTemplateForSave', () => {
  it('strips every server-managed key', () => {
    const template = { ...editorState(), _id: 'x', __v: 3, organizationId: 'o', createdBy: 'u', createdAt: 'd', updatedAt: 'd', subscriptionAccess: {} };
    const payload = finalizeTemplateForSave(template);
    ['_id', '__v', 'organizationId', 'createdBy', 'createdAt', 'updatedAt', 'subscriptionAccess', 'fixtureId']
      .forEach((key) => expect(payload[key]).toBeUndefined());
  });

  it('sends the visual document and its version', () => {
    const payload = finalizeTemplateForSave(editorState());
    expect(payload.document.version).toBe(2);
    expect(payload.layoutVersion).toBe(2);
    expect(payload.document.blocks.length).toBeGreaterThan(0);
  });

  it('fills the empty locale so the backend required fields are satisfied', () => {
    const template = editorState(fixtures.simpleForm());
    template.title = { en: 'Only English', ar: '' };
    template.sections[0].label = { en: '', ar: 'عربي فقط' };
    template.sections[0].fields[0].label = { en: 'Name', ar: '' };

    const payload = finalizeTemplateForSave(template);
    expect(payload.title).toEqual({ en: 'Only English', ar: 'Only English' });
    expect(payload.sections[0].label).toEqual({ en: 'عربي فقط', ar: 'عربي فقط' });
    expect(payload.sections[0].fields[0].label).toEqual({ en: 'Name', ar: 'Name' });
  });

  it('fills both locales for nested grouped column labels', () => {
    const template = editorState(fixtures.groupedTableForm());
    template.sections[0].advancedLayout.table.columns[1].children[0].label = { en: 'In', ar: '' };
    const payload = finalizeTemplateForSave(template);
    expect(payload.sections[0].advancedLayout.table.columns[1].children[0].label)
      .toEqual({ en: 'In', ar: 'In' });
  });

  it('rebuilds layout.sectionOrder from the saved sections', () => {
    const payload = finalizeTemplateForSave(editorState(fixtures.multiSectionForm()));
    expect(payload.layout.sectionOrder).toEqual(payload.sections.map((section) => section.id));
  });

  it('drops social links with no URL and trims the rest', () => {
    const template = editorState(fixtures.simpleForm());
    template.pdfStyle.footer.socialLinks = [
      { id: 'a', type: 'website', url: '  https://example.com  ' },
      { id: 'b', type: 'email', url: '' },
      { id: 'c', type: 'x', url: '   ' }
    ];
    const payload = finalizeTemplateForSave(template);
    expect(payload.pdfStyle.footer.socialLinks).toEqual([
      { id: 'a', type: 'website', url: 'https://example.com' }
    ]);
  });

  it('keeps every previously dropped style property in the payload', () => {
    const template = editorState(fixtures.tableForm());
    template.sections[0].advancedLayout.table.numberOfRows = 33;
    template.pdfStyle.header.showSubtitle = true;
    template.pdfStyle.colors.secondary = '#123456';
    template.pdfStyle.footer.companyName = 'AraRM Ltd';

    const payload = finalizeTemplateForSave(template);
    expect(payload.sections[0].advancedLayout.table.numberOfRows).toBe(33);
    expect(payload.pdfStyle.header.showSubtitle).toBe(true);
    expect(payload.pdfStyle.colors.secondary).toBe('#123456');
    expect(payload.pdfStyle.footer.companyName).toBe('AraRM Ltd');
  });

  it('round-trips: saving then reloading the payload reproduces the same document', () => {
    const original = editorState(fixtures.columnsForm());
    const payload = finalizeTemplateForSave(original);
    // Simulate the server echoing the payload straight back.
    const reloaded = resolveTemplateContract(JSON.parse(JSON.stringify(payload)));

    expect(reloaded.ok).toBe(true);
    expect(reloaded.migrated).toBe(false);
    expect(JSON.stringify(reloaded.document)).toEqual(JSON.stringify(original.document));
    expect(reloaded.sections.map((s) => s.fields.map((f) => f.grid)))
      .toEqual(original.sections.map((s) => s.fields.map((f) => f.grid)));
  });

  it('survives several save/reload cycles unchanged', () => {
    let template = editorState(fixtures.groupedTableForm());
    const first = JSON.stringify(finalizeTemplateForSave(template));
    for (let cycle = 0; cycle < 3; cycle += 1) {
      const payload = JSON.parse(JSON.stringify(finalizeTemplateForSave(template)));
      template = resolveTemplateContract(payload).template;
    }
    expect(JSON.stringify(finalizeTemplateForSave(template))).toEqual(first);
  });
});

describe('fillBothLocales', () => {
  it('mirrors whichever side has content', () => {
    expect(fillBothLocales({ en: 'A', ar: '' })).toEqual({ en: 'A', ar: 'A' });
    expect(fillBothLocales({ en: '', ar: 'ب' })).toEqual({ en: 'ب', ar: 'ب' });
    expect(fillBothLocales({ en: 'A', ar: 'ب' })).toEqual({ en: 'A', ar: 'ب' });
    expect(fillBothLocales(undefined)).toEqual({ en: '', ar: '' });
  });
});

describe('validateTemplate', () => {
  it('passes a complete template', () => {
    const template = editorState(fixtures.simpleForm());
    template.title = { en: 'Report', ar: 'تقرير' };
    expect(validateTemplate(template)).toEqual([]);
  });

  it('requires a title', () => {
    const template = editorState(fixtures.simpleForm());
    template.title = { en: '', ar: '' };
    expect(validateTemplate(template).map((error) => error.code)).toContain('title');
  });

  it('requires at least one section', () => {
    let state = createInitialState(fixtures.simpleForm());
    const block = state.template.document.blocks.find((item) => item.type === 'section');
    state = builderReducer(state, { type: 'DELETE_BLOCK', blockId: block.id });
    const errors = validateTemplate(state.template);
    expect(errors.map((error) => error.code)).toContain('sections');
  });

  it('points at the offending section and field', () => {
    const template = editorState(fixtures.simpleForm());
    template.title = { en: 'T', ar: 'ت' };
    template.sections[0].fields[0].label = { en: '', ar: '' };
    const errors = validateTemplate(template);
    expect(errors[0].sectionId).toBe('section_basic');
    expect(errors[0].fieldKey).toBe('employee_name');
  });

  it('requires columns on a table section', () => {
    const template = editorState(fixtures.tableForm());
    template.title = { en: 'T', ar: 'ت' };
    template.sections[0].advancedLayout.table.columns = [];
    expect(validateTemplate(template).map((error) => error.code))
      .toContain('table:section_items');
  });

  it('reports Arabic messages when asked', () => {
    const template = editorState(fixtures.simpleForm());
    template.title = { en: '', ar: '' };
    expect(validateTemplate(template, 'ar')[0].message).toMatch(/عنوان/);
  });
});

describe('draft recovery', () => {
  beforeEach(() => window.localStorage.clear());

  it('scopes the key by organization and template', () => {
    expect(draftKey('org1', 'tpl1')).toBe('ararm.templateBuilder.draft:org1:tpl1');
    expect(draftKey(null, null)).toBe('ararm.templateBuilder.draft:default:new');
  });

  it('stores and restores the whole document', () => {
    const template = editorState(fixtures.groupedTableForm());
    expect(saveDraft('org1', 'tpl1', template)).toBe(true);

    const draft = readDraft('org1', 'tpl1');
    expect(draft.version).toBe(DRAFT_VERSION);
    expect(draft.template.document.blocks).toHaveLength(template.document.blocks.length);
    expect(draft.template.sections[0].id).toBe('section_grouped');
  });

  it('keeps two tenants apart', () => {
    saveDraft('orgA', 'tpl1', editorState(fixtures.simpleForm()));
    saveDraft('orgB', 'tpl1', editorState(fixtures.tableForm()));
    expect(readDraft('orgA', 'tpl1').template.sections[0].id).toBe('section_basic');
    expect(readDraft('orgB', 'tpl1').template.sections[0].id).toBe('section_items');
  });

  it('clears a draft', () => {
    saveDraft('org1', 'tpl1', editorState());
    clearDraft('org1', 'tpl1');
    expect(readDraft('org1', 'tpl1')).toBeNull();
  });

  it('ignores a stale draft and cleans it up', () => {
    saveDraft('org1', 'tpl1', editorState());
    const key = draftKey('org1', 'tpl1');
    const stored = JSON.parse(window.localStorage.getItem(key));
    stored.savedAt = Date.now() - (1000 * 60 * 60 * 24 * 30);
    window.localStorage.setItem(key, JSON.stringify(stored));

    expect(readDraft('org1', 'tpl1')).toBeNull();
    expect(window.localStorage.getItem(key)).toBeNull();
  });

  it('ignores a draft written by an older builder', () => {
    const key = draftKey('org1', 'tpl1');
    window.localStorage.setItem(key, JSON.stringify({ version: 1, savedAt: Date.now(), template: {} }));
    expect(readDraft('org1', 'tpl1')).toBeNull();
  });

  it('survives a corrupted entry', () => {
    window.localStorage.setItem(draftKey('org1', 'tpl1'), 'not json');
    expect(readDraft('org1', 'tpl1')).toBeNull();
  });

  it('does not throw when storage is unavailable', () => {
    // jsdom's Storage is exotic, so the prototype method is what actually runs.
    const spy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(saveDraft('org1', 'tpl1', editorState())).toBe(false);

    spy.mockRestore();
    warn.mockRestore();
  });

  it('a restored draft is editable and still saves losslessly', () => {
    const template = editorState(fixtures.tableForm());
    saveDraft('org1', 'tpl1', template);
    const draft = readDraft('org1', 'tpl1');

    let state = createInitialState(fixtures.simpleForm());
    state = builderReducer(state, { type: 'RESTORE_DRAFT', template: draft.template });
    state = builderReducer(state, { type: 'ADD_BLOCK', blockType: 'divider' });

    const payload = finalizeTemplateForSave(state.template);
    expect(payload.sections[0].id).toBe('section_items');
    expect(payload.document.blocks.some((block) => block.type === 'divider')).toBe(true);
  });
});
