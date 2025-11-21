"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"
import { createClient } from "@/lib/supabase/client"

export type LinkEntry = {
  id: string
  user_id: string
  name: string
  url: string
  description: string
  categories: string[]
  icon_url?: string
  icon_data_url?: string
  status: "active" | "inactive" | "broken"
  created_at: string
  updated_at: string
}

export type LinksState = {
  entries: LinkEntry[]
  categories: string[]
}

type LinksContextType = {
  state: LinksState
  addLink: (input: Omit<LinkEntry, "id" | "user_id" | "created_at" | "updated_at" | "status">) => Promise<void>
  updateLink: (id: string, patch: Partial<LinkEntry>) => Promise<void>
  deleteLink: (id: string) => Promise<void>
  addCategory: (name: string) => void
  renameCategory: (oldName: string, newName: string) => void
  deleteCategory: (name: string) => void
  loading: boolean
}

const LinksContext = createContext<LinksContextType | null>(null)

export function LinksProvider({ children }: { children: ReactNode }) {
  const supabase = createClient()
  const [state, setState] = useState<LinksState>({ entries: [], categories: [] })
  const [loading, setLoading] = useState(true)

  // Load links from Supabase
  useEffect(() => {
    const loadLinks = async () => {
      try {
        setLoading(true)

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error("[v0] Missing Supabase environment variables")
          setLoading(false)
          return
        }

        let user = null
        let retries = 0
        const maxRetries = 3

        while (retries < maxRetries) {
          try {
            const {
              data: { user: authUser },
              error: authError,
            } = await supabase.auth.getUser()

            if (!authError) {
              user = authUser
              break
            }

            retries++
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          } catch (error) {
            retries++
            if (retries < maxRetries) {
              await new Promise((resolve) => setTimeout(resolve, 100))
            }
          }
        }

        let query = supabase.from("links").select("*")

        if (user?.id) {
          // User is authenticated: show active links OR user's own links
          // Use parentheses for proper OR grouping
          query = query.or(`(status.eq.active,user_id.eq.${user.id})`)
        } else {
          // User is not authenticated: show only active links
          query = query.eq("status", "active")
        }

        const { data: links, error } = await query.order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Supabase error:", error.message, error.code)
          setLoading(false)
          return
        }

        // Extract unique categories
        const categories = Array.from(
          new Set((links || []).flatMap((link) => link.categories || []).filter(Boolean)),
        ).sort()

        setState({
          entries: links || [],
          categories,
        })
      } catch (error) {
        console.error("[v0] Error loading links:", error instanceof Error ? error.message : String(error))
      } finally {
        setLoading(false)
      }
    }

    loadLinks()

    // Subscribe to real-time updates
    const subscription = supabase
      .channel("links_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "links",
        },
        () => {
          loadLinks()
        },
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const addLink = useCallback(
    async (input: Omit<LinkEntry, "id" | "user_id" | "created_at" | "updated_at" | "status">) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (!user) throw new Error("User not authenticated")

        const { error } = await supabase.from("links").insert({
          user_id: user.id,
          ...input,
          status: "active",
        })

        if (error) throw error
      } catch (error) {
        console.error("[v0] Error adding link:", error)
        throw error
      }
    },
    [supabase],
  )

  const updateLink = useCallback(
    async (id: string, patch: Partial<LinkEntry>) => {
      try {
        const { error } = await supabase
          .from("links")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", id)

        if (error) throw error
      } catch (error) {
        console.error("[v0] Error updating link:", error)
        throw error
      }
    },
    [supabase],
  )

  const deleteLink = useCallback(
    async (id: string) => {
      try {
        const { error } = await supabase.from("links").delete().eq("id", id)

        if (error) throw error
      } catch (error) {
        console.error("[v0] Error deleting link:", error)
        throw error
      }
    },
    [supabase],
  )

  const addCategory = useCallback((name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    setState((prev) => {
      if (prev.categories.includes(trimmed)) return prev
      return { ...prev, categories: [...prev.categories, trimmed].sort((a, b) => a.localeCompare(b)) }
    })
  }, [])

  const renameCategory = useCallback((oldName: string, newName: string) => {
    const trimmed = newName.trim()
    if (!trimmed) return
    setState((prev) => {
      const categories = prev.categories.map((c) => (c === oldName ? trimmed : c))
      const entries = prev.entries.map((e) => ({
        ...e,
        categories: e.categories.map((c) => (c === oldName ? trimmed : c)),
      }))
      return { entries, categories }
    })
  }, [])

  const deleteCategory = useCallback((name: string) => {
    setState((prev) => {
      const categories = prev.categories.filter((c) => c !== name)
      const entries = prev.entries.map((e) => ({
        ...e,
        categories: e.categories.filter((c) => c !== name),
      }))
      return { entries, categories }
    })
  }, [])

  const ctxValue = useMemo<LinksContextType>(
    () => ({
      state,
      addLink,
      updateLink,
      deleteLink,
      addCategory,
      renameCategory,
      deleteCategory,
      loading,
    }),
    [state, addLink, updateLink, deleteLink, addCategory, renameCategory, deleteCategory, loading],
  )

  return <LinksContext.Provider value={ctxValue}>{children}</LinksContext.Provider>
}

export function useLinks() {
  const ctx = useContext(LinksContext)
  if (!ctx) throw new Error("useLinks must be used within LinksProvider")
  return ctx
}
