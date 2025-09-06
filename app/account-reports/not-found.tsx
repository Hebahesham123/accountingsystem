import Link from "next/link"
import { Button } from "@/components/ui/button"
import { FileText, ArrowLeft } from "lucide-react"

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center space-y-6">
        <FileText className="h-24 w-24 mx-auto text-gray-400" />
        <h1 className="text-4xl font-bold">Account Report Not Found</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          The account report you're looking for doesn't exist or may have been removed.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/account-reports">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Account Reports
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/chart-of-accounts">
              View Chart of Accounts
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
