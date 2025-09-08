'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Edit, 
  Printer, 
  Download, 
  Image, 
  Eye, 
  X, 
  AlertCircle, 
  Plus, 
  Calendar,
  DollarSign,
  FileText,
  Users,
  Building,
  CreditCard,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  Info,
  RotateCcw
} from 'lucide-react';
import Link from 'next/link';
import { AccountingService } from '@/lib/accounting-utils';
import { supabase, type JournalEntry } from '@/lib/supabase';

interface JournalEntryReviewProps {
  entry: JournalEntry;
  onClose: () => void;
}

interface AccountDetails {
  id: string;
  code: string;
  name: string;
  account_type: string;
  description?: string;
  is_active: boolean;
  level: number;
  parent_account_id?: string;
  account_types?: {
    id: string;
    name: string;
    normal_balance: string;
    description?: string;
  };
}

interface UserDetails {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface PeriodDetails {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_locked: boolean;
}

export default function JournalEntryReview({ entry, onClose }: JournalEntryReviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<AccountDetails[]>([]);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [periodDetails, setPeriodDetails] = useState<PeriodDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEntityDetails();
  }, [entry]);

  const loadEntityDetails = async () => {
    try {
      setLoading(true);
      
      // Load account details for all lines
      const accountIds = entry.journal_entry_lines?.map(line => line.account_id).filter(Boolean) || [];
      console.log('Loading account details for IDs:', accountIds);
      
      if (accountIds.length > 0) {
        const { data: accounts, error: accountsError } = await supabase
          .from('accounts')
          .select(`
            id,
            code,
            name,
            description,
            is_active,
            level,
            parent_account_id,
            account_type_id,
            account_types (
              id,
              name,
              normal_balance,
              description
            )
          `)
          .in('id', accountIds);

        if (accountsError) {
          console.error('Error loading account details:', accountsError);
        } else if (accounts) {
          console.log('Loaded accounts:', accounts);
          setAccountDetails(accounts);
        }
      }

      // Load user details
      if (entry.created_by) {
        const { data: user, error: userError } = await supabase
          .from('users')
          .select('id, name, email, role')
          .eq('id', entry.created_by)
          .single();

        if (!userError && user) {
          setUserDetails(user);
        }
      }

      // Load period details
      if (entry.period_id) {
        const { data: period, error: periodError } = await supabase
          .from('accounting_periods')
          .select('id, name, start_date, end_date, is_locked')
          .eq('id', entry.period_id)
          .single();

        if (!periodError && period) {
          setPeriodDetails(period);
        }
      }
    } catch (error) {
      console.error('Error loading entity details:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getAccountTypeColor = (type: string) => {
    const colors = {
      Asset: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      Liability: 'bg-red-100 text-red-800 border-red-200',
      Equity: 'bg-blue-100 text-blue-800 border-blue-200',
      Revenue: 'bg-purple-100 text-purple-800 border-purple-200',
      Expense: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (isBalanced: boolean) => {
    return isBalanced 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-red-100 text-red-800 border-red-200';
  };

  const getAccountDetails = (accountId: string) => {
    return accountDetails.find(acc => acc.id === accountId);
  };

  const getAccountFromLine = (line: any) => {
    // First try to get account from the line's accounts property (loaded by getJournalEntries)
    if (line.accounts) {
      return {
        id: line.accounts.id,
        code: line.accounts.code,
        name: line.accounts.name,
        account_types: line.accounts.account_types
      };
    }
    // Fallback to accountDetails (loaded separately)
    const account = accountDetails.find(acc => acc.id === line.account_id);
    if (account) {
      console.log('Found account for line:', account);
    } else {
      console.log('No account found for line:', line.account_id, 'Available accounts:', accountDetails.map(a => a.id));
    }
    return account;
  };

  const openImagePreview = (imageData: string) => {
    setImagePreview(imageData);
  };

  const closeImagePreview = () => {
    setImagePreview(null);
  };

  const handleReverse = async () => {
    try {
      await AccountingService.reverseJournalEntry(entry.id);
      onClose();
      // Refresh the page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error reversing journal entry:', error);
    }
  };

  const hasLines = entry.journal_entry_lines && entry.journal_entry_lines.length > 0;
  const lineCount = entry.journal_entry_lines?.length || 0;
  const totalDebit = entry.total_debit || 0;
  const totalCredit = entry.total_credit || 0;
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading entity details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="w-6 h-6 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900 truncate">{entry.entry_number}</h1>
              <Badge className={getStatusColor(isBalanced)}>
                {isBalanced ? 'Balanced' : 'Unbalanced'}
              </Badge>
            </div>
            <p className="text-gray-600">{entry.description}</p>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(entry.entry_date)}
              </div>
              {entry.reference && (
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4" />
                  Ref: {entry.reference}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href={`/journal-entries/${entry.id}/edit`}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                <Edit className="w-4 h-4 mr-2" />
                Edit Entry
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={handleReverse}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reverse
            </Button>
            <Button variant="outline" size="sm">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(95vh-120px)]">
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Content - Takes 2 columns */}
              <div className="lg:col-span-2 space-y-6">
                {/* Journal Entry Lines */}
                <Card>
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Journal Entry Lines
                      </CardTitle>
                      <Badge variant="outline">
                        {lineCount} {lineCount === 1 ? 'Line' : 'Lines'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {hasLines ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Line #</TableHead>
                              <TableHead>Account</TableHead>
                              <TableHead>Account Type</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-right">Debit</TableHead>
                              <TableHead className="text-right">Credit</TableHead>
                              <TableHead>Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.journal_entry_lines?.map((line, index) => {
                              const account = getAccountFromLine(line);
                              return (
                                <TableRow key={line.id}>
                                  <TableCell className="font-medium">
                                    {line.line_number || index + 1}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-1">
                                      <div className="font-medium">
                                        {account ? `${account.code} - ${account.name}` : 'Unknown Account'}
                                      </div>
                                      {account?.description && (
                                        <div className="text-xs text-gray-500">
                                          {account.description}
                                        </div>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    {account?.account_types ? (
                                      <Badge className={getAccountTypeColor(account.account_types.name)}>
                                        {account.account_types.name}
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline">Unknown</Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="max-w-xs">
                                      <p className="text-sm truncate">
                                        {line.description || 'No description'}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {line.debit_amount > 0 ? formatCurrency(line.debit_amount) : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-mono">
                                    {line.credit_amount > 0 ? formatCurrency(line.credit_amount) : '-'}
                                  </TableCell>
                                  <TableCell>
                                    {line.image_data && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openImagePreview(line.image_data)}
                                      >
                                        <Image className="w-4 h-4" />
                                      </Button>
                                    )}
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-medium">No journal entry lines found</p>
                        <p className="text-sm">This entry appears to be missing its detail lines.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Financial Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="w-5 h-5" />
                      Financial Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Total Debits</Label>
                        <div className="text-2xl font-bold text-green-600">
                          {formatCurrency(totalDebit)}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Total Credits</Label>
                        <div className="text-2xl font-bold text-blue-600">
                          {formatCurrency(totalCredit)}
                        </div>
                      </div>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">Balance Status:</span>
                      <div className="flex items-center gap-2">
                        {isBalanced ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-green-600 font-medium">Balanced</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            <span className="text-red-600 font-medium">
                              Out of Balance by {formatCurrency(Math.abs(totalDebit - totalCredit))}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel - Takes 1 column */}
              <div className="space-y-6">
                {/* Entry Information */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Info className="w-5 h-5" />
                      Entry Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Entry Number</Label>
                      <p className="font-mono text-sm bg-gray-50 p-2 rounded">
                        {entry.entry_number}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Entry Date</Label>
                      <p className="text-sm">{formatDate(entry.entry_date)}</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Description</Label>
                      <p className="text-sm">{entry.description}</p>
                    </div>
                    {entry.reference && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Reference</Label>
                        <p className="text-sm font-mono bg-gray-50 p-2 rounded">
                          {entry.reference}
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-600">Created</Label>
                      <p className="text-sm">{formatDate(entry.created_at)}</p>
                    </div>
                    {entry.updated_at !== entry.created_at && (
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-600">Last Updated</Label>
                        <p className="text-sm">{formatDate(entry.updated_at)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* User Information */}
                {userDetails && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Created By
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Name</Label>
                        <p className="text-sm font-medium">{userDetails.name}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                        <p className="text-sm">{userDetails.email}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Role</Label>
                        <Badge variant="outline" className="capitalize">
                          {userDetails.role}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Period Information */}
                {periodDetails && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Accounting Period
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Period Name</Label>
                        <p className="text-sm font-medium">{periodDetails.name}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Start Date</Label>
                        <p className="text-sm">{formatDate(periodDetails.start_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">End Date</Label>
                        <p className="text-sm">{formatDate(periodDetails.end_date)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-sm font-medium text-gray-600">Status</Label>
                        <Badge className={periodDetails.is_locked ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}>
                          {periodDetails.is_locked ? 'Locked' : 'Open'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Account Types Summary */}
                {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 && (
                  <Card>
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-2">
                        <Building className="w-5 h-5" />
                        Account Types Used
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {Array.from(new Set(
                          entry.journal_entry_lines
                            .map(line => getAccountFromLine(line)?.account_types?.name)
                            .filter(Boolean)
                        )).map(type => (
                          <div key={type} className="flex items-center justify-between">
                            <span className="text-sm">{type}</span>
                            <Badge className={getAccountTypeColor(type!)}>
                              {entry.journal_entry_lines.filter(line => 
                                getAccountFromLine(line)?.account_types?.name === type
                              ).length}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Quick Actions */}
                <Card>
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Link href={`/journal-entries/${entry.id}/edit`} className="block">
                      <Button className="w-full justify-start" variant="outline">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit This Entry
                      </Button>
                    </Link>
                    <Button 
                      className="w-full justify-start" 
                      variant="outline"
                      onClick={handleReverse}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reverse Entry
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Printer className="w-4 h-4 mr-2" />
                      Print Entry
                    </Button>
                    <Button className="w-full justify-start" variant="outline">
                      <Download className="w-4 h-4 mr-2" />
                      Export Entry
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* Image Preview Modal */}
      {imagePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Document Preview</h3>
              <Button variant="ghost" size="sm" onClick={closeImagePreview}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4">
              <img
                src={imagePreview}
                alt="Document preview"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
