"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { SiteHeader } from "@/components/site-header"
import { LinksProvider } from "@/components/links/links-provider"
import { LinksGrid } from "@/components/links/links-grid"
import { FiltersBar } from "@/components/filters-bar"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error("Error fetching user:", error)
      } finally {
        setLoading(false)
      }
    }

    getUser()
  }, [supabase])

  return (
    <main className="min-h-screen bg-neutral-50">
      <SiteHeader />
      <LinksProvider>
        <section className="container mx-auto px-4 py-6 md:py-10">
          <div className="flex items-center justify-between gap-3 mb-6">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">AI Tools & Useful Links</h1>
            {user && (
              <Button onClick={() => router.push("/submit-link")} variant="default">
                Submit Link
              </Button>
            )}
          </div>
          <FiltersBar />
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-400" />
              </div>
            ) : (
              <LinksGrid />
            )}
          </div>
        </section>
      </LinksProvider>
    </main>
  )
}
