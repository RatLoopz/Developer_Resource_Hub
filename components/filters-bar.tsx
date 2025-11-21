"use client"

import { useEffect, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command"
import { ChevronDown, Filter, Search } from 'lucide-react'
import { useLinks } from "./links/links-provider"

type MatchMode = "any" | "all"

export function FiltersBar() {
  const { state } = useLinks()
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string[]>([])
  const [open, setOpen] = useState(false)
  const [matchMode, setMatchMode] = useState<MatchMode>("all")

  const categories = useMemo(() => state.categories, [state.categories])

  // Broadcast to grid
  useEffect(() => {
    if (typeof window !== "undefined") {
      const event = new CustomEvent("aihub:filters", {
        detail: { search, categories: selected, matchMode },
      })
      window.dispatchEvent(event)
    }
  }, [search, selected, matchMode])

  return (
    <div className="w-full rounded-lg border bg-white p-3 md:p-4">
      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-500" />
          <Input
            placeholder="Search by name, description, or category"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="size-4" />
                <span>{'Categories'}</span>
                <ChevronDown className="size-4 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="p-0 w-72" align="start">
              <Command>
                <CommandInput placeholder="Filter categories..." />
                <CommandList>
                  <CommandEmpty>{'No categories found.'}</CommandEmpty>
                  <CommandGroup heading="Select categories">
                    {categories.map((c) => {
                      const isSelected = selected.includes(c)
                      return (
                        <CommandItem
                          key={c}
                          onSelect={() =>
                            setSelected((prev) =>
                              prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
                            )
                          }
                        >
                          <div
                            className={`mr-2 size-4 rounded-sm border ${
                              isSelected ? "bg-neutral-900" : "bg-white"
                            }`}
                          />
                          <span>{c}</span>
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup heading="Match mode">
                    {(["all", "any"] as MatchMode[]).map((m) => (
                      <CommandItem key={m} onSelect={() => setMatchMode(m)}>
                        <div
                          className={`mr-2 size-4 rounded-full border ${
                            matchMode === m ? "bg-neutral-900" : "bg-white"
                          }`}
                        />
                        <span>{m === "all" ? "Must include all" : "Include any"}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Button variant="ghost" onClick={() => { setSearch(""); setSelected([]); setMatchMode("all") }}>
            {'Clear'}
          </Button>
        </div>
      </div>
      {selected.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selected.map((c) => (
            <Badge key={c} variant="secondary" className="bg-neutral-100 text-neutral-800">
              {c}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
