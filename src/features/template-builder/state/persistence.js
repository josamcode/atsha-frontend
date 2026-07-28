/**
 * Turning editor state into an API payload, and validating it first.
 *
 * The backend requires BOTH locales on every title and label (`label.en` and
 * `label.ar` are `required` in the Mongoose schema), so a template authored in
 * one language only would be rejected with an opaque validation error. Mirroring
 * the filled locale into the empty one keeps single-language authoring working
 * without inventing content.
 */

const SERVER_MANAGED_KEYS = [
  '_id', 'id', '__v', 'organizationId', 'createdBy', 'createdAt', 'updatedAt',
  'subscriptionAccess', 'fixtureId'
];

const fillBothLocales = (value) => {
  const en = typeof value?.en === 'string' ? value.en : '';
  const ar = typeof value?.ar === 'string' ? value.ar : '';
  const fallback = en || ar || '';
  return { en: en || fallback, ar: ar || fallback };
};

const finalizeColumn = (column) => ({
  ...column,
  label: fillBothLocales(column.label),
  children: (column.children || []).map(finalizeColumn)
});

const finalizeField = (field, index) => ({
  ...field,
  order: index,
  label: fillBothLocales(field.label),
  defaultValue: fillBothLocales(field.defaultValue),
  placeholder: fillBothLocales(field.placeholder),
  options: (field.options || [])
    .filter((option) => option?.en || option?.ar)
    .map(fillBothLocales)
});

const finalizeSection = (section, index) => ({
  ...section,
  order: index,
  label: fillBothLocales(section.label),
  fields: (section.fields || []).map(finalizeField),
  advancedLayout: {
    ...section.advancedLayout,
    table: {
      ...section.advancedLayout?.table,
      columns: (section.advancedLayout?.table?.columns || []).map(finalizeColumn)
    }
  }
});

const finalizeTemplateForSave = (template) => {
  const payload = { ...template };
  SERVER_MANAGED_KEYS.forEach((key) => { delete payload[key]; });

  const sections = (template.sections || []).map(finalizeSection);

  return {
    ...payload,
    title: fillBothLocales(template.title),
    description: fillBothLocales(template.description),
    sections,
    layout: {
      ...template.layout,
      sectionOrder: sections.map((section) => section.id)
    },
    document: template.document,
    layoutVersion: template.document?.version || 2,
    pdfStyle: {
      ...template.pdfStyle,
      branding: {
        ...template.pdfStyle?.branding,
        companyName: fillBothLocales(template.pdfStyle?.branding?.companyName),
        companyAddress: fillBothLocales(template.pdfStyle?.branding?.companyAddress)
      },
      header: {
        ...template.pdfStyle?.header,
        subtitle: fillBothLocales(template.pdfStyle?.header?.subtitle)
      },
      footer: {
        ...template.pdfStyle?.footer,
        content: fillBothLocales(template.pdfStyle?.footer?.content),
        socialLinks: (template.pdfStyle?.footer?.socialLinks || [])
          .map((link) => ({ ...link, url: (link.url || '').trim() }))
          .filter((link) => link.url)
      }
    }
  };
};

/**
 * Blocking problems only. Anything that merely looks unusual (an empty section,
 * a very tall block) is surfaced as a canvas warning instead, so the author is
 * never stopped from saving work in progress.
 */
const validateTemplate = (template, language = 'en') => {
  const isArabic = language === 'ar';
  const errors = [];

  const hasTitle = Boolean(template.title?.en || template.title?.ar);
  if (!hasTitle) {
    errors.push({
      code: 'title',
      message: isArabic ? 'أضف عنواناً للنموذج' : 'Give the template a title'
    });
  }

  const sectionBlocks = (template.document?.blocks || []).filter((block) => block.type === 'section');
  if (sectionBlocks.length === 0) {
    errors.push({
      code: 'sections',
      message: isArabic ? 'أضف قسماً واحداً على الأقل' : 'Add at least one section'
    });
  }

  (template.sections || []).forEach((section) => {
    if (!section.label?.en && !section.label?.ar) {
      errors.push({
        code: `section:${section.id}`,
        sectionId: section.id,
        message: isArabic ? 'كل قسم يحتاج اسماً' : 'Every section needs a name'
      });
    }
    (section.fields || []).forEach((field) => {
      if (!field.label?.en && !field.label?.ar) {
        errors.push({
          code: `field:${section.id}:${field.key}`,
          sectionId: section.id,
          fieldKey: field.key,
          message: isArabic ? 'كل حقل يحتاج تسمية' : 'Every field needs a label'
        });
      }
    });
    const table = section.advancedLayout?.table;
    if (section.advancedLayout?.layoutType === 'table' && (table?.columns || []).length === 0) {
      errors.push({
        code: `table:${section.id}`,
        sectionId: section.id,
        message: isArabic ? 'قسم الجدول يحتاج عموداً واحداً على الأقل' : 'A table section needs at least one column'
      });
    }
  });

  return errors;
};

export {
  SERVER_MANAGED_KEYS,
  fillBothLocales,
  finalizeTemplateForSave,
  validateTemplate
};
