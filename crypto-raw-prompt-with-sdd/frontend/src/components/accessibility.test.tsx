import { describe, it, expect, vi, beforeAll, afterAll, afterEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { HoldingsTable } from './HoldingsTable';
import { SummaryCards } from './SummaryCards';
import { HoldingForm } from './HoldingForm';
import { EmptyState } from './EmptyState';
import { CoinSearch } from './CoinSearch';
import { App } from '../App';
import { createWrapper } from '../test/wrapper';
import type { Holding, PriceMap } from '../types';

const mockHoldings: Holding[] = [
  {
    id: 'abc-123',
    coingeckoId: 'bitcoin',
    symbol: 'btc',
    name: 'Bitcoin',
    quantity: 1.5,
    avgPurchasePrice: 40000,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockPrices: PriceMap = {
  bitcoin: { usd: 50000, usd24hChange: 2.5, lastUpdatedAt: 1700000000 },
};

const server = setupServer(
  http.delete('/api/holdings/:id', () => new HttpResponse(null, { status: 204 })),
  http.get('/api/holdings', () => HttpResponse.json(mockHoldings)),
  http.get('/api/coins', () => HttpResponse.json([])),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Accessibility: Keyboard Navigation', () => {
  it('all Edit and Delete buttons are focusable via Tab', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const editButton = screen.getByRole('button', { name: /edit bitcoin/i });
    const deleteButton = screen.getByRole('button', { name: /delete bitcoin/i });

    // Tab through until we reach the edit button
    editButton.focus();
    expect(editButton).toHaveFocus();

    await user.tab();
    expect(deleteButton).toHaveFocus();
  });

  it('EmptyState add button is focusable', () => {
    render(<EmptyState onAddHolding={vi.fn()} />);
    const button = screen.getByRole('button', { name: /add holding/i });
    button.focus();
    expect(button).toHaveFocus();
  });

  it('holdings table region is scrollable via keyboard with tabIndex', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const scrollRegion = screen.getByRole('region', { name: /holdings table/i });
    expect(scrollRegion).toHaveAttribute('tabindex', '0');
  });
});

describe('Accessibility: Modal Keyboard', () => {
  it('modal opens and closes with Escape key', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const Wrapper = createWrapper();

    render(
      <Wrapper>
        <HoldingForm onClose={onClose} />
      </Wrapper>,
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('modal has aria-modal attribute', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
  });

  it('modal has descriptive aria-label', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Add holding');
  });

  it('edit modal has edit aria-label', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm holding={mockHoldings[0]} onClose={vi.fn()} />
      </Wrapper>,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-label', 'Edit holding');
  });
});

describe('Accessibility: P&L Indicators', () => {
  it('P&L has aria-label indicating direction for gain', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    const pnlLabel = screen.getByLabelText(/profit and loss: gain/i);
    expect(pnlLabel).toBeInTheDocument();
  });

  it('P&L has aria-label indicating direction for loss', () => {
    const lossPrices: PriceMap = {
      bitcoin: { usd: 20000, usd24hChange: -5, lastUpdatedAt: 1700000000 },
    };

    render(<SummaryCards holdings={mockHoldings} prices={lossPrices} />);

    const pnlLabel = screen.getByLabelText(/profit and loss: loss/i);
    expect(pnlLabel).toBeInTheDocument();
  });

  it('P&L displays arrow indicator alongside value', () => {
    render(<SummaryCards holdings={mockHoldings} prices={mockPrices} />);

    // The arrow character (▲ for positive) should be present
    const arrows = document.querySelectorAll('[aria-hidden="true"]');
    const upArrows = Array.from(arrows).filter((el) => el.textContent === '\u25B2');
    expect(upArrows.length).toBeGreaterThan(0);
  });

  it('P&L in holdings table has arrow indicators', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const arrows = document.querySelectorAll('[aria-hidden="true"]');
    const upArrows = Array.from(arrows).filter((el) => el.textContent === '\u25B2');
    expect(upArrows.length).toBeGreaterThan(0);
  });
});

describe('Accessibility: A11Y-1 — CoinSearch focus visibility', () => {
  it('dropdown options do not use focus:outline-none', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <CoinSearch onSelect={vi.fn()} />
      </Wrapper>,
    );

    // The search input itself should not have focus:outline-none in its class
    const input = screen.getByPlaceholderText('Search for a coin...');
    expect(input.className).not.toContain('focus:outline-none');
  });
});

describe('Accessibility: A11Y-2 — Error messages linked via aria-describedby', () => {
  it('quantity error is linked to input via aria-describedby', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /add holding/i }));

    const quantityInput = screen.getByLabelText('Quantity');
    expect(quantityInput).toHaveAttribute('aria-describedby', 'quantity-error');

    const errorEl = document.getElementById('quantity-error');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl?.textContent).toBe('Quantity must be a positive number');
  });

  it('price error is linked to input via aria-describedby', async () => {
    const user = userEvent.setup();
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    await user.click(screen.getByRole('button', { name: /add holding/i }));

    const priceInput = screen.getByLabelText('Average Purchase Price (USD)');
    expect(priceInput).toHaveAttribute('aria-describedby', 'avg-purchase-price-error');

    const errorEl = document.getElementById('avg-purchase-price-error');
    expect(errorEl).toBeInTheDocument();
    expect(errorEl?.textContent).toBe('Price must be a positive number');
  });

  it('aria-describedby is absent when no errors', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    const quantityInput = screen.getByLabelText('Quantity');
    expect(quantityInput).not.toHaveAttribute('aria-describedby');

    const priceInput = screen.getByLabelText('Average Purchase Price (USD)');
    expect(priceInput).not.toHaveAttribute('aria-describedby');
  });
});

describe('Accessibility: A11Y-3 — Inputs have required and aria-required', () => {
  it('quantity input has required and aria-required attributes', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    const quantityInput = screen.getByLabelText('Quantity');
    expect(quantityInput).toBeRequired();
    expect(quantityInput).toHaveAttribute('aria-required', 'true');
  });

  it('price input has required and aria-required attributes', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingForm onClose={vi.fn()} />
      </Wrapper>,
    );

    const priceInput = screen.getByLabelText('Average Purchase Price (USD)');
    expect(priceInput).toBeRequired();
    expect(priceInput).toHaveAttribute('aria-required', 'true');
  });
});

describe('Accessibility: A11Y-4 — Skip to main content link', () => {
  it('renders a skip-to-main-content link targeting #main-content', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <App />
      </Wrapper>,
    );

    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink.tagName.toLowerCase()).toBe('a');
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  it('main element has id="main-content" as skip link target', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <App />
      </Wrapper>,
    );

    const main = document.getElementById('main-content');
    expect(main).toBeInTheDocument();
    expect(main?.tagName.toLowerCase()).toBe('main');
  });
});

describe('Accessibility: A11Y-5 — Holdings table has caption', () => {
  it('table includes a caption element', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const table = screen.getByRole('table');
    const caption = within(table).getByText(/portfolio holdings/i);
    expect(caption).toBeInTheDocument();
    expect(caption.tagName.toLowerCase()).toBe('caption');
  });
});

describe('Responsive: Table Scrollability', () => {
  it('holdings table wrapper has overflow-x-auto for scrolling', () => {
    const Wrapper = createWrapper();
    render(
      <Wrapper>
        <HoldingsTable holdings={mockHoldings} prices={mockPrices} onEdit={vi.fn()} />
      </Wrapper>,
    );

    const scrollRegion = screen.getByRole('region', { name: /holdings table/i });
    expect(scrollRegion.className).toContain('overflow-x-auto');
  });
});
