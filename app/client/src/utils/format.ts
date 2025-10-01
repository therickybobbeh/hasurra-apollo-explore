/**
 * Utility functions for formatting data
 */

export function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(cents / 100);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'PAID':
      return 'green';
    case 'DENIED':
      return 'red';
    case 'PENDING':
      return 'orange';
    default:
      return 'gray';
  }
}

export function getStatusBadgeClass(status: string): string {
  const baseClasses = 'px-2 py-1 text-xs font-semibold rounded-full';
  switch (status) {
    case 'PAID':
      return `${baseClasses} bg-green-100 text-green-800`;
    case 'DENIED':
      return `${baseClasses} bg-red-100 text-red-800`;
    case 'PENDING':
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
}
