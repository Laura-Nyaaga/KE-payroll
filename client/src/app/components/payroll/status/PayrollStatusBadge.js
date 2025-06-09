export default function PayrollStatusBadge({ status }) {
    const statusMap = {
      draft: { label: 'Draft', color: 'bg-blue-100 text-blue-800' },
      pending: { label: 'Verified', color: 'bg-yellow-100 text-yellow-800' },
      processed: { label: 'Processed', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'REjected', color: 'bg-red-100 text-red-800' },
      expired: { label: 'Expired', color: 'bg-gray-200 text-gray-700' },
    };
  
    const badge = statusMap[status] || { label: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  
    return (
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded ${badge.color}`}>
        {badge.label}
      </span>
    );
  }