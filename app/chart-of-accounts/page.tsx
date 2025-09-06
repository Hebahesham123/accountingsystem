import ChartOfAccounts from "@/components/chart-of-accounts"

export default function ChartOfAccountsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Chart of Accounts</h1>
        <p className="text-muted-foreground">Manage your company's hierarchical chart of accounts structure</p>
      </div>
      <ChartOfAccounts />
    </div>
  )
}
