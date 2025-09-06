import TrialBalance from "@/components/trial-balance"

export default function TrialBalancePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Trial Balance</h1>
        <p className="text-muted-foreground">View trial balance and verify that debits equal credits</p>
      </div>
      <TrialBalance />
    </div>
  )
}
