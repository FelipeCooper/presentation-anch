import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SummaryCardsSkeleton, HoldingsTableSkeleton, AllocationChartSkeleton, DashboardSkeleton } from './LoadingSkeleton';

describe('SummaryCardsSkeleton', () => {
  it('renders a loading status region', () => {
    render(<SummaryCardsSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('HoldingsTableSkeleton', () => {
  it('renders table headers', () => {
    render(<HoldingsTableSkeleton />);
    expect(screen.getByText('Asset')).toBeInTheDocument();
    expect(screen.getByText('P&L')).toBeInTheDocument();
  });

  it('has a loading status role', () => {
    render(<HoldingsTableSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('AllocationChartSkeleton', () => {
  it('renders with loading status', () => {
    render(<AllocationChartSkeleton />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

describe('DashboardSkeleton', () => {
  it('renders all skeleton sections', () => {
    render(<DashboardSkeleton />);
    const statuses = screen.getAllByRole('status');
    expect(statuses.length).toBeGreaterThanOrEqual(3);
  });
});
