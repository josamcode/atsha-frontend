/**
 * Route entry point for `/templates/create` and `/templates/edit/:id`.
 *
 * The builder itself now lives in `src/features/template-builder`. This module
 * stays as the routed component so `App.js`, the links in `TemplatesList` and any
 * bookmarked URL keep working unchanged.
 */
export { default } from '../../features/template-builder/TemplateBuilderPage';
