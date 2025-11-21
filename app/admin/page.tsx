"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, Trash2, CheckCircle2, XCircle, Edit2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [links, setLinks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [editingLink, setEditingLink] = useState<any>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    const checkAdminAndLoadLinks = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) {
          router.push("/auth/login")
          return
        }

        setUser(user)

        // Check if user is admin
        const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()

        if (!profileData || profileData.role !== "admin") {
          router.push("/")
          return
        }

        setProfile(profileData)

        // Load all links (admin can see all)
        const { data: linksData, error: linksError } = await supabase
          .from("links")
          .select("*")
          .order("created_at", { ascending: false })

        if (linksError) throw linksError
        setLinks(linksData || [])
      } catch (err: any) {
        setError(err.message || "Failed to load admin data")
      } finally {
        setLoading(false)
      }
    }

    checkAdminAndLoadLinks()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("admin_links_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
        },
        () => {
          checkAdminAndLoadLinks()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  const handleStatusChange = async (linkId: string, newStatus: "active" | "inactive" | "broken") => {
    setUpdating(linkId)
    try {
      const { error } = await supabase
        .from("links")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", linkId)

      if (error) throw error

      setLinks((prev) => prev.map((link) => (link.id === linkId ? { ...link, status: newStatus } : link)))
    } catch (err: any) {
      setError(err.message || "Failed to update link status")
    } finally {
      setUpdating(null)
    }
  }

  const handleEditLink = async () => {
    if (!editingLink) return

    setUpdating(editingLink.id)
    try {
      const { error } = await supabase
        .from("links")
        .update({
          name: editingLink.name,
          url: editingLink.url,
          description: editingLink.description,
          categories: editingLink.categories,
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingLink.id)

      if (error) throw error

      setLinks((prev) => prev.map((link) => (link.id === editingLink.id ? editingLink : link)))
      setEditingLink(null)
    } catch (err: any) {
      setError(err.message || "Failed to update link")
    } finally {
      setUpdating(null)
    }
  }

  const handleDeleteLink = async () => {
    if (!deleteId) return

    setUpdating(deleteId)
    try {
      const { error } = await supabase.from("links").delete().eq("id", deleteId)

      if (error) throw error

      setLinks((prev) => prev.filter((link) => link.id !== deleteId))
      setDeleteId(null)
    } catch (err: any) {
      setError(err.message || "Failed to delete link")
    } finally {
      setUpdating(null)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <SiteHeader />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <SiteHeader />
      <section className="container mx-auto px-4 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold tracking-tight mb-2">Admin Dashboard</h1>
          <p className="text-neutral-600">Manage all links and their status</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle>All Links</CardTitle>
            <CardDescription>Total: {links.length} links</CardDescription>
          </CardHeader>
          <CardContent>
            {links.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No links yet</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>URL</TableHead>
                      <TableHead>Submitted By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Categories</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {links.map((link) => (
                      <TableRow key={link.id}>
                        <TableCell className="font-medium">{link.name}</TableCell>
                        <TableCell>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline truncate max-w-xs block"
                          >
                            {link.url}
                          </a>
                        </TableCell>
                        <TableCell className="text-sm text-neutral-600">{link.user_id.slice(0, 8)}...</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant={link.status === "active" ? "default" : "outline"}
                              onClick={() => handleStatusChange(link.id, "active")}
                              disabled={updating === link.id}
                            >
                              {link.status === "active" && <CheckCircle2 className="h-4 w-4 mr-1" />}
                              Active
                            </Button>
                            <Button
                              size="sm"
                              variant={link.status === "broken" ? "destructive" : "outline"}
                              onClick={() => handleStatusChange(link.id, "broken")}
                              disabled={updating === link.id}
                            >
                              {link.status === "broken" && <XCircle className="h-4 w-4 mr-1" />}
                              Broken
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {(link.categories || []).map((cat: string) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingLink({ ...link })}
                              disabled={updating === link.id}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setDeleteId(link.id)}
                              disabled={updating === link.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Link</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this link? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLink} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!editingLink} onOpenChange={(open) => !open && setEditingLink(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
            <DialogDescription>Update the link details</DialogDescription>
          </DialogHeader>
          {editingLink && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={editingLink.name}
                  onChange={(e) => setEditingLink({ ...editingLink, name: e.target.value })}
                  placeholder="Link name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  value={editingLink.url}
                  onChange={(e) => setEditingLink({ ...editingLink, url: e.target.value })}
                  placeholder="https://example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  value={editingLink.description}
                  onChange={(e) => setEditingLink({ ...editingLink, description: e.target.value })}
                  placeholder="Short description"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Categories (comma-separated)</label>
                <Input
                  value={editingLink.categories.join(", ")}
                  onChange={(e) =>
                    setEditingLink({
                      ...editingLink,
                      categories: e.target.value
                        .split(",")
                        .map((c) => c.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="AI, Tools, Productivity"
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLink(null)}>
              Cancel
            </Button>
            <Button onClick={handleEditLink} disabled={updating === editingLink?.id}>
              {updating === editingLink?.id ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  )
}
