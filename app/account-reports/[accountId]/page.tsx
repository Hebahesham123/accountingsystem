import { notFound } from "next/navigation"
import AccountDetailReport from "@/components/account-detail-report"
import { AccountingService } from "@/lib/accounting-utils"

interface AccountReportPageProps {
  params: {
    accountId: string
  }
}

export default async function AccountReportPage({ params }: AccountReportPageProps) {
  try {
    // Verify the account exists
    const accounts = await AccountingService.getChartOfAccounts()
    const account = accounts.find(acc => acc.id === params.accountId)
    
    if (!account) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <AccountDetailReport 
          accountId={params.accountId}
          accountCode={account.code}
          accountName={account.name}
        />
      </div>
    )
  } catch (error) {
    console.error("Error loading account:", error)
    notFound()
  }
}
