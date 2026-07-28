import { useMemo } from 'react';

const { layoutDocument } = require('../../document/layoutEngine');
const { resolveTemplateContract } = require('../../document/templateContract');
const { buildSampleValues, buildSampleInstance } = require('../../document/sampleData');

/**
 * Memoised entry point into the shared layout engine.
 *
 * Every browser consumer (builder canvas, preview, view page, print/export page)
 * goes through this hook, so they cannot drift apart, and the server PDF runs the
 * same engine over the same contract.
 */
const useTemplateContract = (template, organization) => useMemo(
  () => resolveTemplateContract(template, { organization }),
  [template, organization]
);

const useDocumentLayout = ({
  template,
  contract: providedContract,
  values,
  formInstance,
  language = 'en',
  mode = 'preview',
  organization,
  sampleData = false,
  resolveDepartment
}) => {
  const derivedContract = useTemplateContract(template, organization);
  const contract = providedContract || derivedContract;

  const effectiveValues = useMemo(() => {
    if (values) return values;
    if (!sampleData) return {};
    return buildSampleValues(contract, language);
  }, [values, sampleData, contract, language]);

  const effectiveInstance = useMemo(() => {
    if (formInstance) return formInstance;
    if (!sampleData) {
      return { _id: '', date: null, createdAt: null, filledBy: null, approvedBy: null, values: {} };
    }
    return buildSampleInstance(contract.template, language);
  }, [formInstance, sampleData, contract, language]);

  return useMemo(() => layoutDocument({
    contract,
    values: effectiveValues,
    formInstance: effectiveInstance,
    language,
    mode,
    resolveDepartment
  }), [contract, effectiveValues, effectiveInstance, language, mode, resolveDepartment]);
};

export { useTemplateContract };
export default useDocumentLayout;
