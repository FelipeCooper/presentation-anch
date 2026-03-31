interface EmptyStateProps {
  onAddHolding: () => void;
}

export function EmptyState({ onAddHolding }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <svg
        className="mx-auto h-12 w-12 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <h3 className="mt-4 text-lg font-semibold text-gray-900">
        No holdings yet
      </h3>
      <p className="mt-2 text-sm text-gray-500">
        Get started by adding your first cryptocurrency holding.
      </p>
      <div className="mt-6">
        <button
          type="button"
          onClick={onAddHolding}
          className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          + Add Holding
        </button>
      </div>
    </div>
  );
}
