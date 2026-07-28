import React from 'react';
import { render, screen, within, waitFor, act, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TemplateBuilderPage from '../TemplateBuilderPage';
import { saveDraft, readDraft, draftKey } from '../state/draftStorage';

const fixtures = require('../../../document/__fixtures__/templates');
const { resolveTemplateContract } = require('../../../document/templateContract');

/* ---------------------------------------------------------------- mocks */

const mockNavigate = jest.fn();
let mockParams = {};

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  useSearchParams: () => [new URLSearchParams()]
}));

const mockApi = { get: jest.fn(), post: jest.fn(), put: jest.fn() };
jest.mock('../../../utils/api', () => ({
  __esModule: true,
  default: { get: (...a) => mockApi.get(...a), post: (...a) => mockApi.post(...a), put: (...a) => mockApi.put(...a) }
}));

const mockToast = { showError: jest.fn(), showSuccess: jest.fn(), showWarning: jest.fn() };
jest.mock('../../../utils/toast', () => ({
  showError: (...a) => mockToast.showError(...a),
  showSuccess: (...a) => mockToast.showSuccess(...a),
  showWarning: (...a) => mockToast.showWarning(...a)
}));

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    organization: {
      _id: 'org1',
      branding: { displayName: 'AraRM', primaryColor: '#01c853', secondaryColor: '#059669' },
      departments: [{ code: 'all', name: { en: 'All', ar: 'الكل' } }]
    }
  })
}));

jest.mock('../../../context/OrganizationContext', () => ({
  useOrganization: () => ({ setOrganizationContext: jest.fn() })
}));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: () => <div data-testid="qr" />,
  QRCodeCanvas: () => <div data-testid="qr" />
}));

let mockLanguage = 'en';
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key) => key, i18n: { language: mockLanguage, changeLanguage: () => {} } })
}));

/* ------------------------------------------------------------- helpers */

/**
 * The project pins `@testing-library/user-event` v13, which exposes standalone
 * functions rather than the v14 `setup()` session object. This shim gives the
 * tests the v14-shaped API without bumping a shared dependency just for tests.
 */
const createUser = () => ({
  click: async (element) => { await act(async () => { userEvent.click(element); }); },
  type: async (element, text) => { await act(async () => { userEvent.type(element, text); }); },
  clear: async (element) => { await act(async () => { userEvent.clear(element); }); },
  selectOptions: async (element, value) => {
    await act(async () => { userEvent.selectOptions(element, value); });
  },
  keyboard: async (keys) => {
    const target = document.activeElement || document.body;
    const key = keys.replace(/[{}]/g, '');
    await act(async () => { fireEvent.keyDown(target, { key }); fireEvent.keyUp(target, { key }); });
    if (key === 'Enter' && typeof target.click === 'function') {
      await act(async () => { target.click(); });
    }
  }
});

const renderBuilder = async () => {
  const utils = render(<TemplateBuilderPage />);
  await waitFor(() => expect(screen.queryByText('Start from a layout')).toBeInTheDocument()
    || expect(document.querySelector('.tb-shell')).toBeInTheDocument());
  return utils;
};

/** New template → choose the blank starter so we land in the builder shell. */
const startBlank = async (user) => {
  await renderBuilder();
  const blank = await screen.findByText('Blank document');
  await user.click(blank.closest('button'));
  await screen.findByLabelText('Document design canvas');
};

const blockBoxes = () => [...document.querySelectorAll('.tb-blockbox')];
const canvas = () => document.querySelector('.tb-canvas');
const pressOnCanvas = (key, mods = {}) => fireEvent.keyDown(canvas(), { key, ...mods });

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  mockParams = {};
  mockLanguage = 'en';
  mockApi.get.mockResolvedValue({ data: { data: fixtures.simpleForm() } });
  mockApi.post.mockResolvedValue({ data: { data: { _id: 'new1' } } });
  mockApi.put.mockResolvedValue({ data: { data: {} } });
});

/* --------------------------------------------------------------- tests */

describe('starting a new template', () => {
  it('offers the starter layouts first', async () => {
    await renderBuilder();
    expect(await screen.findByText('Start from a layout')).toBeInTheDocument();
    expect(screen.getByText('Blank document')).toBeInTheDocument();
    // The existing starter library is preserved, not dropped.
    expect(screen.getByText('Purchase Request')).toBeInTheDocument();
  });

  it('filters the starter library', async () => {
    const user = createUser();
    await renderBuilder();
    await user.type(screen.getByLabelText(/Search layouts/), 'incident');
    expect(screen.queryByText('Purchase Request')).not.toBeInTheDocument();
    expect(screen.getByText(/Incident Report/)).toBeInTheDocument();
  });

  it('opens the builder shell on the blank layout', async () => {
    const user = createUser();
    await startBlank(user);

    expect(screen.getByLabelText('Document design canvas')).toBeInTheDocument();
    expect(document.querySelectorAll('.doc-page')).toHaveLength(1);
    // Header, form details, one section, signatures, footer.
    expect(blockBoxes().length).toBe(5);
  });

  it('starts from a chosen starter layout', async () => {
    const user = createUser();
    await renderBuilder();
    await user.click((await screen.findByText('Purchase Request')).closest('button'));
    await screen.findByLabelText('Document design canvas');
    expect(blockBoxes().length).toBeGreaterThan(3);
  });
});

describe('the component palette', () => {
  it('adds a component to the document when activated', async () => {
    const user = createUser();
    await startBlank(user);
    const before = blockBoxes().length;

    await user.click(screen.getByRole('button', { name: /^Divider —/ }));

    expect(blockBoxes().length).toBe(before + 1);
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument();
  });

  it('is operable from the keyboard alone', async () => {
    const user = createUser();
    await startBlank(user);
    const before = blockBoxes().length;

    const item = screen.getByRole('button', { name: /^Spacer —/ });
    item.focus();
    await user.keyboard('{Enter}');

    expect(blockBoxes().length).toBe(before + 1);
  });

  it('disables a singleton that is already in the document', async () => {
    const user = createUser();
    await startBlank(user);
    expect(screen.getByRole('button', { name: /^Document header —/ })).toBeDisabled();
  });

  it('adds a table section complete with its columns', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Table section —/ }));

    await waitFor(() => expect(document.body.textContent).toContain('Quantity'));
    expect(document.body.textContent).toContain('Item');
    expect(document.body.textContent).toContain('Notes');
  });
});

describe('the structure panel', () => {
  it('lists every block and selects on click', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('tab', { name: 'Structure' }));

    const list = screen.getByRole('navigation', { name: 'Document structure' });
    expect(within(list).getByText('Header')).toBeInTheDocument();
    expect(within(list).getByText('Signatures')).toBeInTheDocument();

    await user.click(within(list).getByText('Signatures'));
    expect(document.querySelector('.tb-panel--end').textContent).toContain('Signature lines');
  });

  it('reorders with the move buttons', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Divider —/ }));
    await user.click(screen.getByRole('tab', { name: 'Structure' }));

    const list = screen.getByRole('navigation', { name: 'Document structure' });
    const before = [...list.querySelectorAll('.tb-layer__name')].map((n) => n.textContent);
    const dividerRow = within(list).getByText('Divider').closest('.tb-layer');
    await user.click(within(dividerRow).getByLabelText('Move up'));

    const after = [...list.querySelectorAll('.tb-layer__name')].map((n) => n.textContent);
    expect(after).not.toEqual(before);
    expect(after.indexOf('Divider')).toBeLessThan(before.indexOf('Divider'));
  });

  it('hides and locks a block', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('tab', { name: 'Structure' }));

    const list = screen.getByRole('navigation', { name: 'Document structure' });
    const row = within(list).getByText('Signatures').closest('.tb-layer');
    const before = blockBoxes().length;

    await user.click(within(row).getByLabelText('Hide'));
    expect(blockBoxes().length).toBe(before - 1);

    await user.click(within(row).getByLabelText('Show'));
    expect(blockBoxes().length).toBe(before);
  });
});

describe('the inspector', () => {
  it('changes the page size and the canvas follows', async () => {
    const user = createUser();
    await startBlank(user);

    expect(document.querySelector('.doc-page')).toHaveStyle({ width: '210mm' });
    await user.selectOptions(screen.getByLabelText('Paper size'), 'Letter');
    expect(document.querySelector('.doc-page')).toHaveStyle({ width: '215.9mm' });

    await user.selectOptions(screen.getByLabelText('Orientation'), 'landscape');
    expect(document.querySelector('.doc-page')).toHaveStyle({ width: '279.4mm' });
  });

  it('exposes all four margins and applies them', async () => {
    const user = createUser();
    await startBlank(user);

    ['top', 'right', 'bottom', 'left'].forEach((side) => {
      expect(screen.getByLabelText(side)).toBeInTheDocument();
    });

    const left = screen.getByLabelText('left');
    await user.clear(left);
    await user.type(left, '30');

    expect(screen.getByLabelText('left')).toHaveValue(30);
    // The printable-bounds guide moves with the margin.
    await waitFor(() => {
      expect(document.querySelector('.doc-page__margins')).toHaveStyle({ left: '30.0000mm' });
    });
  });

  it('edits the template title', async () => {
    const user = createUser();
    await startBlank(user);
    const input = screen.getByLabelText('Title (English)');
    await user.type(input, 'Handover');
    expect(input).toHaveValue('Handover');
  });

  it('shows contextual controls for the selected block', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('tab', { name: 'Structure' }));
    const list = screen.getByRole('navigation', { name: 'Document structure' });

    const inspector = () => within(document.querySelector('.tb-panel--end'));

    await user.click(within(list).getByText('Form details'));
    expect(inspector().getByText('Details shown')).toBeInTheDocument();
    expect(inspector().getByRole('checkbox', { name: /Form ID/ })).toBeInTheDocument();

    await user.click(within(list).getByText('Footer'));
    expect(inspector().getByText('Footer content')).toBeInTheDocument();
    expect(inspector().getByText('QR code')).toBeInTheDocument();
  });

  it('deep-merges style changes instead of resetting siblings', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('tab', { name: 'Structure' }));
    const list = screen.getByRole('navigation', { name: 'Document structure' });
    await user.click(within(list).getByText('Header'));

    await user.click(screen.getByRole('checkbox', { name: /Subtitle/ }));
    // The other header switches must still be on.
    expect(screen.getByRole('checkbox', { name: /Company name/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Logo/ })).toBeChecked();
  });
});

describe('keyboard editing on the canvas', () => {
  const selectFirstSection = async (user) => {
    await user.click(screen.getByRole('tab', { name: 'Structure' }));
    const list = screen.getByRole('navigation', { name: 'Document structure' });
    await user.click(within(list).getAllByText('Details')[0]);
  };

  it('moves, resizes and reorders without a pointer', async () => {
    const user = createUser();
    await startBlank(user);
    await selectFirstSection(user);

    const numbers = () => [...document.querySelectorAll('.tb-panel--end input[type=number]')]
      .slice(0, 3).map((input) => input.value).join('/');

    const start = numbers();
    act(() => pressOnCanvas('ArrowLeft', { altKey: true }));
    expect(numbers()).not.toEqual(start);

    const narrowed = numbers();
    act(() => pressOnCanvas('ArrowRight'));
    expect(numbers()).not.toEqual(narrowed);

    const moved = numbers();
    act(() => pressOnCanvas('ArrowDown'));
    expect(numbers()).not.toEqual(moved);
  });

  it('announces the result for screen readers', async () => {
    const user = createUser();
    await startBlank(user);
    await selectFirstSection(user);

    act(() => pressOnCanvas('ArrowLeft', { altKey: true }));
    expect(document.querySelector('.tb-visually-hidden').textContent).toMatch(/Width \d+ of 24/);
  });

  it('duplicates, copies, pastes and deletes', async () => {
    const user = createUser();
    await startBlank(user);
    await selectFirstSection(user);

    const before = blockBoxes().length;
    act(() => pressOnCanvas('d', { ctrlKey: true }));
    expect(blockBoxes().length).toBe(before + 1);

    act(() => pressOnCanvas('c', { ctrlKey: true }));
    act(() => pressOnCanvas('v', { ctrlKey: true }));
    expect(blockBoxes().length).toBe(before + 2);

    act(() => pressOnCanvas('Delete'));
    expect(blockBoxes().length).toBe(before + 1);
  });

  it('undoes and redoes from the keyboard', async () => {
    const user = createUser();
    await startBlank(user);
    const before = blockBoxes().length;

    await user.click(screen.getByRole('button', { name: /^Divider —/ }));
    expect(blockBoxes().length).toBe(before + 1);

    act(() => pressOnCanvas('z', { ctrlKey: true }));
    expect(blockBoxes().length).toBe(before);

    act(() => pressOnCanvas('z', { ctrlKey: true, shiftKey: true }));
    expect(blockBoxes().length).toBe(before + 1);
  });

  it('leaves a locked block alone', async () => {
    const user = createUser();
    await startBlank(user);
    await selectFirstSection(user);
    await user.click(screen.getByRole('checkbox', { name: /Locked/ }));

    const numbers = () => [...document.querySelectorAll('.tb-panel--end input[type=number]')]
      .slice(0, 3).map((input) => input.value).join('/');
    const before = numbers();
    act(() => pressOnCanvas('ArrowLeft', { altKey: true }));
    expect(numbers()).toEqual(before);
  });
});

describe('pointer dragging on the canvas', () => {
  /**
   * jsdom performs no layout, so the canvas's pointer→millimetre conversion needs
   * real rectangles. Stub them from the engine's own geometry, which is what the
   * browser would report.
   */
  const stubRects = () => {
    const pages = [...document.querySelectorAll('.doc-page')];
    pages.forEach((page, index) => {
      // A4 at 96dpi ≈ 794 × 1123 CSS px.
      page.getBoundingClientRect = () => ({
        left: 0, top: index * 1123, right: 794, bottom: (index + 1) * 1123,
        width: 794, height: 1123, x: 0, y: index * 1123
      });
    });

    [...document.querySelectorAll('.tb-blockbox')].forEach((box) => {
      const left = parseFloat(box.style.left) * 3.7795;
      const top = parseFloat(box.style.top) * 3.7795;
      const width = parseFloat(box.style.width) * 3.7795;
      const height = parseFloat(box.style.height) * 3.7795;
      box.getBoundingClientRect = () => ({
        left, top, right: left + width, bottom: top + height, width, height, x: left, y: top
      });
    });
  };

  const pointer = (type, element, clientX, clientY, extra = {}) => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.assign(event, {
      clientX, clientY, pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1, ...extra
    });
    (element || window).dispatchEvent(event);
  };

  const blockOrder = () => [...document.querySelectorAll('.tb-blockbox')]
    .map((box) => ({ label: box.getAttribute('aria-label'), top: parseFloat(box.style.top) }))
    .sort((a, b) => a.top - b.top)
    .map((box) => box.label);

  it('a drag survives the re-render its own selection causes', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Table section —/ }));
    await waitFor(() => expect(blockBoxes().length).toBe(6));

    stubRects();
    const before = blockOrder();

    const boxes = [...document.querySelectorAll('.tb-blockbox')]
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const table = boxes[boxes.length - 2];
    const signatures = boxes[boxes.length - 3];
    const from = table.getBoundingClientRect();
    const to = signatures.getBoundingClientRect();

    await act(async () => {
      // pointerdown selects the block, which re-renders the canvas. A cleanup
      // effect with an unstable dependency used to cancel the gesture right here.
      pointer('pointerdown', table, from.left + 20, from.top + 6);
    });
    for (let step = 1; step <= 5; step += 1) {
      const y = from.top + 6 + ((to.top + 4 - (from.top + 6)) * step) / 5;
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        pointer('pointermove', window, from.left + 20, y);
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    }
    await act(async () => {
      pointer('pointerup', window, from.left + 20, to.top + 4, { buttons: 0 });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    const after = blockOrder();
    expect(after).not.toEqual(before);
  });

  it('records the whole drag as exactly one undo step', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Table section —/ }));
    await waitFor(() => expect(blockBoxes().length).toBe(6));

    stubRects();
    const before = blockOrder();

    const boxes = [...document.querySelectorAll('.tb-blockbox')]
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
    const table = boxes[boxes.length - 2];
    const signatures = boxes[boxes.length - 3];
    const from = table.getBoundingClientRect();
    const to = signatures.getBoundingClientRect();

    await act(async () => { pointer('pointerdown', table, from.left + 20, from.top + 6); });
    for (let step = 1; step <= 8; step += 1) {
      const y = from.top + 6 + ((to.top + 4 - (from.top + 6)) * step) / 8;
      // eslint-disable-next-line no-await-in-loop
      await act(async () => {
        pointer('pointermove', window, from.left + 20, y);
        await new Promise((resolve) => setTimeout(resolve, 20));
      });
    }
    await act(async () => {
      pointer('pointerup', window, from.left + 20, to.top + 4, { buttons: 0 });
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(blockOrder()).not.toEqual(before);

    // One Ctrl+Z, not eight.
    act(() => pressOnCanvas('z', { ctrlKey: true }));
    expect(blockOrder()).toEqual(before);
  });

  it('a right-click never starts a drag', async () => {
    const user = createUser();
    await startBlank(user);
    stubRects();
    const before = blockOrder();

    const box = [...document.querySelectorAll('.tb-blockbox')][2];
    const rect = box.getBoundingClientRect();

    await act(async () => {
      pointer('pointerdown', box, rect.left + 10, rect.top + 6, { button: 2, buttons: 2 });
      pointer('pointermove', window, rect.left + 10, rect.top - 200);
      await new Promise((resolve) => setTimeout(resolve, 40));
      pointer('pointerup', window, rect.left + 10, rect.top - 200, { button: 2, buttons: 0 });
    });

    expect(blockOrder()).toEqual(before);
  });

  it('page furniture is selectable but not draggable', async () => {
    const user = createUser();
    await startBlank(user);
    stubRects();
    const before = blockOrder();

    const footer = [...document.querySelectorAll('.tb-blockbox')]
      .find((box) => box.getAttribute('aria-label') === 'Footer');
    const rect = footer.getBoundingClientRect();

    await act(async () => {
      pointer('pointerdown', footer, rect.left + 10, rect.top + 4);
      pointer('pointermove', window, rect.left + 10, rect.top - 400);
      await new Promise((resolve) => setTimeout(resolve, 40));
      pointer('pointerup', window, rect.left + 10, rect.top - 400, { buttons: 0 });
    });

    expect(blockOrder()).toEqual(before);
    // …but the click still selected it.
    expect(document.querySelector('.tb-panel--end').textContent).toContain('Footer content');
  });
});

describe('saving', () => {
  it('blocks the save and points at the problem when the title is missing', async () => {
    const user = createUser();
    await startBlank(user);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockApi.post).not.toHaveBeenCalled();
    expect(mockToast.showWarning).toHaveBeenCalledWith('Give the template a title');
  });

  it('posts the full document and reports success', async () => {
    const user = createUser();
    await startBlank(user);
    await user.type(screen.getByLabelText('Title (English)'), 'Handover');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockApi.post).toHaveBeenCalledTimes(1));
    const [url, payload] = mockApi.post.mock.calls[0];
    expect(url).toBe('/form-templates');
    expect(payload.layoutVersion).toBe(2);
    expect(payload.document.version).toBe(2);
    expect(payload.document.blocks.length).toBeGreaterThan(0);
    expect(payload.title).toEqual({ en: 'Handover', ar: 'Handover' });
    expect(payload._id).toBeUndefined();

    await screen.findByText(/^Saved/);
    expect(mockNavigate).toHaveBeenCalledWith('/templates/edit/new1', { replace: true });
  });

  it('surfaces a failed save and keeps the work', async () => {
    const user = createUser();
    mockApi.post.mockRejectedValue({ response: { data: { message: 'Server exploded' } } });
    await startBlank(user);
    await user.type(screen.getByLabelText('Title (English)'), 'Handover');

    const blocksBefore = blockBoxes().length;
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText('Server exploded');
    expect(blockBoxes().length).toBe(blocksBefore);
    expect(mockToast.showError).toHaveBeenCalledWith('Server exploded');
  });

  it('retries successfully after a failure', async () => {
    const user = createUser();
    mockApi.post.mockRejectedValueOnce({ response: { data: { message: 'Network down' } } });
    await startBlank(user);
    await user.type(screen.getByLabelText('Title (English)'), 'Handover');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText('Network down');

    await user.click(screen.getByRole('button', { name: 'Save' }));
    await screen.findByText(/^Saved/);
    expect(mockApi.post).toHaveBeenCalledTimes(2);
  });

  it('updates an existing template with PUT', async () => {
    const user = createUser();
    mockParams = { id: 'tpl9' };
    mockApi.get.mockResolvedValue({ data: { data: fixtures.tableForm() } });

    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');

    await user.click(screen.getByRole('button', { name: /^Divider —/ }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockApi.put).toHaveBeenCalledTimes(1));
    expect(mockApi.put.mock.calls[0][0]).toBe('/form-templates/tpl9');
    expect(mockApi.put.mock.calls[0][1].sections[0].id).toBe('section_items');
  });
});

describe('unsaved-change protection and draft recovery', () => {
  it('warns before leaving with unsaved work', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Divider —/ }));

    await user.click(screen.getByRole('button', { name: 'Back to templates' }));
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(await screen.findByText('Leave without saving?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Leave' }));
    expect(mockNavigate).toHaveBeenCalledWith('/templates');
  });

  it('leaves immediately when there is nothing to lose', async () => {
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: 'Back to templates' }));
    expect(mockNavigate).toHaveBeenCalledWith('/templates');
  });

  it('writes a draft while editing', async () => {
    jest.useFakeTimers({ advanceTimers: true });
    const user = createUser();
    await startBlank(user);
    await user.click(screen.getByRole('button', { name: /^Divider —/ }));

    await act(async () => { jest.advanceTimersByTime(1500); });

    const draft = readDraft('org1', null);
    expect(draft).not.toBeNull();
    expect(draft.template.document.blocks.some((block) => block.type === 'divider')).toBe(true);
    jest.useRealTimers();
  });

  it('offers to recover a draft and restores it', async () => {
    const stored = resolveTemplateContract(fixtures.tableForm()).template;
    saveDraft('org1', null, stored);

    const user = createUser();
    render(<TemplateBuilderPage />);

    expect(await screen.findByText('Recover unsaved work?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore draft' }));

    await screen.findByLabelText('Document design canvas');
    // The recovered document is the drafted table template, not the blank one.
    await waitFor(() => expect(document.body.textContent).toContain('Items'));
    expect(document.body.textContent).toContain('Qty');
  });

  it('dismissing the recovery prompt keeps the draft rather than destroying it', async () => {
    saveDraft('org1', null, resolveTemplateContract(fixtures.tableForm()).template);
    const user = createUser();
    render(<TemplateBuilderPage />);

    await screen.findByText('Recover unsaved work?');
    await user.click(screen.getByRole('button', { name: 'Keep the saved version' }));

    // An accidental dismissal (including a backdrop click, which fires the same
    // handler) must not throw the work away.
    expect(window.localStorage.getItem(draftKey('org1', null))).not.toBeNull();
    expect(screen.queryByText('Recover unsaved work?')).not.toBeInTheDocument();
  });

  it('warns when the draft is older than the stored template', async () => {
    const stored = resolveTemplateContract(fixtures.tableForm()).template;
    saveDraft('org1', 'tpl1', stored);
    mockParams = { id: 'tpl1' };
    mockApi.get.mockResolvedValue({
      data: { data: { ...fixtures.simpleForm(), updatedAt: new Date(Date.now() + 60000).toISOString() } }
    });

    render(<TemplateBuilderPage />);
    expect(await screen.findByText(/saved by someone since then/)).toBeInTheDocument();
  });

  it('clears the draft once the template is saved', async () => {
    const user = createUser();
    await startBlank(user);
    await user.type(screen.getByLabelText('Title (English)'), 'Handover');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await screen.findByText(/^Saved/);
    expect(window.localStorage.getItem(draftKey('org1', null))).toBeNull();
  });
});

describe('preview, language and overflow', () => {
  it('switches between edit and preview', async () => {
    const user = createUser();
    await startBlank(user);
    expect(blockBoxes().length).toBeGreaterThan(0);

    await user.click(screen.getByRole('button', { name: 'Preview' }));
    expect(blockBoxes()).toHaveLength(0);
    expect(document.querySelectorAll('.doc-page').length).toBe(1);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    expect(blockBoxes().length).toBeGreaterThan(0);
  });

  it('toggles between sample values and an empty form', async () => {
    const user = createUser();
    mockParams = { id: 'tpl1' };
    mockApi.get.mockResolvedValue({ data: { data: fixtures.simpleForm() } });
    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');

    expect(document.body.textContent).toContain('Alex Morgan');
    await user.click(screen.getByRole('button', { name: 'Sample data' }));
    await waitFor(() => expect(document.body.textContent).not.toContain('Alex Morgan'));
  });

  it('switches the document language without touching the interface language', async () => {
    const user = createUser();
    mockParams = { id: 'tpl1' };
    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');

    await user.click(screen.getByLabelText('Switch document language'));
    await waitFor(() => {
      expect(document.querySelectorAll('.doc-text[dir="rtl"]').length).toBeGreaterThan(0);
    });
    // Interface chrome stays in the UI language.
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('reports overflow in the status bar and the inspector', async () => {
    const user = createUser();
    mockParams = { id: 'tpl1' };
    mockApi.get.mockResolvedValue({ data: { data: fixtures.simpleForm() } });
    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');

    await user.click(screen.getByRole('button', { name: /^Spacer —/ }));
    const spacerHeight = screen.getByLabelText('Height (mm)');
    await user.clear(spacerHeight);
    await user.type(spacerHeight, '400');
    await user.click(screen.getByRole('checkbox', { name: /Keep on one page/ }));

    await waitFor(() => {
      expect(document.querySelector('.tb-statusbar').textContent).toMatch(/taller than one page/i);
    });
  });

  it('paginates as content grows', async () => {
    mockParams = { id: 'tpl1' };
    mockApi.get.mockResolvedValue({ data: { data: fixtures.multiPageForm() } });
    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');
    await waitFor(() => {
      expect(document.querySelectorAll('.doc-page').length).toBeGreaterThan(1);
    });
  });
});

describe('unsupported document versions', () => {
  it('refuses to open a template from a newer builder', async () => {
    mockParams = { id: 'tpl1' };
    const template = fixtures.simpleForm();
    template.document = { version: 99, page: {}, grid: {}, blocks: [] };
    mockApi.get.mockResolvedValue({ data: { data: template } });

    render(<TemplateBuilderPage />);
    expect(await screen.findByText(/Unsupported document layout version 99/)).toBeInTheDocument();
    expect(screen.queryByLabelText('Document design canvas')).not.toBeInTheDocument();
  });
});

describe('mobile structure mode', () => {
  const setWidth = (width) => {
    Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  };

  afterEach(() => setWidth(1440));

  it('replaces the paper canvas with structure editing on a phone', async () => {
    setWidth(400);
    mockParams = { id: 'tpl1' };
    render(<TemplateBuilderPage />);

    await screen.findByRole('tab', { name: 'Structure' });
    expect(screen.queryByLabelText('Document design canvas')).not.toBeInTheDocument();
    expect(screen.getByText(/Precise on-page dragging and resizing needs a larger screen/))
      .toBeInTheDocument();
    ['Structure', 'Add', 'Properties', 'Preview'].forEach((tab) => {
      expect(screen.getByRole('tab', { name: tab })).toBeInTheDocument();
    });
  });

  it('can still add and reorder components on a phone', async () => {
    setWidth(400);
    const user = createUser();
    mockParams = { id: 'tpl1' };
    render(<TemplateBuilderPage />);
    await screen.findByRole('tab', { name: 'Structure' });

    await user.click(screen.getByRole('tab', { name: 'Add' }));
    await user.click(screen.getByRole('button', { name: /^Divider —/ }));

    const list = await screen.findByRole('navigation', { name: 'Document structure' });
    expect(within(list).getByText('Divider')).toBeInTheDocument();
  });

  it('still previews the real document on a phone', async () => {
    setWidth(400);
    const user = createUser();
    mockParams = { id: 'tpl1' };
    render(<TemplateBuilderPage />);
    await screen.findByRole('tab', { name: 'Structure' });

    await user.click(screen.getByRole('tab', { name: 'Preview' }));
    expect(document.querySelector('.doc-page')).toHaveStyle({ width: '210mm' });
  });
});

describe('performance', () => {
  it('opens a 160-field template and stays interactive', async () => {
    mockParams = { id: 'big' };
    mockApi.get.mockResolvedValue({ data: { data: fixtures.largeForm(40, 4) } });

    const started = Date.now();
    render(<TemplateBuilderPage />);
    await screen.findByLabelText('Document design canvas');
    const elapsed = Date.now() - started;

    expect(elapsed).toBeLessThan(20000);
    expect(document.querySelectorAll('.doc-page').length).toBeGreaterThan(1);
    expect(blockBoxes().length).toBeGreaterThan(40);
  }, 30000);
});
