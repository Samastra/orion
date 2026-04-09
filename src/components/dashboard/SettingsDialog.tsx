'use client';

import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Tabs, 
  TabsContent, 
} from "@/components/ui/tabs";
import { useUser } from "@/components/auth/UserAvatar";
import { createClient } from '@/lib/supabase/client';
import { updateProfile, signOut, updatePassword } from "@/lib/supabase/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { 
  LogOut, 
  User as UserIcon, 
  Sparkles, 
  Loader2,
  Settings,
  ShieldCheck,
  Bell,
  Check,
  Eye,
  EyeOff
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When true, renders inline content without Dialog wrapper (for MobileSheet) */
  mobileMode?: boolean;
}

export function SettingsDialog({ open, onOpenChange, mobileMode = false }: SettingsDialogProps) {
  const router = useRouter();
  const { user, loading: userLoading } = useUser();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    nickname: '',
    major: '',
    university: '',
    aiFeedbackTone: 'Encouraging'
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState(false);

  // Fetch and sync profile data
  useEffect(() => {
    if (!open || !user) return;

    const syncData = async () => {
      const supabase = createClient();
      
      // 1. Start with metadata fallbacks
      const metadata = user.user_metadata || {};
      const initialData = {
        nickname: metadata.nickname || metadata.full_name?.split(' ')[0] || '',
        major: metadata.major || 'General Studies',
        university: metadata.university || '',
        aiFeedbackTone: metadata.ai_feedback_tone || 'Encouraging'
      };

      // 2. Overlay with source-of-truth from DB
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profile && !error) {
          setFormData({
            nickname: profile.nickname || initialData.nickname,
            major: profile.major || initialData.major,
            university: profile.university || initialData.university,
            aiFeedbackTone: profile.ai_feedback_tone || initialData.aiFeedbackTone
          });
        } else {
          // If no profile record exists yet, stick with metadata
          setFormData(initialData);
        }
      } catch (err) {
        console.warn('Settings: Could not fetch profile from DB, using metadata fallback.', err);
        setFormData(initialData);
      }
    };

    syncData();
  }, [open, user, user?.user_metadata]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append('nickname', formData.nickname);
    data.append('major', formData.major);
    data.append('university', formData.university);
    data.append('aiFeedbackTone', formData.aiFeedbackTone);

    const result = await updateProfile(data);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Settings saved successfully");
      onOpenChange(false);
      // Refresh the page to update all client-side state (nickname/major in header)
      router.refresh();
      window.location.reload();
    }
    setLoading(false);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordData.newPassword) return;
    
    setLoading(true);
    const data = new FormData();
    data.append('password', passwordData.newPassword);
    data.append('confirmPassword', passwordData.confirmPassword);

    const result = await updatePassword(data);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success("Password updated successfully");
      setPasswordData({ newPassword: '', confirmPassword: '' });
    }
    setLoading(false);
  };

  const navItems = [
    { value: "profile", label: "Profile Details", icon: UserIcon },
    { value: "preferences", label: "AI Preferences", icon: Sparkles },
    { value: "notifications", label: "Notifications", icon: Bell },
    { value: "security", label: "Account & Security", icon: ShieldCheck },
  ];

  // ─── Shared tab content (used by both desktop and mobile) ─────────
  const renderTabContent = () => (
    <Tabs value={activeTab}>
      <TabsContent value="profile" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="space-y-1">
          <h1 className={cn(mobileMode ? 'text-xl' : 'text-3xl', 'font-bold tracking-tight')}>Profile Details</h1>
          <p className="text-muted-foreground text-sm">Manage your identity on the platform.</p>
        </div>
        <div className="space-y-6">
          <div className="grid gap-2.5">
            <Label htmlFor="nickname" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Display Nickname</Label>
            <Input id="nickname" value={formData.nickname} onChange={(e) => setFormData({ ...formData, nickname: e.target.value })} placeholder="Your preferred name" className="h-12 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl" />
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="major" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Field of Study</Label>
            <Input id="major" value={formData.major} onChange={(e) => setFormData({ ...formData, major: e.target.value })} placeholder="e.g. Computer Science" className="h-12 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl" />
          </div>
          <div className="grid gap-2.5">
            <Label htmlFor="university" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">University Name</Label>
            <Input id="university" value={formData.university} onChange={(e) => setFormData({ ...formData, university: e.target.value })} placeholder="e.g. Stanford University" className="h-12 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl" />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preferences" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="space-y-1">
          <h1 className={cn(mobileMode ? 'text-xl' : 'text-3xl', 'font-bold tracking-tight')}>AI Preferences</h1>
          <p className="text-muted-foreground text-sm">Customize your study experience.</p>
        </div>
        <div className="space-y-6">
          <div className="grid gap-3">
            <Label htmlFor="tone" className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest px-1">Feedback Tone</Label>
            <Select value={formData.aiFeedbackTone} onValueChange={(value) => setFormData({ ...formData, aiFeedbackTone: value })}>
              <SelectTrigger className="h-12 bg-white/5 border-white/5 focus:border-indigo-500/50 rounded-xl"><SelectValue placeholder="Select a tone" /></SelectTrigger>
              <SelectContent className="bg-[#0a0a0b] border-white/10 rounded-xl">
                <SelectItem value="Encouraging" className="rounded-lg">Encouraging</SelectItem>
                <SelectItem value="Direct" className="rounded-lg">Direct</SelectItem>
                <SelectItem value="Academic" className="rounded-lg">Academic</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="notifications" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-2 duration-300 text-center py-20">
        <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/5">
          <Bell className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Coming Soon</h3>
          <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">We&apos;re working on notification preferences.</p>
        </div>
      </TabsContent>

      <TabsContent value="security" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="space-y-1">
          <h1 className={cn(mobileMode ? 'text-xl' : 'text-3xl', 'font-bold tracking-tight')}>Security</h1>
          <p className="text-muted-foreground text-sm">Manage your account credentials.</p>
        </div>
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Email Address</p>
                <p className="text-sm font-medium">{user?.email}</p>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Verified</div>
            </div>
          </div>
          <form onSubmit={handlePasswordUpdate} className="space-y-4 pt-2">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest px-1">Update Password</h3>
            <div className="grid gap-4">
              <div className="relative">
                <Input type={showPasswords ? "text" : "password"} placeholder="New Password" value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} className="h-12 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl pr-10" />
                <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                  {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Input type={showPasswords ? "text" : "password"} placeholder="Confirm New Password" value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} className="h-12 bg-white/5 border-white/5 focus-visible:ring-indigo-500/50 rounded-xl" />
              <Button type="submit" size="sm" disabled={loading || !passwordData.newPassword} className="w-fit bg-white/5 hover:bg-white/10 text-foreground border-white/5 rounded-xl h-9 px-6 font-bold">Update Password</Button>
            </div>
          </form>
        </div>
      </TabsContent>
    </Tabs>
  );

  // ─── Mobile layout: rendered inline inside MobileSheet ────────────
  if (mobileMode) {
    return (
      <div className="flex flex-col h-full">
        {/* Horizontal scrollable tab nav */}
        <div className="flex gap-1 px-4 py-3 overflow-x-auto no-scrollbar border-b border-white/[0.06]">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all shrink-0',
                activeTab === item.value
                  ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20'
                  : 'text-muted-foreground/60 bg-white/[0.03] border border-white/[0.06] active:bg-white/[0.08]'
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {renderTabContent()}
        </div>

        {/* Sticky bottom actions */}
        <div className="p-4 border-t border-white/[0.06] space-y-3" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 16px)' }}>
          <Button
            onClick={handleSubmit}
            disabled={loading || userLoading}
            className="w-full h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Save Changes
          </Button>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-rose-400/70 active:text-rose-400 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </button>
        </div>
      </div>
    );
  }

  // ─── Desktop layout: original Dialog wrapper ─────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[580px] p-0 overflow-hidden bg-background border-white/5 shadow-2xl rounded-2xl">
        <div className="sr-only">
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your profile details, AI preferences, and security settings.
          </DialogDescription>
        </div>

        <div className="flex h-full flex-col">
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-[240px] border-r border-white/5 p-4 flex flex-col pt-8 bg-white/[0.01]">
              <div className="flex items-center gap-3 px-3 mb-8">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center border border-indigo-500/20">
                  <Settings className="text-white w-5 h-5" />
                </div>
                <span className="text-lg font-bold tracking-tight">Settings</span>
              </div>
              <div className="flex-1 space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setActiveTab(item.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group text-sm font-medium",
                      activeTab === item.value 
                        ? "bg-indigo-600/10 text-indigo-400" 
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    <item.icon className={cn(
                      "w-5 h-5 transition-colors",
                      activeTab === item.value ? "text-indigo-400" : "group-hover:text-indigo-400"
                    )} />
                    {item.label}
                    {activeTab === item.value && (
                      <div className="ml-auto w-1 h-1 rounded-full bg-indigo-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-10">
              {renderTabContent()}
            </div>
          </div>

          {/* Unified Footer */}
          <div className="h-20 border-t border-white/5 flex items-center px-6 bg-white/[0.01]">
            <div className="w-[192px]">
              <button
                onClick={() => signOut()}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 transition-all text-sm font-medium text-rose-400/80 hover:text-rose-400 group"
              >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-rose-500/5 group-hover:bg-rose-500/10 transition-colors">
                  <LogOut className="w-3.5 h-3.5" />
                </div>
                Logout
              </button>
            </div>
            <div className="flex-1 flex justify-end gap-3 ml-4">
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)} className="h-10 px-6 rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-sm font-bold transition-all">Cancel</Button>
              <Button onClick={handleSubmit} disabled={loading || userLoading} className="h-10 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold transition-all flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
