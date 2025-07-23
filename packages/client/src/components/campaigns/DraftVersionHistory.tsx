import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  History, 
  User, 
  Bot, 
  Clock, 
  Eye, 
  RotateCcw,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface DraftVersion {
  id: string;
  draftId: string;
  versionNumber: number;
  subject: string;
  body: string;
  variables: string[];
  editedBy: 'user' | 'ai';
  changeDescription: string;
  createdAt: string;
}

interface DraftVersionHistoryProps {
  draftId: string;
  currentSubject: string;
  currentBody: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore?: (version: DraftVersion) => void;
}

export function DraftVersionHistory({
  draftId,
  currentSubject,
  currentBody,
  isOpen,
  onClose,
  onRestore
}: DraftVersionHistoryProps) {
  const { toast } = useToast();
  const [versions, setVersions] = useState<DraftVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<DraftVersion | null>(null);
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen && draftId) {
      fetchVersions();
    }
  }, [isOpen, draftId]);

  const fetchVersions = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/campaigns/drafts/${draftId}/versions`
      );
      
      if (response.ok) {
        const data = await response.json();
        setVersions(data.versions || []);
        if (data.versions.length > 0) {
          setSelectedVersion(data.versions[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching versions:', error);
      toast({
        title: "Error",
        description: "Failed to load version history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (version: DraftVersion) => {
    if (onRestore) {
      onRestore(version);
      toast({
        title: "Version restored",
        description: `Draft restored to version ${version.versionNumber}`,
      });
      onClose();
    }
  };

  const toggleVersionExpanded = (versionId: string) => {
    const newExpanded = new Set(expandedVersions);
    if (newExpanded.has(versionId)) {
      newExpanded.delete(versionId);
    } else {
      newExpanded.add(versionId);
    }
    setExpandedVersions(newExpanded);
  };

  const getDiff = (oldText: string, newText: string) => {
    // Simple diff visualization - in production, use a proper diff library
    if (oldText === newText) return null;
    
    return (
      <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
        <div className="text-red-600 line-through mb-1">{oldText.substring(0, 100)}...</div>
        <div className="text-green-600">{newText.substring(0, 100)}...</div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Draft Version History
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No version history available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[600px]">
            {/* Version List */}
            <div className="border-r pr-4">
              <h3 className="font-semibold mb-3">Versions</h3>
              <ScrollArea className="h-[550px]">
                <div className="space-y-2">
                  {/* Current Version */}
                  <div
                    className="p-3 border rounded-lg bg-blue-50 border-blue-200 cursor-pointer"
                    onClick={() => setSelectedVersion(null)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">Current</Badge>
                        <User className="h-4 w-4" />
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm mt-1 font-medium">Current Version</p>
                    <p className="text-xs text-gray-600">Unsaved changes</p>
                  </div>

                  {/* Historical Versions */}
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedVersion?.id === version.id
                          ? 'bg-gray-100 border-gray-400'
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedVersion(version)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            v{version.versionNumber}
                          </Badge>
                          {version.editedBy === 'ai' ? (
                            <Bot className="h-4 w-4 text-purple-600" />
                          ) : (
                            <User className="h-4 w-4 text-blue-600" />
                          )}
                        </div>
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(version.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm mt-1">{version.changeDescription}</p>
                      
                      <button
                        className="flex items-center gap-1 text-xs text-gray-500 mt-2 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleVersionExpanded(version.id);
                        }}
                      >
                        {expandedVersions.has(version.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3" />
                            Hide details
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3" />
                            Show details
                          </>
                        )}
                      </button>
                      
                      {expandedVersions.has(version.id) && (
                        <div className="mt-2 pt-2 border-t text-xs text-gray-600">
                          <p className="font-medium">Subject:</p>
                          <p className="truncate">{version.subject}</p>
                          <p className="font-medium mt-1">Body preview:</p>
                          <p className="line-clamp-2">{version.body}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Version Preview */}
            <div className="pl-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">
                  {selectedVersion ? `Version ${selectedVersion.versionNumber}` : 'Current Version'}
                </h3>
                {selectedVersion && onRestore && (
                  <Button
                    size="sm"
                    onClick={() => handleRestore(selectedVersion)}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Restore This Version
                  </Button>
                )}
              </div>

              <Tabs defaultValue="preview" className="h-[500px]">
                <TabsList>
                  <TabsTrigger value="preview">
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </TabsTrigger>
                  <TabsTrigger value="changes">
                    <History className="h-4 w-4 mr-2" />
                    Changes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="preview" className="h-[450px]">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Subject</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded">
                          {selectedVersion ? selectedVersion.subject : currentSubject}
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-gray-700">Body</label>
                        <div className="mt-1 p-3 bg-gray-50 rounded whitespace-pre-wrap">
                          {selectedVersion ? selectedVersion.body : currentBody}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="changes" className="h-[450px]">
                  <ScrollArea className="h-full">
                    <div className="space-y-4">
                      {selectedVersion ? (
                        <>
                          <div>
                            <h4 className="text-sm font-medium mb-2">Change Summary</h4>
                            <p className="text-sm text-gray-600">
                              {selectedVersion.changeDescription}
                            </p>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Edited By</h4>
                            <div className="flex items-center gap-2">
                              {selectedVersion.editedBy === 'ai' ? (
                                <>
                                  <Bot className="h-4 w-4 text-purple-600" />
                                  <span className="text-sm">AI Assistant</span>
                                </>
                              ) : (
                                <>
                                  <User className="h-4 w-4 text-blue-600" />
                                  <span className="text-sm">Manual Edit</span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Timestamp</h4>
                            <p className="text-sm text-gray-600">
                              {new Date(selectedVersion.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </>
                      ) : (
                        <p className="text-sm text-gray-600">
                          This is the current working version with unsaved changes.
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}