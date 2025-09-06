'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Edit, Printer, Download, Image, Eye } from 'lucide-react';
import Link from 'next/link';
import { type JournalEntry } from '@/lib/accounting-utils';

interface JournalEntryReviewProps {
  entry: JournalEntry;
  onClose: () => void;
}

export default function JournalEntryReview({ entry, onClose }: JournalEntryReviewProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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

  const openImagePreview = (imageData: string) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head>
            <title>Document Preview</title>
            <style>
              body { 
                margin: 0; 
                padding: 20px; 
                text-align: center; 
                background: #f8fafc; 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              }
              img { 
                max-width: 90vw; 
                max-height: 90vh; 
                object-fit: contain; 
                border-radius: 12px; 
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                border: 1px solid #e2e8f0;
              }
              .header { 
                margin-bottom: 20px; 
                color: #1e293b; 
                font-size: 18px;
                font-weight: 600;
              }
              .container {
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
                justify-content: center;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Supporting Document</h2>
                <p>Click outside the image or press ESC to close</p>
              </div>
              <img src="${imageData}" />
            </div>
          </body>
        </html>
      `);
    }
  };

  return (
    <div className="max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{entry.entry_number}</h1>
          <p className="text-gray-600 mt-1">Journal Entry Details</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/journal-entries/${entry.id}/edit`}>
            <Button size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Content */}
        <div className="space-y-6">
          {/* Entry Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>Entry Information</span>
                <Badge className={getStatusColor(entry.is_balanced)}>
                  {entry.is_balanced ? 'Balanced' : 'Unbalanced'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Entry Number</Label>
                    <p className="text-lg font-semibold font-mono">{entry.entry_number}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Entry Date</Label>
                    <p className="text-lg">{formatDate(entry.entry_date)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Reference</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded border">
                      {entry.reference || 'No reference'}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Debits</Label>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(entry.total_debit)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Total Credits</Label>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(entry.total_credit)}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Balance</Label>
                    <p className={`text-lg font-semibold ${entry.is_balanced ? 'text-green-600' : 'text-red-600'}`}>
                      {entry.is_balanced ? '✓ Balanced' : '✗ Unbalanced'}
                    </p>
                  </div>
                </div>
              </div>

              {entry.description && (
                <div className="pt-4 border-t">
                  <Label className="text-sm font-medium text-gray-600">Description</Label>
                  <p className="mt-2 text-gray-700 bg-gray-50 p-3 rounded border">
                    {entry.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Journal Lines */}
          <Card>
            <CardHeader>
              <CardTitle>Journal Lines ({entry.journal_entry_lines?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {entry.journal_entry_lines && entry.journal_entry_lines.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="font-semibold">Account</TableHead>
                          <TableHead className="font-semibold">Description</TableHead>
                          <TableHead className="text-right font-semibold">Debit</TableHead>
                          <TableHead className="text-right font-semibold">Credit</TableHead>
                          <TableHead className="font-semibold">Document</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entry.journal_entry_lines.map((line: any, index: number) => (
                          <TableRow key={line.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {line.accounts && (
                                  <Badge 
                                    variant="outline" 
                                    className={`${getAccountTypeColor(line.accounts.account_type)} border`}
                                  >
                                    {line.accounts.account_type}
                                  </Badge>
                                )}
                                <div className="min-w-0">
                                  <p className="font-mono text-sm font-medium">
                                    {line.accounts?.code || 'N/A'}
                                  </p>
                                  <p className="text-xs text-gray-600 truncate max-w-[200px]">
                                    {line.accounts?.name || 'Unknown Account'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm">{line.description || '-'}</p>
                            </TableCell>
                            <TableCell className="text-right">
                              {line.debit_amount > 0 ? (
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(line.debit_amount)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {line.credit_amount > 0 ? (
                                <span className="font-semibold text-blue-600">
                                  {formatCurrency(line.credit_amount)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {line.image_data ? (
                                <div className="flex items-center gap-2">
                                  <img
                                    src={line.image_data}
                                    alt="Supporting document"
                                    className="w-16 h-16 object-cover rounded-lg border-2 border-blue-200 cursor-pointer hover:border-blue-400 hover:shadow-md transition-all duration-200"
                                    onClick={() => openImagePreview(line.image_data)}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-xs font-medium text-blue-600">📄 Document</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 px-2 text-xs"
                                      onClick={() => openImagePreview(line.image_data)}
                                    >
                                      <Eye className="w-3 h-3 mr-1" />
                                      View
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                                    <span className="text-gray-400 text-xs">No doc</span>
                                  </div>
                                  <span className="text-xs text-gray-500">No document</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Totals Row */}
                  <div className="bg-gray-50 border rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-gray-700">Totals</span>
                      <div className="flex gap-8">
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Debits:</span>
                          <span className="ml-2 font-bold text-green-600">
                            {formatCurrency(entry.total_debit)}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm text-gray-600">Credits:</span>
                          <span className="ml-2 font-bold text-blue-600">
                            {formatCurrency(entry.total_credit)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No journal lines found for this entry.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Panel */}
        <div className="space-y-6">
          {/* Entry Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Entry Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total Lines:</span>
                <span className="font-medium">{entry.journal_entry_lines?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Has Documents:</span>
                <span className="font-medium">
                  {entry.journal_entry_lines?.some((line: any) => line.image_data) ? 'Yes' : 'No'}
                </span>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Debits:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(entry.total_debit)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Credits:</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(entry.total_credit)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Types */}
          <Card>
            <CardHeader>
              <CardTitle>Account Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {entry.journal_entry_lines?.reduce((acc: any, line: any) => {
                  const type = line.accounts?.account_type;
                  if (type && !acc[type]) {
                    acc[type] = true;
                  }
                  return acc;
                }, {}) && Object.keys(entry.journal_entry_lines?.reduce((acc: any, line: any) => {
                  const type = line.accounts?.account_type;
                  if (type && !acc[type]) {
                    acc[type] = true;
                  }
                  return acc;
                }, {}) || {}).map((type) => (
                  <Badge 
                    key={type} 
                    variant="outline" 
                    className={`${getAccountTypeColor(type)} border w-full justify-start`}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
