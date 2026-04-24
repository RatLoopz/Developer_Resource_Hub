"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  Loader2, AlertCircle, Trash2, Edit2, ExternalLink,
  Users, Link2, Film, BarChart3, ArrowRight,
} from "lucide-react"

type TabId = "overview" | "links" | "reels" | "users"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [tab, setTab] = useState<TabId>("overview")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const [links, setLinks] = useState<any[]>([])
  const [reels, setReels] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])

  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; table: "links" | "reels" | "profiles" } | null>(null)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [editingReel, setEditingReel] = useState<any>(null)

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { router.push("/auth/login"); return }

        const { data: profile } = await supabase
          .from("profiles").select("role").eq("id", user.id).single()
        if (!profile || profile.role !== "admin") { router.push("/"); return }

        await Promise.all([fetchLinks(), fetchReels(), fetchUsers()])
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [supabase, router])

  const fetchLinks = async () => {
    const { data } = await supabase.from("links").select("*").order("created_at", { ascending: false })
    setLinks(data || [])
  }
  const fetchReels = async () => {
    const { data } = await supabase.from("reels").select("*").order("created_at", { ascending: false })
    setReels(data || [])
  }
  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
    setUsers(data || [])
  }

  // --- Link actions ---
  const handleStatusChange = async (linkId: string, status: string) => {
    setUpdating(linkId)
    await supabase.from("links").update({ status, updated_at: new Date().toISOString() }).eq("id", linkId)
    setLinks(prev => prev.map(l => l.id === linkId ? { ...l, status } : l))
    setUpdating(null)
  }

  const handleEditLinkSave = async () => {
    if (!editingLink) return
    setUpdating(editingLink.id)
    const { error } = await supabase.from("links").update({
      name: editingLink.name,
      url: editingLink.url,
      description: editingLink.description,
      categories: editingLink.categories,
      updated_at: new Date().toISOString(),
    }).eq("id", editingLink.id)
    if (!error) {
      setLinks(prev => prev.map(l => l.id === editingLink.id ? editingLink : l))
      setEditingLink(null)
    }
    setUpdating(null)
  }

  // --- Reel edit ---
  const handleEditReelSave = async () => {
    if (!editingReel) return
    setUpdating(editingReel.id)
    const { error } = await supabase.from("reels").update({
      title: editingReel.title,
      original_url: editingReel.original_url,
      notes: editingReel.notes,
      updated_at: new Date().toISOString(),
    }).eq("id", editingReel.id)
    if (!error) {
      setReels(prev => prev.map(r => r.id === editingReel.id ? editingReel : r))
      setEditingReel(null)
    }
    setUpdating(null)
  }

  // --- Shared delete ---
  const handleDelete = async () => {
    if (!deleteTarget) return
    setUpdating(deleteTarget.id)
    await supabase.from(deleteTarget.table).delete().eq("id", deleteTarget.id)
    if (deleteTarget.table === "links")    setLinks(prev  => prev.filter(l => l.id !== deleteTarget.id))
    if (deleteTarget.table === "reels")    setReels(prev  => prev.filter(r => r.id !== deleteTarget.id))
    if (deleteTarget.table === "profiles") setUsers(prev  => prev.filter(u => u.id !== deleteTarget.id))
    setDeleteTarget(null)
    setUpdating(null)
  }

  const stats = {
    total:   links.length,
    active:  links.filter(l => l.status === "active").length,
    broken:  links.filter(l => l.status === "broken").length,
    reels:   reels.length,
    members: users.length,
  }

  const TABS: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: "overview", label: "Overview", icon: <BarChart3 className="size-3.5" /> },
    { id: "links",    label: "Links",    icon: <Link2    className="size-3.5" />, count: links.length },
    { id: "reels",    label: "Reels",    icon: <Film     className="size-3.5" />, count: reels.length },
    { id: "users",    label: "Users",    icon: <Users    className="size-3.5" />, count: users.length },
  ]

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <SiteHeader />
        <div className="flex items-center justify-center py-32">
          <Loader2 className="h-5 w-5 animate-spin text-neutral-300" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white">
      <SiteHeader />

      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-sm font-semibold text-neutral-950 tracking-widest uppercase">Admin Panel</h1>
          <p className="text-sm text-neutral-400 mt-0.5">Manage all content and users</p>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 px-3 py-2.5 rounded-lg mb-6">
            <AlertCircle className="size-3.5 shrink-0" /> {error}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-neutral-100 mb-8">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium border-b-2 -mb-px transition-colors ${
                tab === t.id
                  ? "border-neutral-950 text-neutral-950"
                  : "border-transparent text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className="bg-neutral-100 text-neutral-500 rounded px-1.5 text-[10px] font-mono">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ────── OVERVIEW ────── */}
        {tab === "overview" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {/* Clickable stat cards */}
            {[
              { label: "Total Links",    value: stats.total,   color: "text-neutral-900", target: "links"    as TabId, sub: "All submitted resources"   },
              { label: "Active Links",   value: stats.active,  color: "text-green-700",   target: "links"    as TabId, sub: "Live and visible"           },
              { label: "Broken Links",   value: stats.broken,  color: "text-red-600",     target: "links"    as TabId, sub: "Needs review"               },
              { label: "Saved Reels",    value: stats.reels,   color: "text-neutral-900", target: "reels"    as TabId, sub: "Instagram reel links"       },
              { label: "Total Members",  value: stats.members, color: "text-neutral-900", target: "users"    as TabId, sub: "Registered accounts"        },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => setTab(s.target)}
                className="group text-left border border-neutral-200 rounded-xl p-5 hover:border-neutral-400 hover:shadow-sm transition-all duration-150"
              >
                <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
                <p className="text-xs font-medium text-neutral-700 mt-1">{s.label}</p>
                <p className="text-[11px] text-neutral-400 mt-0.5">{s.sub}</p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-neutral-400 group-hover:text-neutral-700 transition-colors">
                  View <ArrowRight className="size-3" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ────── LINKS ────── */}
        {tab === "links" && (
          <div className="space-y-2">
            {links.length === 0 ? (
              <p className="text-sm text-neutral-400 py-12 text-center">No links yet.</p>
            ) : links.map(link => (
              <div
                key={link.id}
                className="flex items-center gap-4 border border-neutral-200 rounded-xl px-4 py-3 hover:border-neutral-300 transition-colors"
              >
                <span className={`size-2 rounded-full shrink-0 ${
                  link.status === "active" ? "bg-green-500"
                  : link.status === "broken" ? "bg-red-400"
                  : "bg-neutral-300"
                }`} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 truncate">{link.name}</p>
                  <a
                    href={link.url} target="_blank" rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="text-[11px] text-neutral-400 hover:text-neutral-600 flex items-center gap-1 truncate"
                  >
                    {(() => { try { return new URL(link.url).hostname.replace("www.", "") } catch { return link.url } })()}
                    <ExternalLink className="size-2.5 shrink-0" />
                  </a>
                </div>

                <div className="hidden sm:flex gap-1 flex-wrap max-w-[180px]">
                  {(link.categories || []).slice(0, 2).map((c: string) => (
                    <Badge key={c} variant="secondary"
                      className="bg-neutral-100 text-neutral-500 border-0 text-[9px] px-1.5 py-0 rounded font-normal"
                    >{c}</Badge>
                  ))}
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleStatusChange(link.id, link.status === "active" ? "inactive" : "active")}
                    disabled={updating === link.id}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                      link.status === "active"
                        ? "bg-green-50 text-green-700 hover:bg-green-100"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                  >
                    {link.status === "active" ? "Active" : "Inactive"}
                  </button>
                  <button
                    onClick={() => handleStatusChange(link.id, link.status === "broken" ? "inactive" : "broken")}
                    disabled={updating === link.id}
                    className={`text-[10px] font-medium px-2.5 py-1 rounded-md transition-colors ${
                      link.status === "broken"
                        ? "bg-red-50 text-red-700 hover:bg-red-100"
                        : "bg-neutral-100 text-neutral-500 hover:bg-neutral-200"
                    }`}
                  >
                    Broken
                  </button>
                </div>

                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditingLink({ ...link })}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                  >
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTarget({ id: link.id, table: "links" })}
                    className="p-1.5 rounded-md text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ────── REELS ────── */}
        {tab === "reels" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {reels.length === 0 ? (
              <p className="col-span-full text-sm text-neutral-400 py-12 text-center">No reels saved.</p>
            ) : reels.map(reel => (
              <div
                key={reel.id}
                className="border border-neutral-200 rounded-xl overflow-hidden bg-white hover:border-neutral-300 transition-colors"
              >
                <div className="relative aspect-[9/16] bg-neutral-100">
                  {reel.thumbnail_url ? (
                    <img src={reel.thumbnail_url} alt={reel.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film className="size-8 text-neutral-300" />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-[11px] font-medium text-neutral-700 line-clamp-1">
                    {reel.title || "Untitled Reel"}
                  </p>
                  <p className="text-[10px] text-neutral-400 mt-0.5">
                    {new Date(reel.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingReel({ ...reel })}
                      className="flex-1 text-[10px] font-medium py-1 rounded-md bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1"
                    >
                      <Edit2 className="size-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteTarget({ id: reel.id, table: "reels" })}
                      className="flex-1 text-[10px] font-medium py-1 rounded-md bg-red-50 text-red-600 hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ────── USERS ────── */}
        {tab === "users" && (
          <div className="space-y-2">
            {users.length === 0 ? (
              <p className="text-sm text-neutral-400 py-12 text-center">No users found.</p>
            ) : users.map(u => (
              <div key={u.id} className="flex items-center gap-4 border border-neutral-200 rounded-xl px-4 py-3">
                {/* Avatar initials */}
                <div className="size-8 rounded-lg bg-neutral-950 text-white flex items-center justify-center text-xs font-semibold shrink-0 select-none">
                  {(u.full_name || u.email || "U").slice(0, 2).toUpperCase()}
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-800 truncate">{u.full_name || "—"}</p>
                  <p className="text-[11px] text-neutral-400 truncate">{u.email}</p>
                </div>

                {/* Joined date */}
                <span className="hidden sm:block text-[11px] text-neutral-400 shrink-0">
                  {new Date(u.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                </span>

                {/* Role badge — display-only, no toggle */}
                <span className={`text-[10px] font-medium px-2.5 py-1 rounded-md shrink-0 ${
                  u.role === "admin"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-neutral-100 text-neutral-500"
                }`}>
                  {u.role === "admin" ? "Admin" : "Member"}
                </span>

                {/* Delete user */}
                <button
                  onClick={() => setDeleteTarget({ id: u.id, table: "profiles" })}
                  disabled={u.role === "admin"}
                  title={u.role === "admin" ? "Cannot delete admin" : "Delete user"}
                  className="p-1.5 rounded-md text-neutral-300 hover:text-red-600 hover:bg-red-50 transition-colors disabled:pointer-events-none"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Delete confirm ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteTarget?.table === "profiles"
              ? "This will remove the user's profile. Their auth account may still exist."
              : "This action cannot be undone."}
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {updating ? <Loader2 className="size-3.5 animate-spin" /> : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Edit Link dialog ── */}
      <Dialog open={!!editingLink} onOpenChange={open => !open && setEditingLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4 mt-2">
              {[
                { label: "Name",        key: "name",        type: "input"    },
                { label: "URL",         key: "url",         type: "input"    },
                { label: "Description", key: "description", type: "textarea" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">
                    {field.label}
                  </label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={editingLink[field.key] ?? ""}
                      onChange={e => setEditingLink({ ...editingLink, [field.key]: e.target.value })}
                      rows={3} className="resize-none text-sm"
                    />
                  ) : (
                    <Input
                      value={editingLink[field.key] ?? ""}
                      onChange={e => setEditingLink({ ...editingLink, [field.key]: e.target.value })}
                      className="text-sm"
                    />
                  )}
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">
                  Categories (comma-separated)
                </label>
                <Input
                  value={(editingLink.categories || []).join(", ")}
                  onChange={e => setEditingLink({
                    ...editingLink,
                    categories: e.target.value.split(",").map((c: string) => c.trim()).filter(Boolean),
                  })}
                  placeholder="AI, Tools, Productivity"
                  className="text-sm"
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingLink(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditLinkSave} disabled={updating === editingLink?.id}
              className="bg-neutral-950 text-white hover:bg-neutral-800">
              {updating === editingLink?.id ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Reel dialog ── */}
      <Dialog open={!!editingReel} onOpenChange={open => !open && setEditingReel(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reel</DialogTitle>
          </DialogHeader>
          {editingReel && (
            <div className="space-y-4 mt-2">
              {/* Thumbnail preview */}
              {editingReel.thumbnail_url && (
                <div className="relative h-36 w-full overflow-hidden rounded-lg border border-neutral-200">
                  <img src={editingReel.thumbnail_url} alt="thumb" className="w-full h-full object-cover opacity-80" />
                </div>
              )}
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">Title</label>
                <Input
                  value={editingReel.title ?? ""}
                  onChange={e => setEditingReel({ ...editingReel, title: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">Instagram URL</label>
                <Input
                  value={editingReel.original_url ?? ""}
                  onChange={e => setEditingReel({ ...editingReel, original_url: e.target.value })}
                  className="text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600 mb-1.5 uppercase tracking-wide">Note</label>
                <Textarea
                  value={editingReel.notes ?? ""}
                  onChange={e => setEditingReel({ ...editingReel, notes: e.target.value })}
                  rows={2} className="resize-none text-sm"
                  placeholder="Optional note..."
                />
              </div>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" size="sm" onClick={() => setEditingReel(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditReelSave} disabled={updating === editingReel?.id}
              className="bg-neutral-950 text-white hover:bg-neutral-800">
              {updating === editingReel?.id ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
