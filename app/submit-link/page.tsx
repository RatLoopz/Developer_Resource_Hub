"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useLinks } from "@/components/links/links-provider"
import { LinksProvider } from "@/components/links/links-provider"
import { SiteHeader } from "@/components/site-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertCircle, CheckCircle2, X } from "lucide-react"

function SubmitLinkForm() {
  const router = useRouter()
  const supabase = createClient()
  const { state, addLink, addCategory } = useLinks()
  const [user, setUser] = useState<any>(null)
  const [name, setName] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [newCategory, setNewCategory] = useState("")
  const [iconUrl, setIconUrl] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push("/auth/login")
          return
        }
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
        router.push("/auth/login")
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase, router])

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory)
      setSelectedCategories([...selectedCategories, newCategory])
      setNewCategory("")
    }
  }

  const handleToggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSubmitting(true)

    try {
      if (!name.trim() || !url.trim()) {
        setError("Name and URL are required")
        return
      }

      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        setError("URL must start with http:// or https://")
        return
      }

      if (description.length > 150) {
        setError("Description must be 150 characters or less")
        return
      }

      await addLink({
        name: name.trim(),
        url: url.trim(),
        description: description.trim(),
        categories: selectedCategories,
        icon_url: iconUrl.trim() || undefined,
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (err: any) {
      setError(err.message || "Failed to submit link")
    } finally {
      setSubmitting(false)
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

  if (success) {
    return (
      <main className="min-h-screen bg-neutral-50">
        <SiteHeader />
        <section className="container mx-auto px-4 py-10">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
                <h2 className="text-xl font-semibold">Link submitted successfully!</h2>
                <p className="text-neutral-600">Your link has been added and is now visible to all users.</p>
                <p className="text-sm text-neutral-500">Redirecting to home...</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    )
  }

  return (
    <section className="container mx-auto px-4 py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Submit a Link</CardTitle>
          <CardDescription>Share a useful AI tool or website with the community</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Website Name *
              </label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., ChatGPT"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="url" className="text-sm font-medium">
                URL *
              </label>
              <Input
                id="url"
                type="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description (max 150 characters)
              </label>
              <Textarea
                id="description"
                placeholder="Brief description of the tool..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 150))}
                disabled={submitting}
                rows={3}
              />
              <p className="text-xs text-neutral-500">{description.length}/150</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="iconUrl" className="text-sm font-medium">
                Icon URL (optional)
              </label>
              <Input
                id="iconUrl"
                type="url"
                placeholder="https://example.com/icon.png"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                disabled={submitting}
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Categories</label>
              <div className="flex flex-wrap gap-2">
                {state.categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategories.includes(category) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleToggleCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Add new category..."
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddCategory()
                    }
                  }}
                  disabled={submitting}
                />
                <Button type="button" variant="outline" onClick={handleAddCategory} disabled={submitting}>
                  Add
                </Button>
              </div>

              {selectedCategories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedCategories.map((category) => (
                    <Badge key={category} variant="secondary" className="flex items-center gap-1">
                      {category}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => handleToggleCategory(category)} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {submitting ? "Submitting..." : "Submit Link"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </section>
  )
}

export default function SubmitLinkPage() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <SiteHeader />
      <LinksProvider>
        <SubmitLinkForm />
      </LinksProvider>
    </main>
  )
}
