import type { PaymentMethodKey, RecentTransaction, TransactionStatus } from "@/lib/data/types";
import { Badge } from "@/components/ui/badge";
import { formatMoney, formatRelativeTime } from "@/lib/format";

const METHOD_LABELS: Record<PaymentMethodKey, string> = {
  cash: "Cash",
  card: "Card",
  qr_wallet: "QR Wallet",
  house_credit: "House Credit",
};

const STATUS_VARIANT: Record<TransactionStatus, "success" | "warning" | "destructive"> = {
  completed: "success",
  refunded: "warning",
  voided: "destructive",
};

const STATUS_LABEL: Record<TransactionStatus, string> = {
  completed: "Paid",
  refunded: "Refunded",
  voided: "Voided",
};

export function RecentTransactions({ data }: { data: RecentTransaction[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <th className="pb-2 font-semibold">Order</th>
            <th className="pb-2 font-semibold">Customer</th>
            <th className="hidden pb-2 font-semibold sm:table-cell">Method</th>
            <th className="pb-2 text-right font-semibold">Amount</th>
            <th className="pb-2 text-right font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {data.map((transaction) => (
            <tr key={transaction.id} className="border-b border-border/60 last:border-0">
              <td className="py-2.5">
                <span className="font-mono text-foreground">{transaction.orderNumber}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatRelativeTime(transaction.at)}
                </span>
              </td>
              <td className="py-2.5 text-foreground">{transaction.customer}</td>
              <td className="hidden py-2.5 text-muted-foreground sm:table-cell">
                {METHOD_LABELS[transaction.method]}
              </td>
              <td className="py-2.5 text-right font-medium tabular-nums text-foreground">
                {formatMoney(transaction.amount)}
              </td>
              <td className="py-2.5 text-right">
                <Badge variant={STATUS_VARIANT[transaction.status]}>
                  {STATUS_LABEL[transaction.status]}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
