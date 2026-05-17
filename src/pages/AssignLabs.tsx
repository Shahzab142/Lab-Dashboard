import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { ShieldCheck, Plus, Trash2, UserPlus, Mail, Lock, User, MapPin, Building2, Globe, Check, ChevronsUpDown, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface SubAdmin {
  id: string;
  full_name: string;
  email: string;
  role: string;
  scope_type: string;
  scope_values: string[];
}

interface RegistryItem {
  city: string;
  tehsil: string;
  lab_name: string;
}

export default function AssignLabs() {
  const { user } = useAuth();
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }
  const [loading, setLoading] = useState(true);
  const [registry, setRegistry] = useState<RegistryItem[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    scope_type: 'DISTRICT',
    scope_values: [] as string[],
  });

  const [availableOptions, setAvailableOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchSubAdmins();
    fetchRegistry();
  }, []);

  useEffect(() => {
    // Update available options based on scope type
    const options = new Set<string>();
    if (formData.scope_type === 'DISTRICT') {
      registry.forEach(item => options.add(item.city));
    } else if (formData.scope_type === 'TEHSIL') {
      registry.forEach(item => options.add(item.tehsil));
    } else if (formData.scope_type === 'LAB') {
      registry.forEach(item => options.add(item.lab_name));
    }
    setAvailableOptions(Array.from(options).sort());
    setFormData(prev => ({ ...prev, scope_values: [] })); // Reset selections when type changes
  }, [formData.scope_type, registry]);

  const fetchSubAdmins = async () => {
    try {
      const data = await apiFetch('/sub-admins');
      setSubAdmins(data || []);
    } catch (err) {
      toast.error("Failed to load sub-admins");
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistry = async () => {
    try {
      const data = await apiFetch('/registry');
      setRegistry(data || []);
    } catch (err) {
      console.error("Failed to fetch registry", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email || !formData.password || formData.scope_values.length === 0) {
      toast.error("Please fill all fields and select at least one assignment");
      return;
    }

    try {
      if (editingId) {
        await apiFetch(`/sub-admins/${editingId}`, {
          method: 'PATCH',
          body: JSON.stringify(formData),
        });
        toast.success("Sub-Admin updated successfully");
      } else {
        await apiFetch('/sub-admins', {
          method: 'POST',
          body: JSON.stringify(formData),
        });
        toast.success("Sub-Admin created successfully");
      }

      setIsDialogOpen(false);
      setEditingId(null);
      fetchSubAdmins();
      setFormData({
        full_name: '',
        email: '',
        password: '',
        scope_type: 'DISTRICT',
        scope_values: [],
      });
    } catch (err: any) {
      toast.error(err.message || "Network error");
    }
  };

  const handleEdit = (admin: any) => {
    setEditingId(admin.id);
    setFormData({
      full_name: admin.full_name,
      email: admin.email,
      password: admin.password || '', // Backend now returns password
      scope_type: admin.scope_type,
      scope_values: admin.scope_values,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      full_name: '',
      email: '',
      password: '',
      scope_type: 'DISTRICT',
      scope_values: [],
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this sub-admin?")) return;

    try {
      await apiFetch(`/sub-admins/${id}`, {
        method: 'DELETE',
      });
      toast.success("Sub-Admin removed");
      fetchSubAdmins();
    } catch (err) {
      toast.error("Failed to delete");
    }
  };

  const toggleOption = (opt: string) => {
    setFormData(prev => ({
      ...prev,
      scope_values: prev.scope_values.includes(opt)
        ? prev.scope_values.filter(v => v !== opt)
        : [...prev.scope_values, opt]
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            <ShieldCheck className="w-10 h-10 text-primary" />
            ASSIGN LABS
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Manage sub-admin accounts and their regional access permissions.</p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} size="lg" className="bg-primary text-black font-black hover:scale-105 transition-transform shadow-xl">
              <UserPlus className="w-5 h-5 mr-2" />
              CREATE SUB-ADMIN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] bg-[#0d1117] border-border text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingId ? 'Edit Sub-Admin' : 'Register New Sub-Admin'}</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                {editingId ? 'Modify existing account credentials and access scope.' : 'Set account credentials and define their data visibility scope.'}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      placeholder="e.g. John Doe" 
                      className="pl-10 bg-black/40 border-border h-11" 
                      value={formData.full_name}
                      onChange={e => setFormData({...formData, full_name: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input 
                      type="email" 
                      placeholder="admin@tehsil.com" 
                      className="pl-10 bg-black/40 border-border h-11" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Access Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input 
                    type="text" 
                    placeholder="Set a security key" 
                    className="pl-10 bg-black/40 border-border h-11" 
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Access Level</Label>
                  <Select 
                    value={formData.scope_type} 
                    onValueChange={v => setFormData({...formData, scope_type: v})}
                  >
                    <SelectTrigger className="bg-black/40 border-border h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0d1117] border-border text-white">
                      <SelectItem value="DISTRICT">DISTRICT CONTROL</SelectItem>
                      <SelectItem value="TEHSIL">TEHSIL CONTROL</SelectItem>
                      <SelectItem value="LAB">SPECIFIC LAB ACCESS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Selected Assignments ({formData.scope_values.length})</Label>
                  <div className="h-11 bg-black/40 border border-border rounded-md px-3 flex items-center text-xs font-bold text-primary truncate">
                    {formData.scope_values.length === 0 ? "No items selected" : formData.scope_values.join(", ")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-widest opacity-70">Choose {formData.scope_type}s</Label>
                <Card className="bg-black/20 border-border">
                  <ScrollArea className="h-[150px] p-4">
                    <div className="grid grid-cols-1 gap-2">
                      {availableOptions.map(opt => (
                        <div key={opt} className="flex items-center space-x-3 p-2 hover:bg-white/5 rounded-lg transition-colors group cursor-pointer" onClick={() => toggleOption(opt)}>
                          <Checkbox 
                            id={opt} 
                            checked={formData.scope_values.includes(opt)}
                            onCheckedChange={() => toggleOption(opt)}
                            className="border-primary data-[state=checked]:bg-primary data-[state=checked]:text-black"
                          />
                          <label htmlFor={opt} className="text-sm font-medium leading-none cursor-pointer group-hover:text-primary transition-colors">
                            {opt}
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingId(null); }} className="hover:bg-white/5">Cancel</Button>
              <Button onClick={handleSubmit} className="bg-primary text-black font-bold">
                {editingId ? 'SAVE CHANGES' : 'CREATE ACCOUNT'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 border-border backdrop-blur-xl shadow-2xl overflow-hidden">
          <CardHeader className="bg-white/5 border-b border-border py-4">
            <CardTitle className="text-lg font-black tracking-widest uppercase flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              Active Sub-Admin Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-black/20">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-bold text-white/50 text-[10px] uppercase tracking-widest pl-6">Admin Identity</TableHead>
                  <TableHead className="font-bold text-white/50 text-[10px] uppercase tracking-widest">Access Scope</TableHead>
                  <TableHead className="font-bold text-white/50 text-[10px] uppercase tracking-widest">Assigned Items</TableHead>
                  <TableHead className="font-bold text-white/50 text-[10px] uppercase tracking-widest text-right pr-6">Management</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 animate-pulse text-muted-foreground font-black tracking-widest">
                      SYNCHRONIZING REGISTRY...
                    </TableCell>
                  </TableRow>
                ) : subAdmins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">
                      No sub-admins found. Create one to begin delegating control.
                    </TableCell>
                  </TableRow>
                ) : (
                  Array.isArray(subAdmins) && subAdmins.map((admin) => (
                    <TableRow key={admin.id} className="border-border hover:bg-white/5 transition-colors group">
                      <TableCell className="pl-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-black">
                            {admin.full_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-sm text-white">{admin.full_name}</p>
                            <p className="text-[10px] font-medium text-muted-foreground">{admin.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-violet-500/10 text-violet-400 border-violet-500/30 font-black text-[10px] px-3 py-1">
                          {admin.scope_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2 max-w-[400px]">
                          {admin.scope_values.map((v, i) => (
                            <Badge key={i} variant="secondary" className="bg-white/5 text-white/70 font-bold text-[9px] hover:bg-primary hover:text-black transition-colors">
                              {v}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEdit(admin)}
                            className="hover:bg-primary/20 hover:text-primary text-muted-foreground transition-all"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(admin.id)}
                            className="hover:bg-red-500/20 hover:text-red-500 text-muted-foreground transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
