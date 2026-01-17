import React from 'react';
import StatusBadge from '@/components/shared/StatusBadge';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';
import TimeAgo from '@/components/shared/TimeAgo';

export default function PaymentTable({ payments = [] }) {
  return (
    <div className="vf-table-container">
      <table className="vf-table">
        <thead>
          <tr>
            <th>Mieter</th>
            <th>Betrag</th>
            <th>Fällig am</th>
            <th>Bezahlt am</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id}>
              <td className="font-medium">{payment.tenant_name}</td>
              <td>
                <CurrencyDisplay amount={payment.amount} />
              </td>
              <td>{new Date(payment.due_date).toLocaleDateString('de-DE')}</td>
              <td>
                {payment.paid_date ? (
                  <TimeAgo date={payment.paid_date} />
                ) : (
                  '-'
                )}
              </td>
              <td>
                <StatusBadge status={payment.status || 'pending'} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}