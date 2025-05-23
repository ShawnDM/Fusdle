import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar, Tag, LogOut, Eye, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import GoogleAuth from "@/components/google-auth";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { firestoreService, type PatchNote } from "@/firebase/firestore";

const PatchNotes: React.FC = () => {
  const [patchNotes, setPatchNotes] = useState<PatchNote[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingNote, setEditingNote] = useState<PatchNote | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [version, setVersion] = useState("");
  const [type, setType] = useState<PatchNote['type']>('feature');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // List of admin email addresses (you can modify this list)
  const adminEmails = [
    // Add your Gmail address here
    import.meta.env.VITE_ADMIN_EMAIL || "your-email@gmail.com"
  ];

  // Listen for authentication state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Check if user email is in admin list
        const isUserAdmin = adminEmails.includes(currentUser.email || "");
        setIsAdmin(isUserAdmin);
        
        // Only show toast once when first becoming admin
        if (isUserAdmin && !isAdmin) {
          const firstName = currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0] || 'Admin';
          toast({
            title: "Admin access granted",
            description: `Welcome back, ${firstName}!`,
          });
        }
      } else {
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []); // Remove dependencies to prevent loops

  // Load patch notes from Firebase
  useEffect(() => {
    const loadPatchNotes = async () => {
      try {
        const notes = await firestoreService.getPatchNotes();
        setPatchNotes(notes);
        
        // If no notes exist, create some initial ones
        if (notes.length === 0) {
          const defaultNotes = [
            {
              title: 'Welcome to Fusdle Patch Notes',
              content: `# Welcome to Fusdle! 🎮

We're excited to bring you **regular updates** and improvements to make your daily puzzle experience even better.

## What's New:
- **Rich text support** - Patch notes now support markdown formatting
- **Real-time updates** - All updates are now saved globally
- **Better organization** - Clear categorization of features, fixes, and improvements

Stay tuned for more exciting features coming soon!`,
              version: 'v1.0.0',
              date: new Date().toISOString(),
              type: 'feature' as const
            }
          ];
          
          for (const note of defaultNotes) {
            await firestoreService.createPatchNote(note);
          }
          
          // Reload notes after creating defaults
          const updatedNotes = await firestoreService.getPatchNotes();
          setPatchNotes(updatedNotes);
        }
      } catch (error) {
        console.error('Error loading patch notes:', error);
        toast({
          title: "Error loading patch notes",
          description: "Failed to load patch notes from server.",
          variant: "destructive",
        });
      }
    };
    
    loadPatchNotes();
  }, [toast]);

  // Add new patch note
  const handleAddNote = async () => {
    if (!title || !content || !version) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const newNote = await firestoreService.createPatchNote({
        title,
        content,
        version,
        date: new Date().toISOString(),
        type
      });

      setPatchNotes(prev => [newNote, ...prev]);

      // Reset form
      setTitle("");
      setContent("");
      setVersion("");
      setType('feature');
      setIsPreviewMode(false);
      setShowEditDialog(false);

      toast({
        title: "Patch note added",
        description: "New patch note has been published globally.",
      });
    } catch (error) {
      console.error('Error adding patch note:', error);
      toast({
        title: "Error adding patch note",
        description: "Failed to save patch note. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Edit patch note
  const handleEditNote = async () => {
    if (!editingNote || !title || !content || !version) return;

    try {
      await firestoreService.updatePatchNote(editingNote.id, {
        title,
        content,
        version,
        type
      });

      setPatchNotes(prev => prev.map(note =>
        note.id === editingNote.id
          ? { ...note, title, content, version, type }
          : note
      ));

      setEditingNote(null);
      setShowEditDialog(false);

      // Reset form
      setTitle("");
      setContent("");
      setVersion("");
      setType('feature');
      setIsPreviewMode(false);

      toast({
        title: "Patch note updated",
        description: "Changes have been saved globally.",
      });
    } catch (error) {
      console.error('Error updating patch note:', error);
      toast({
        title: "Error updating patch note",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Delete patch note
  const handleDeleteNote = async (id: string) => {
    try {
      await firestoreService.deletePatchNote(id);
      setPatchNotes(prev => prev.filter(note => note.id !== id));

      toast({
        title: "Patch note deleted",
        description: "The patch note has been removed globally.",
      });
    } catch (error) {
      console.error('Error deleting patch note:', error);
      toast({
        title: "Error deleting patch note",
        description: "Failed to delete patch note. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Start editing
  const startEditing = (note: PatchNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setVersion(note.version);
    setType(note.type);
    setShowEditDialog(true);
  };

  // Get badge variant for patch note type
  const getBadgeVariant = (type: PatchNote['type']) => {
    switch (type) {
      case 'feature': return 'default';
      case 'fix': return 'destructive';
      case 'improvement': return 'secondary';
      case 'change': return 'outline';
      default: return 'default';
    }
  };

  // Get badge label for patch note type
  const getBadgeLabel = (type: PatchNote['type']) => {
    switch (type) {
      case 'feature': return '✨ Feature';
      case 'fix': return '🐛 Fix';
      case 'improvement': return '⚡ Improvement';
      case 'change': return '🔄 Change';
      default: return type;
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Patch Notes</h1>
            <p className="text-gray-600 mt-1">Latest updates and improvements to Fusdle</p>
          </div>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                size="sm"
                onClick={() => {
                  setEditingNote(null);
                  setTitle("");
                  setContent("");
                  setVersion("");
                  setType('feature');
                  setShowEditDialog(true);
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Note
              </Button>
              
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>
                      {editingNote ? 'Edit Patch Note' : 'Add New Patch Note'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Title</label>
                      <Input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Patch note title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Version</label>
                      <Input
                        value={version}
                        onChange={(e) => setVersion(e.target.value)}
                        placeholder="e.g., v1.2.0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select 
                        value={type} 
                        onChange={(e) => setType(e.target.value as PatchNote['type'])}
                        className="w-full p-2 border border-gray-300 rounded-md"
                      >
                        <option value="feature">✨ Feature</option>
                        <option value="fix">🐛 Fix</option>
                        <option value="improvement">⚡ Improvement</option>
                        <option value="change">🔄 Change</option>
                      </select>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium">Content (Markdown Supported)</label>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant={!isPreviewMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsPreviewMode(false)}
                          >
                            <FileText className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant={isPreviewMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setIsPreviewMode(true)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Preview
                          </Button>
                        </div>
                      </div>
                      
                      {!isPreviewMode ? (
                        <Textarea
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Describe the changes using markdown...

Examples:
# Main heading
## Sub heading
**Bold text**
*Italic text*
- Bullet points
1. Numbered lists
[Link text](https://example.com)
`code`"
                          rows={8}
                          className="font-mono text-sm"
                        />
                      ) : (
                        <div className="border rounded-md p-3 min-h-32 bg-gray-50">
                          {content ? (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {content}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Preview will appear here...</p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        onClick={(e) => {
                          e.preventDefault();
                          setShowEditDialog(false);
                          setEditingNote(null);
                          setTitle("");
                          setContent("");
                          setVersion("");
                          setType('feature');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          editingNote ? handleEditNote() : handleAddNote();
                        }}
                      >
                        {editingNote ? 'Update' : 'Add'} Note
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {patchNotes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No patch notes available.</p>
            </div>
          ) : (
            patchNotes.map((note) => (
              <Card key={note.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-lg">{note.title}</CardTitle>
                        <Badge variant={getBadgeVariant(note.type)}>
                          {getBadgeLabel(note.type)}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {note.version}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(note.date), "MMM d, yyyy")}
                        </div>
                      </div>
                    </div>
                    
                    {isAdmin && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(note)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteNote(note.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-gray-700 leading-relaxed prose prose-sm max-w-none prose-headings:text-gray-800 prose-strong:text-gray-900 prose-code:bg-gray-100 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {note.content}
                    </ReactMarkdown>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default PatchNotes;