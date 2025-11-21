"use client"

import Link from "next/link"
import { useState } from "react"
import { ExternalLink, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useLinks } from "./links-provider"
import { createClient } from "@/lib/supabase/client"
import type { LinkEntry } from "./links-provider"

type Props = {
  item?: LinkEntry
  isOwner?: boolean
  isAdmin?: boolean
}

export function LinkCard({ item, isOwner = false, isAdmin = false }: Props) {
  const supabase = createClient()
  const { deleteLink } = useLinks()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const entry: LinkEntry = item ?? {
    id: "demo",
    user_id: "demo",
    name: "Example Tool",
    url: "https://example.com",
    description: "A short description about this AI tool or useful website.",
    categories: ["AI Chat"],
    icon_url: "/placeholder.svg?height=64&width=64",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  const iconSrc = entry.icon_data_url || entry.icon_url || "/placeholder.svg?height=64&width=64"

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteLink(entry.id)
      setShowDeleteDialog(false)
    } catch (error) {
      console.error("Error deleting link:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card className="h-full hover:shadow-md transition-shadow relative">
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="relative size-10 rounded-md overflow-hidden bg-neutral-100 ring-1 ring-neutral-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={iconSrc || "/placeholder.svg"}
              alt={`${entry.name} logo`}
              className="size-full object-cover"
              crossOrigin="anonymous"
            />
          </div>
          <CardTitle className="text-base font-semibold flex-1">{entry.name}</CardTitle>
          {(isOwner || isAdmin) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDeleteDialog(true)}
              disabled={isDeleting}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-neutral-600 line-clamp-3">{entry.description}</p>
          <div className="flex flex-wrap gap-2">
            {entry.categories.map((c) => (
              <Badge key={c} variant="secondary" className="bg-neutral-100 text-neutral-800">
                {c}
              </Badge>
            ))}
          </div>
          <div className="pt-1">
            <Link
              href={entry.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-medium text-neutral-800 hover:text-neutral-950"
            >
              <ExternalLink className="size-4" />
              <span>{"Visit site"}</span>
            </Link>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Link</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{entry.name}"? This action cannot be undone.
          </AlertDialogDescription>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
