import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import JournalEntryForm from "@/components/journal-entry-form"
import JournalEntriesList from "@/components/journal-entries-list"

export default function JournalEntriesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Entry</TabsTrigger>
          <TabsTrigger value="list">View Entries</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Create Journal Entry</h1>
            <p className="text-muted-foreground">Create new journal entries with multiple lines</p>
          </div>
          <JournalEntryForm />
        </TabsContent>

        <TabsContent value="list" className="mt-6">
          <JournalEntriesList />
        </TabsContent>
      </Tabs>
    </div>
  )
}
