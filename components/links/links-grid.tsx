"use client"

import { useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useLinks } from "./links-provider"
import { LinkCard } from "./link-card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Rocket } from "lucide-react"

export function LinksGrid() {
  const supabase = createClient()
  const { state } = useLinks()
  const [search, setSearch] = useState<string>("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [matchMode, setMatchMode] = useState<"any" | "all">("all")
  const [isAdmin, setIsAdmin] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    // Check if user is admin and get current user ID
    const checkAdmin = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          setCurrentUserId(user.id)
          const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
          setIsAdmin(profile?.role === "admin")
        }
      } catch (error) {
        console.error("Error checking admin status:", error)
      }
    }

    checkAdmin()
  }, [supabase])

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as unknown as CustomEvent).detail as {
        search: string
        categories: string[]
        matchMode: "any" | "all"
      }
      setSearch(detail.search)
      setSelectedCategories(detail.categories)
      setMatchMode(detail.matchMode)
    }
    window.addEventListener("aihub:filters", handler as unknown as EventListener)
    return () => {
      window.removeEventListener("aihub:filters", handler as unknown as EventListener)
    }
  }, [])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return state.entries
      .filter((e) => {
        if (!isAdmin && e.status === "broken") return false
        return true
      })
      .filter((e) => {
        const matchesText =
          !q ||
          e.name.toLowerCase().includes(q) ||
          e.description.toLowerCase().includes(q) ||
          e.categories.some((c) => c.toLowerCase().includes(q))
        const matchesCats =
          selectedCategories.length === 0
            ? true
            : matchMode === "all"
              ? selectedCategories.every((c) => e.categories.includes(c))
              : selectedCategories.some((c) => e.categories.includes(c))
        return matchesText && matchesCats
      })
  }, [state.entries, search, selectedCategories, matchMode, isAdmin])

  if (state.entries.length === 0) {
    return (
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertTitle>{"Get started"}</AlertTitle>
        <AlertDescription>{"No entries yet. Sign in and submit your first link!"}</AlertDescription>
      </Alert>
    )
  }

  if (filtered.length === 0) {
    return (
      <Alert>
        <AlertTitle>{"No results"}</AlertTitle>
        <AlertDescription>{"Try adjusting your search or category filters."}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {filtered.map((item) => (
        <LinkCard key={item.id} item={item} isOwner={currentUserId === item.user_id} isAdmin={isAdmin} />
      ))}
    </div>
  )
}
