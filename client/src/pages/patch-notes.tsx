import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Calendar, Tag, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getAuth, onAuthStateChanged, User } from "firebase/auth";
import GoogleAuth from "@/components/google-auth";

interface PatchNote {
  id: string;
  title: string;
  content: string;
  version: string;
  date: string;
  type: 'feature' | 'fix' | 'improvement' | 'change';
}

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
        
        if (isUserAdmin) {
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
  }, [adminEmails, toast]);

  // Load patch notes from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('fusdle_patch_notes');
    if (stored) {
      try {
        setPatchNotes(JSON.parse(stored));
      } catch (e) {
        console.error('Error loading patch notes:', e);
      }
    } else {
      // Initialize with some default patch notes
      const defaultNotes: PatchNote[] = [
        {
          id: '1',
          title: 'Theme Display & Letter Placeholders',
          content: 'Added theme display to show puzzle categories and letter placeholders to reveal word structure. Each word now shows in separate boxes with underscores for letters.',
          version: 'v1.2.0',
          date: new Date().toISOString(),
          type: 'feature'
        },
        {
          id: '2',
          title: 'Archive Filtering Fix',
          content: 'Fixed archive filtering to correctly display the full range of normal difficulty puzzles. Archive now shows complete puzzle history.',
          version: 'v1.1.1',
          date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
          type: 'fix'
        },
        {
          id: '3',
          title: 'Fusdle Numbering Update',
          content: 'Updated Fusdle numbering system so that May 22, 2025 is now Fusdle #1. All puzzle numbers now align with the current date system.',
          version: 'v1.1.0',
          date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
          type: 'change'
        }
      ];
      setPatchNotes(defaultNotes);
      localStorage.setItem('fusdle_patch_notes', JSON.stringify(defaultNotes));
    }
  }, []);

  // Save patch notes to localStorage
  const savePatchNotes = (notes: PatchNote[]) => {
    localStorage.setItem('fusdle_patch_notes', JSON.stringify(notes));
    setPatchNotes(notes);
  };



  // Add new patch note
  const handleAddNote = () => {
    if (!title || !content || !version) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const newNote: PatchNote = {
      id: Date.now().toString(),
      title,
      content,
      version,
      date: new Date().toISOString(),
      type
    };

    const updatedNotes = [newNote, ...patchNotes];
    savePatchNotes(updatedNotes);

    // Reset form
    setTitle("");
    setContent("");
    setVersion("");
    setType('feature');
    setShowEditDialog(false);

    toast({
      title: "Patch note added",
      description: "New patch note has been published.",
    });
  };

  // Edit patch note
  const handleEditNote = () => {
    if (!editingNote || !title || !content || !version) return;

    const updatedNotes = patchNotes.map(note =>
      note.id === editingNote.id
        ? { ...note, title, content, version, type }
        : note
    );

    savePatchNotes(updatedNotes);
    setEditingNote(null);
    setShowEditDialog(false);

    // Reset form
    setTitle("");
    setContent("");
    setVersion("");
    setType('feature');

    toast({
      title: "Patch note updated",
      description: "Changes have been saved.",
    });
  };

  // Delete patch note
  const handleDeleteNote = (id: string) => {
    const updatedNotes = patchNotes.filter(note => note.id !== id);
    savePatchNotes(updatedNotes);

    toast({
      title: "Patch note deleted",
      description: "The patch note has been removed.",
    });
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
              <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </DialogTrigger>
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
                      <label className="block text-sm font-medium mb-1">Content</label>
                      <Textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Describe the changes..."
                        rows={4}
                      />
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
                  <p className="text-gray-700 leading-relaxed">{note.content}</p>
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