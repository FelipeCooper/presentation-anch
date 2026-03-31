import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from './EmptyState';

describe('EmptyState', () => {
  it('renders the empty state message', () => {
    render(<EmptyState onAddHolding={vi.fn()} />);

    expect(screen.getByText('No holdings yet')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Get started by adding your first cryptocurrency holding.',
      ),
    ).toBeInTheDocument();
  });

  it('calls onAddHolding when button is clicked', async () => {
    const user = userEvent.setup();
    const onAddHolding = vi.fn();
    render(<EmptyState onAddHolding={onAddHolding} />);

    await user.click(screen.getByRole('button', { name: /add holding/i }));

    expect(onAddHolding).toHaveBeenCalledOnce();
  });
});
