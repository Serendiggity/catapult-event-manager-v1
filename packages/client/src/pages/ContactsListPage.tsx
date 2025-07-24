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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import type { Contact } from '@new-era-event-manager/shared';

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
  const [showAssignGroupModal, setShowAssignGroupModal] = useState(false);
  const [events, setEvents] = useState<Array<{ id: string; title: string }>>([]);
  
  // Campaign groups for assign modal
  const [campaignGroups, setCampaignGroups] = useState<any[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

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
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts?${queryParams}`);
      
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
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
  
  const fetchLeadGroups = async () => {
    try {
      // Fetch campaign groups for all events
      const eventsResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/events`);
      if (!eventsResponse.ok) return;
      
      const eventsData = await eventsResponse.json();
      const events = eventsData.data || eventsData;
      
      const groupsPromises = events.map(async (event: any) => {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/event/${event.id}`
        );
        if (!response.ok) return [];
        const data = await response.json();
        const groups = data.groups || data;
        return Array.isArray(groups) ? groups.map((g: any) => ({ ...g, eventTitle: event.title })) : [];
      });
      
      const allGroups = await Promise.all(groupsPromises);
      setCampaignGroups(allGroups.flat());
    } catch (err) {
      console.error('Error fetching campaign groups:', err);
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
    
    if (!confirm(`Are you sure you want to delete ${selectedContacts.size} lead(s)? This action cannot be undone.`)) {
      return;
    }
    
    try {
      const deletePromises = Array.from(selectedContacts).map(contactId => 
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/${contactId}`, {
          method: 'DELETE',
        })
      );
      
      await Promise.all(deletePromises);
      
      // Clear selection and refresh
      setSelectedContacts(new Set());
      setSelectAll(false);
      fetchContacts();
      
      // Show success message (you could add a toast here)
      alert(`Successfully deleted ${selectedContacts.size} lead(s)`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete contacts');
      alert('Failed to delete some or all selected leads');
    }
  };

  const handleBulkExport = () => {
    if (selectedContacts.size === 0) return;
    
    // Get selected contacts data
    const selectedContactsData = contacts.filter(contact => 
      selectedContacts.has(contact.id)
    );
    
    // Convert to CSV
    const headers = ['First Name', 'Last Name', 'Email', 'Company', 'Title', 'Phone', 'Event', 'Status', 'Date Added'];
    const csvContent = [
      headers.join(','),
      ...selectedContactsData.map(contact => [
        contact.firstName || '',
        contact.lastName || '',
        contact.email || '',
        contact.company || '',
        contact.title || '',
        contact.phone || '',
        contact.event?.title || '',
        contact.needsReview ? 'Needs Review' : 'Verified',
        new Date(contact.createdAt).toLocaleDateString()
      ].map(field => `"${field}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `leads_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clear selection
    setSelectedContacts(new Set());
    setSelectAll(false);
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) {
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/contacts/${contactId}`, {
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
  
  const handleAssignToGroup = async () => {
    if (!selectedGroupId || selectedContacts.size === 0) {
      alert('Please select a campaign group');
      return;
    }
    
    try {
      // Add each selected contact to the group
      const assignPromises = Array.from(selectedContacts).map(contactId => 
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/campaign-groups/${selectedGroupId}/contacts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contactId }),
        })
      );
      
      await Promise.all(assignPromises);
      
      // Close modal and clear selection
      setShowAssignGroupModal(false);
      setSelectedContacts(new Set());
      setSelectAll(false);
      setSelectedGroupId('');
      
      alert(`Successfully assigned ${selectedContacts.size} lead(s) to the group`);
    } catch (err) {
      alert('Failed to assign some or all leads to the group');
    }
  };
  
  const openAssignGroupModal = () => {
    if (selectedContacts.size === 0) return;
    fetchLeadGroups();
    setShowAssignGroupModal(true);
  };

  const getStatusBadge = (contact: Contact) => {
    if (contact.needsReview) {
      return (
        <Badge variant="secondary" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Needs review
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
          <LoadingSpinner size="lg" text="Loading leads..." />
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
            onClick={() => navigate('/campaign-groups')}
            variant="outline"
          >
            <Users className="h-4 w-4 mr-2" />
            Campaign groups
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create lead
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
                placeholder="Search: name, email, company, or job (e.g., 'realtor', 'engineer')..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              💡 Try natural language: "real estate" finds realtors, agents, brokers
            </p>
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All leads</SelectItem>
              <SelectItem value="needs-review">Needs review</SelectItem>
              <SelectItem value="verified">Verified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date added</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="company">Company</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="industry">Industry</SelectItem>
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
                onClick={openAssignGroupModal}
              >
                <Users className="h-4 w-4 mr-2" />
                Assign to group
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
            <thead className="bg-muted/50 dark:bg-muted/20 border-b border-border">
              <tr className="text-left">
                <th className="p-4 w-12">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={selectAll}
                      onCheckedChange={handleSelectAll}
                      className="h-5 w-5 border-2"
                      aria-label="Select all leads"
                    />
                  </div>
                </th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    Name
                    {sortBy === 'name' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortBy === 'email' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                    onClick={() => handleSort('company')}
                  >
                    Company
                    {sortBy === 'company' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                    onClick={() => handleSort('industry')}
                  >
                    Industry
                    {sortBy === 'industry' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">Event</th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-medium text-foreground uppercase tracking-wider">
                  <button
                    className="flex items-center gap-1 hover:text-muted-foreground transition-colors"
                    onClick={() => handleSort('createdAt')}
                  >
                    Date Added
                    {sortBy === 'createdAt' && (
                      sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </th>
                <th className="p-4 text-right text-xs font-medium text-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {contacts.map((contact, index) => (
                <tr 
                  key={contact.id} 
                  className={`${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/40 dark:hover:bg-muted/30 transition-colors`}
                >
                  <td className="p-4">
                    <Checkbox
                      checked={selectedContacts.has(contact.id)}
                      onCheckedChange={() => handleSelectContact(contact.id)}
                    />
                  </td>
                  <td className="p-4">
                    <div>
                      <div className="font-medium text-foreground">
                        {toSentenceCase(contact.firstName)} {toSentenceCase(contact.lastName)}
                      </div>
                      {contact.title && (
                        <div className="text-sm text-muted-foreground">{toSentenceCase(contact.title)}</div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {contact.email?.toLowerCase() || '-'}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {toSentenceCase(contact.company)}
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {contact.industry || '-'}
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-muted-foreground">
                      {contact.event?.title || 'Unknown event'}
                    </span>
                  </td>
                  <td className="p-4">
                    {getStatusBadge(contact)}
                  </td>
                  <td className="p-4 text-muted-foreground">
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
            Go to events
          </Button>
        </Card>
      )}

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        events={events}
      />
      
      {/* Assign to Group Modal */}
      {showAssignGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Assign to Campaign Group</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Assign {selectedContacts.size} selected lead(s) to a group
                </p>
                <div>
                  <Label htmlFor="group-select">Select Campaign Group</Label>
                  <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                    <SelectTrigger id="group-select">
                      <SelectValue placeholder="Choose a campaign group" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaignGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: group.color }}
                            />
                            <span>{group.name}</span>
                            <span className="text-sm text-gray-500">
                              ({group.eventTitle})
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAssignGroupModal(false);
                    setSelectedGroupId('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleAssignToGroup}>
                  Assign to group
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}