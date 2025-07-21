import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  Edit2, 
  Trash2,
  Download,
  Users,
  CheckCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import type { Contact } from '@catapult-event-manager/shared';

// Helper function to convert text to sentence case
function toSentenceCase(str: string | null | undefined): string {
  if (!str) return '-';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

interface ContactWithEvent extends Contact {
  event?: {
    id: string;
    title: string;
  };
}

export function ContactsListPage() {
  const navigate = useNavigate();
  
  const [contacts, setContacts] = useState<ContactWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalContacts, setTotalContacts] = useState(0);
  const [pageSize] = useState(20);
  
  // Selection states
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);

  useEffect(() => {
    fetchContacts();
    fetchEvents();
  }, [searchQuery, statusFilter, sortBy, sortOrder, currentPage]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams({
        page: currentPage.toString(),
        limit: pageSize.toString(),
        sortBy,
        sortOrder,
      });
      
      if (searchQuery) {
        queryParams.append('search', searchQuery);
      }
      
      if (statusFilter !== 'all') {
        queryParams.append('status', statusFilter);
      }
      
      const response = await fetch(`/api/contacts?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch contacts');
      }
      
      const data = await response.json();
      setContacts(data.contacts);
      setTotalPages(data.pagination.totalPages);
      setTotalContacts(data.pagination.total);
      setCurrentPage(data.pagination.page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      if (data.success && data.data) {
        setEvents(data.data.map((event: any) => ({ id: event.id, title: event.title })));
      }
    } catch (err) {
      console.error('Error fetching events:', err);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(contacts.map(c => c.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContacts);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContacts(newSelected);
    setSelectAll(false);
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedContacts.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} lead(s)?`)) {
      return;
    }
    
    // TODO: Implement bulk delete API
    console.log('Bulk delete:', Array.from(selectedContacts));
  };

  const handleBulkExport = () => {
    if (selectedContacts.size === 0) return;
    
    // TODO: Implement bulk export
    console.log('Bulk export:', Array.from(selectedContacts));
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete contact');
      }
      
      // Refresh the contacts list
      fetchContacts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contact');
    }
  };

  const getStatusBadge = (contact: Contact) => {
    if (contact.needsReview) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs Review
        </Badge>
      );
    }
    return (
      <Badge variant="default" className="gap-1">
        <CheckCircle className="h-3 w-3" />
        Verified
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading && contacts.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2">Leads</h1>
          <p className="text-gray-600">Manage all your event leads in one place</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => navigate('/lead-groups')}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Lead Groups
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Lead
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <Card className="p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by name, email, or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Leads</SelectItem>
              <SelectItem value="needs-review">Needs Review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="title">Title</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Bulk Actions */}
      {selectedContacts.size > 0 && (
        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-blue-700">
              {selectedContacts.size} lead(s) selected
            </span>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkExport}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => console.log('Assign to group')}
              >
                <Users className="h-4 w-4 mr-2" />
                Assign to Group
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Contacts Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 w-12">
                  <Checkbox
                    checked={selectAll}
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="p-4">
                  <button
                    className="font-medium flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">
                  <button
                    className="font-medium flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">
                  <button
                    className="font-medium flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort('company')}
                  >
                    Company
                    {sortBy === 'company' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4">Event</th>
                <th className="p-4">Status</th>
                <th className="p-4">
                  <button
                    className="font-medium flex items-center gap-1 hover:text-gray-700"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date Added
                    {sortBy === 'createdAt' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <Checkbox
                      checked={selectedContacts.has(contact.id)}
                      onCheckedChange={() => handleSelectContact(contact.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium">
                        {toSentenceCase(contact.firstName)} {toSentenceCase(contact.lastName)}
                      </div>
                      {contact.title && (
                        <div className="text-sm text-gray-600">{toSentenceCase(contact.title)}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-gray-600">
                    {contact.email?.toLowerCase() || '-'}
                  </td>
                  <td className="p-4 text-gray-600">
                    {toSentenceCase(contact.company)}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-gray-600">
                      {contact.event?.title || 'Unknown Event'}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(contact)}
                  </td>
                  <td className="p-4 text-gray-600">
                    {formatDate(contact.createdAt)}
                  </td>
                  <td className="p-4">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        title="View contact"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/contacts/${contact.id}`)}
                        title="Edit lead"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteContact(contact.id)}
                        title="Delete lead"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalContacts)} of {totalContacts} leads
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && contacts.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-gray-600 mb-4">No contacts found</p>
          <Button onClick={() => navigate('/')}>
            Go to Events
          </Button>
        </Card>
      )}

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        events={events}
      />
    </div>
  );
}