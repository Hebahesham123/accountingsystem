import { notFound } from 'next/navigation'
import { AccountingService } from '@/lib/accounting-utils'
import JournalEntryEditForm from '@/components/journal-entry-edit-form'

interface EditPageProps {
  params: {
    id: string
  }
}

export default async function EditJournalEntryPage({ params }: EditPageProps) {
  try {
    // Fetch the journal entry data
    const entry = await AccountingService.getJournalEntryById(params.id)
    
    if (!entry) {
      notFound()
    }

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Edit Journal Entry</h1>
          <p className="text-muted-foreground">
            Edit journal entry: {entry.entry_number}
          </p>
        </div>
        <JournalEntryEditForm entry={entry} />
      </div>
    )
  } catch (error) {
    console.error('Error loading journal entry:', error)
    notFound()
  }
}
