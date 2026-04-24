"use client"

import { useState, useEffect } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Play } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export default function ReelsPage() {
  const [reels, setReels] = useState<any[]>([])
  const [url, setUrl] = useState("")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [meta, setMeta] = useState<{ title: string, thumbnail_url: string } | null>(null)
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    fetchSession()
    fetchReels()
  }, [])

  const fetchSession = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) setUserId(session.user.id)
  }

  const fetchReels = async () => {
    const { data, error } = await supabase
      .from('reels')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (data) setReels(data)
  }

  const handleUrlBlur = async () => {
    if (!url) return
    setFetchingMeta(true)
    try {
      const res = await fetch('/api/reels/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (data.thumbnail_url) {
        setMeta({ title: data.title, thumbnail_url: data.thumbnail_url })
      }
    } catch (e) {
      console.error(e)
    } finally {
      setFetchingMeta(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url || !userId) return
    setLoading(true)
    
    // Fallback if blur didn't fetch meta
    let finalMeta = meta
    if (!finalMeta) {
       const res = await fetch('/api/reels/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })
      const data = await res.json()
      if (data.thumbnail_url) {
        finalMeta = { title: data.title, thumbnail_url: data.thumbnail_url }
      }
    }

    const { error } = await supabase.from('reels').insert({
      user_id: userId,
      original_url: url,
      thumbnail_url: finalMeta?.thumbnail_url || 'https://via.placeholder.com/400x600?text=Instagram+Reel',
      title: finalMeta?.title || 'Saved Reel',
      notes,
    })

    if (!error) {
      setOpen(false)
      setUrl("")
      setNotes("")
      setMeta(null)
      fetchReels()
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reels Vault</h1>
          <p className="text-neutral-500 mt-1">Save Instagram Reels without downloading. Quick access, zero storage cost.</p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>Save New Reel</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Save a Reel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input 
                  placeholder="Paste Instagram Reel Link here..." 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  required
                />
              </div>
              
              {fetchingMeta && <p className="text-xs text-neutral-500 animate-pulse">Fetching preview...</p>}
              
              {meta?.thumbnail_url && (
                <div className="relative h-40 w-full overflow-hidden rounded-md border">
                  <img src={meta.thumbnail_url} alt="preview" className="object-cover w-full h-full opacity-80" />
                  <div className="absolute inset-0 grid place-items-center bg-black/20">
                     <Play className="text-white size-10" />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Textarea 
                  placeholder="Add a quick note... (Why are you saving this?)" 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !userId}>
                {loading ? 'Saving...' : 'Save to Vault'}
              </Button>
              {!userId && <p className="text-xs text-red-500 text-center">Please login to save reels.</p>}
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {reels.map((reel) => (
          <a key={reel.id} href={reel.original_url} target="_blank" rel="noopener noreferrer" className="group block">
            <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group-hover:-translate-y-1">
              <div className="relative aspect-[9/16] bg-neutral-100">
                <img 
                  src={reel.thumbnail_url || 'https://via.placeholder.com/400x600?text=Instagram+Reel'} 
                  alt={reel.title || 'Reel'} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors grid place-items-center">
                  <Play className="text-white size-12 opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                </div>
              </div>
              <CardContent className="p-4 bg-white">
                <h3 className="line-clamp-2 text-sm font-medium mb-1" title={reel.title}>{reel.title || 'Instagram Reel'}</h3>
                {reel.notes && (
                  <p className="line-clamp-2 text-xs text-neutral-500 italic">"{reel.notes}"</p>
                )}
                <div className="mt-3 flex gap-2">
                  <Badge variant="secondary" className="text-[10px]">IG Reel</Badge>
                </div>
              </CardContent>
            </Card>
          </a>
        ))}
        {reels.length === 0 && (
          <div className="col-span-full py-20 text-center text-neutral-500 border-2 border-dashed rounded-xl">
            No reels saved yet. Click 'Save New Reel' to get started!
          </div>
        )}
      </div>
    </div>
  )
}
