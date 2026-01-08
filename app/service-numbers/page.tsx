'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface ServiceNumber {
  id: string;
  service_number: string;
  service_account_id: string;
  account_number: string;
  account_name: string;
  provider: string;
  package_name?: string;
  division_name?: string;
  first_seen_date: string;
  last_seen_date?: string;
  first_seen_invoice?: string;
  last_seen_invoice?: string;
  is_active: boolean;
  notes?: string;
}

export default function ServiceNumbersPage() {
  const router = useRouter();
  const [serviceNumbers, setServiceNumbers] = useState<ServiceNumber[]>([]);
  const [filteredNumbers, setFilteredNumbers] = useState<ServiceNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [searchServiceNumber, setSearchServiceNumber] = useState('');
  const [searchAccountNumber, setSearchAccountNumber] = useState('');
  const [searchPackageName, setSearchPackageName] = useState('');
  const [searchDivisionName, setSearchDivisionName] = useState('');
  const [filterActive, setFilterActive] = useState<string>('all'); // 'all', 'active', 'inactive'

  // Edit modal states
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceNumber | null>(null);
  const [editForm, setEditForm] = useState({
    package_name: '',
    division_name: '',
    is_active: true,
    notes: '',
  });

  useEffect(() => {
    fetchServiceNumbers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [serviceNumbers, searchServiceNumber, searchAccountNumber, searchPackageName, searchDivisionName, filterActive]);

  const fetchServiceNumbers = async () => {
    try {
      const res = await fetch('/api/service-numbers');
      const data = await res.json();

      if (data.success) {
        setServiceNumbers(data.data);
        setFilteredNumbers(data.data);
      } else {
        setError(data.error);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...serviceNumbers];

    // Filter by service number
    if (searchServiceNumber) {
      filtered = filtered.filter((sn) =>
        sn.service_number.toLowerCase().includes(searchServiceNumber.toLowerCase())
      );
    }

    // Filter by account number
    if (searchAccountNumber) {
      filtered = filtered.filter((sn) =>
        sn.account_number.toLowerCase().includes(searchAccountNumber.toLowerCase())
      );
    }

    // Filter by package name
    if (searchPackageName) {
      filtered = filtered.filter((sn) =>
        sn.package_name?.toLowerCase().includes(searchPackageName.toLowerCase())
      );
    }

    // Filter by division name
    if (searchDivisionName) {
      filtered = filtered.filter((sn) =>
        sn.division_name?.toLowerCase().includes(searchDivisionName.toLowerCase())
      );
    }

    // Filter by active status
    if (filterActive === 'active') {
      filtered = filtered.filter((sn) => sn.is_active);
    } else if (filterActive === 'inactive') {
      filtered = filtered.filter((sn) => !sn.is_active);
    }

    setFilteredNumbers(filtered);
  };

  const clearFilters = () => {
    setSearchServiceNumber('');
    setSearchAccountNumber('');
    setSearchPackageName('');
    setSearchDivisionName('');
    setFilterActive('all');
  };

  const openEditModal = (service: ServiceNumber) => {
    setEditingService(service);
    setEditForm({
      package_name: service.package_name || '',
      division_name: service.division_name || '',
      is_active: service.is_active,
      notes: service.notes || '',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingService(null);
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const res = await fetch('/api/service-numbers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingService.id,
          ...editForm,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Update the local state
        setServiceNumbers(prev =>
          prev.map(sn => sn.id === editingService.id ? { ...sn, ...editForm } : sn)
        );
        closeEditModal();
      } else {
        alert('Failed to update service number: ' + data.error);
      }
    } catch (err: any) {
      alert('Error updating service number: ' + err.message);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <p>Loading service numbers...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="p-4 bg-destructive/10 text-destructive rounded-lg mb-4">
            {error}
          </div>
          <Button onClick={() => router.push('/')} variant="outline">
            Go Home
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Service Numbers Registry</h1>
        <p className="text-muted-foreground">
          View and search all registered service numbers across all accounts
        </p>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
          <CardDescription>
            Filter service numbers by account, number, package, or division
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Service Number</label>
              <input
                type="text"
                placeholder="Search by service number..."
                value={searchServiceNumber}
                onChange={(e) => setSearchServiceNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Account Number</label>
              <input
                type="text"
                placeholder="Search by account number..."
                value={searchAccountNumber}
                onChange={(e) => setSearchAccountNumber(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Package Name</label>
              <input
                type="text"
                placeholder="Search by package..."
                value={searchPackageName}
                onChange={(e) => setSearchPackageName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Division</label>
              <input
                type="text"
                placeholder="Search by division..."
                value={searchDivisionName}
                onChange={(e) => setSearchDivisionName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-background"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <div className="flex gap-2">
                <Button
                  variant={filterActive === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('all')}
                >
                  All
                </Button>
                <Button
                  variant={filterActive === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('active')}
                >
                  Active
                </Button>
                <Button
                  variant={filterActive === 'inactive' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('inactive')}
                >
                  Inactive
                </Button>
              </div>
            </div>

            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>
            Service Numbers ({filteredNumbers.length})
          </CardTitle>
          <CardDescription>
            {filteredNumbers.length === serviceNumbers.length
              ? `Showing all ${serviceNumbers.length} service numbers`
              : `Showing ${filteredNumbers.length} of ${serviceNumbers.length} service numbers`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredNumbers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No service numbers found matching your filters
              </p>
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">Service Number</th>
                    <th className="text-left p-3 font-semibold">Account</th>
                    <th className="text-left p-3 font-semibold">Account Number</th>
                    <th className="text-left p-3 font-semibold">Package</th>
                    <th className="text-left p-3 font-semibold">Division</th>
                    <th className="text-left p-3 font-semibold">First Seen</th>
                    <th className="text-left p-3 font-semibold">Last Seen</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredNumbers.map((sn) => (
                    <tr key={sn.id} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <Link
                          href={`/service-numbers/${sn.service_number}`}
                          className="font-mono font-semibold text-primary hover:underline cursor-pointer"
                        >
                          {sn.service_number}
                        </Link>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="font-medium">{sn.account_name || sn.account_number}</p>
                          <p className="text-xs text-muted-foreground">
                            {sn.provider}
                          </p>
                        </div>
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-sm">{sn.account_number}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{sn.package_name || '-'}</p>
                      </td>
                      <td className="p-3">
                        <p className="text-sm">{sn.division_name || '-'}</p>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">
                            {new Date(sn.first_seen_date).toLocaleDateString()}
                          </p>
                          {sn.first_seen_invoice && (
                            <p className="text-xs text-muted-foreground">
                              {sn.first_seen_invoice}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div>
                          <p className="text-sm">
                            {sn.last_seen_date
                              ? new Date(sn.last_seen_date).toLocaleDateString()
                              : '-'}
                          </p>
                          {sn.last_seen_invoice && (
                            <p className="text-xs text-muted-foreground">
                              {sn.last_seen_invoice}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        {sn.is_active ? (
                          <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => openEditModal(sn)}
                          className="text-primary hover:text-primary/80 transition-colors"
                          title="Edit service number"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-6">
        <Button onClick={() => router.push('/')} variant="outline">
          Back to Home
        </Button>
      </div>

      {/* Edit Modal */}
      {editModalOpen && editingService && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Edit Service Number</CardTitle>
              <CardDescription>
                Update details for {editingService.service_number}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Package Name
                  </label>
                  <input
                    type="text"
                    value={editForm.package_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, package_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter package name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Division Name
                  </label>
                  <input
                    type="text"
                    value={editForm.division_name}
                    onChange={(e) =>
                      setEditForm({ ...editForm, division_name: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background"
                    placeholder="Enter division name"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Status</label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={editForm.is_active}
                        onChange={() => setEditForm({ ...editForm, is_active: true })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Active</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!editForm.is_active}
                        onChange={() => setEditForm({ ...editForm, is_active: false })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Inactive</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) =>
                      setEditForm({ ...editForm, notes: e.target.value })
                    }
                    className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                    placeholder="Add notes about this service number"
                  />
                </div>
              </div>
            </CardContent>
            <div className="flex items-center justify-end gap-3 p-6 pt-0">
              <Button variant="outline" onClick={closeEditModal}>
                Cancel
              </Button>
              <Button onClick={handleUpdateService}>Save Changes</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
    </>
  );
}
