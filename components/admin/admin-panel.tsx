"use client"

import { useMemo, useRef, useState } from "react"
import { useLinks, type LinkEntry } from "../links/links-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
} from "@/components/ui/command"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { ExternalLink, MoreHorizontal, Pencil, Plus, Trash } from 'lucide-react'

function normalizeUrl(input: string): string {
  let u = input.trim()
  if (!u) return ""
  if (!/^https?:\/\//i.test(u)) u = "https://" + u
  try {
    const url = new URL(u)
    return url.toString()
  } catch {
    return ""
  }
}

function isDuplicateNameOrUrl(
  entries: LinkEntry[],
  name: string,
  url: string,
  ignoreId?: string
): { nameExists: boolean; urlExists: boolean } {
  const nameLower = name.trim().toLowerCase()
  const urlLower = url.trim().toLowerCase()
  let nameExists = false
  let urlExists = false
  for (const e of entries) {
    if (ignoreId && e.id === ignoreId) continue
    if (e.name.trim().toLowerCase() === nameLower) nameExists = true
    if (e.url.trim().toLowerCase() === urlLower) urlExists = true
    if (nameExists && urlExists) break
  }
  return { nameExists, urlExists }
}

type EditorState = {
  id?: string
  name: string
  url: string
  description: string
  categories: string[]
  iconUrl?: string
  iconDataUrl?: string
}

const defaultEditor: EditorState = {
  name: "",
  url: "",
  description: "",
  categories: [],
  iconUrl: "",
  iconDataUrl: "",
}

export function AdminPanel() {
  const { state, addLink, updateLink, deleteLink, addCategory, renameCategory, deleteCategory, importJson, exportJson } =
    useLinks()
  const { toast } = useToast()

  const [open, setOpen] = useState(false)
  const [editor, setEditor] = useState<EditorState>(defaultEditor)
  const [catOpen, setCatOpen] = useState(false)
  const [newCategory, setNewCategory] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const onSubmit = () => {
    const name = editor.name.trim()
    let url = normalizeUrl(editor.url)
    const description = editor.description.trim().slice(0, 150)
    const categories = Array.from(new Set(editor.categories.map((c) => c.trim()).filter(Boolean)))
    const iconUrl = editor.iconDataUrl ? "" : (editor.iconUrl?.trim() || "")

    if (!name || !url) {
      toast({ title: "Missing or invalid fields", description: "Please provide a valid name and URL." })
      return
    }

    const { nameExists, urlExists } = isDuplicateNameOrUrl(
      state.entries,
      name,
      url,
      editor.id
    )
    if (nameExists || urlExists) {
      toast({
        title: "Potential duplicate",
        description:
          (nameExists ? "An entry with this name already exists. " : "") +
          (urlExists ? "An entry with this URL already exists." : ""),
      })
      // continue anyway, user can still save; remove return if you want to block
    }

    const payload = {
      name,
      url,
      description,
      categories,
      iconUrl: iconUrl || undefined,
      iconDataUrl: editor.iconDataUrl || undefined,
    }

    if (editor.id) {
      updateLink(editor.id, payload)
      toast({ title: "Updated", description: "Entry updated successfully." })
    } else {
      addLink(payload as Omit<LinkEntry, "id" | "createdAt" | "updatedAt">)
      toast({ title: "Added", description: "Entry added successfully." })
    }

    setOpen(false)
    setEditor(defaultEditor)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const startEdit = (e: LinkEntry) => {
    setEditor({
      id: e.id,
      name: e.name,
      url: e.url,
      description: e.description,
      categories: e.categories,
      iconUrl: e.iconUrl,
      iconDataUrl: e.iconDataUrl,
    })
    setOpen(true)
  }

  const onDelete = (id: string) => {
    const ok = window.confirm("Delete this entry? This cannot be undone.")
    if (!ok) return
    deleteLink(id)
    toast({ title: "Deleted", description: "Entry removed." })
  }

  const onIconUpload = async (file: File | null) => {
    if (!file) return
    const dataUrl = await fileToDataUrl(file)
    setEditor((prev) => ({ ...prev, iconDataUrl: dataUrl, iconUrl: "" }))
  }

  const categories = useMemo(() => state.categories, [state.categories])

  const onImportFile = async (file: File | null) => {
    if (!file) return
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      importJson(data)
      toast({ title: "Imported", description: "Data imported successfully." })
    } catch (err) {
      toast({ title: "Import failed", description: "Invalid JSON file." })
    }
  }

  const onExport = () => {
    const blob = new Blob([exportJson()], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "ai-links-hub.json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const onUseFavicon = () => {
    const norm = normalizeUrl(editor.url)
    if (!norm) {
      toast({ title: "Enter a valid URL first", description: "Provide a URL to derive the favicon." })
      return
    }
    const domain = new URL(norm).hostname
    const favicon = `https://www.google.com/s2/favicons?sz=64&domain=${domain}`
    setEditor((p) => ({ ...p, iconUrl: favicon, iconDataUrl: "" }))
  }

  const onTestLink = () => {
    const norm = normalizeUrl(editor.url)
    if (!norm) {
      toast({ title: "Invalid URL", description: "Please enter a valid URL to test." })
      return
    }
    window.open(norm, "_blank", "noopener,noreferrer")
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{'Admin'}</h1>
          <p className="text-sm text-neutral-600">{'Manage entries and categories. Changes are saved in your browser.'}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => onImportFile(e.target.files?.[0] ?? null)}
          />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
            {'Import JSON'}
          </Button>
          <Button variant="outline" onClick={onExport}>
            {'Export JSON'}
          </Button>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditor(defaultEditor) }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="size-4" />
                <span>{'Add Entry'}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editor.id ? "Edit Entry" : "Add Entry"}</DialogTitle>
              </DialogHeader>

              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{'Name'}</Label>
                  <Input
                    id="name"
                    placeholder="e.g., ChatGPT"
                    value={editor.name}
                    onChange={(e) => setEditor((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="url">{'URL'}</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      placeholder="https://example.com"
                      value={editor.url}
                      onChange={(e) => setEditor((p) => ({ ...p, url: e.target.value }))}
                    />
                    <Button type="button" variant="outline" onClick={onTestLink} title="Open in a new tab">
                      <ExternalLink className="size-4" />
                      <span className="sr-only">Test link</span>
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">{'Short description (~150 chars)'}</Label>
                  <Textarea
                    id="desc"
                    maxLength={150}
                    placeholder="What does this tool or site do?"
                    value={editor.description}
                    onChange={(e) => setEditor((p) => ({ ...p, description: e.target.value }))}
                  />
                  <p className="text-xs text-neutral-500">{`${editor.description.length}/150`}</p>
                </div>

                <div className="grid gap-2">
                  <Label>{'Categories'}</Label>
                  <Popover open={catOpen} onOpenChange={setCatOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="justify-between">
                        <span className="truncate">
                          {editor.categories.length > 0 ? editor.categories.join(", ") : "Select categories"}
                        </span>
                        <span className="ml-2 text-neutral-500">{'▼'}</span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-0 w-80">
                      <Command>
                        <CommandInput placeholder="Search categories..." />
                        <CommandList>
                          <CommandEmpty>{'No categories.'}</CommandEmpty>
                          <CommandGroup heading="Available">
                            {categories.map((c) => {
                              const isSelected = editor.categories.includes(c)
                              return (
                                <CommandItem
                                  key={c}
                                  onSelect={() =>
                                    setEditor((p) => ({
                                      ...p,
                                      categories: isSelected
                                        ? p.categories.filter((x) => x !== c)
                                        : [...p.categories, c],
                                    }))
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
                          <CommandGroup heading="Create new">
                            <div className="p-2 flex items-center gap-2">
                              <Input
                                placeholder="New category"
                                value={newCategory}
                                onChange={(e) => setNewCategory(e.target.value)}
                              />
                              <Button
                                onClick={() => {
                                  if (!newCategory.trim()) return
                                  addCategory(newCategory.trim())
                                  setEditor((p) => ({
                                    ...p,
                                    categories: Array.from(new Set([...p.categories, newCategory.trim()])),
                                  }))
                                  setNewCategory("")
                                }}
                              >
                                {'Add'}
                              </Button>
                            </div>
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <div className="flex flex-wrap gap-2">
                    {editor.categories.map((c) => (
                      <Badge key={c} variant="secondary" className="bg-neutral-100 text-neutral-800">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label>{'Icon'}</Label>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Icon image URL (optional)"
                          value={editor.iconUrl}
                          onChange={(e) => setEditor((p) => ({ ...p, iconUrl: e.target.value, iconDataUrl: "" }))}
                        />
                        <Button type="button" variant="outline" onClick={onUseFavicon}>
                          {'Use favicon'}
                        </Button>
                      </div>
                      <p className="text-xs text-neutral-500">
                        {'If both URL and upload are provided, the uploaded image is used.'}
                      </p>
                      {(editor.iconUrl && !editor.iconDataUrl) && (
                        <div className="flex items-center gap-2">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={editor.iconUrl || "/placeholder.svg"}
                            alt="Icon preview (URL)"
                            className="h-12 w-12 rounded-md object-cover ring-1 ring-neutral-200"
                            crossOrigin="anonymous"
                          />
                          <span className="text-xs text-neutral-600">{'Preview (URL)'}</span>
                        </div>
                      )}
                    </div>
                    <div className="grid gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onIconUpload(e.target.files?.[0] ?? null)}
                      />
                      {editor.iconDataUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={editor.iconDataUrl || "/placeholder.svg"}
                          alt="Uploaded icon preview"
                          className="h-12 w-12 rounded-md object-cover ring-1 ring-neutral-200"
                          crossOrigin="anonymous"
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setEditor(defaultEditor)
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  {'Reset'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>{'Cancel'}</Button>
                <Button type="button" onClick={onSubmit}>{editor.id ? "Save changes" : "Add entry"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{'Entries'}</CardTitle>
            <CardDescription>{`Total: ${state.entries.length}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <EntriesTable onEdit={startEdit} onDelete={onDelete} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{'Categories'}</CardTitle>
            <CardDescription>{`Total: ${state.categories.length}`}</CardDescription>
          </CardHeader>
          <CardContent>
            <CategoriesManager
              categories={state.categories}
              onRename={renameCategory}
              onDelete={deleteCategory}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EntriesTable({ onEdit, onDelete }: { onEdit: (e: LinkEntry) => void; onDelete: (id: string) => void }) {
  const { state } = useLinks()
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-600">
            <th className="py-2 pr-2">{'Name'}</th>
            <th className="py-2 pr-2">{'URL'}</th>
            <th className="py-2 pr-2">{'Categories'}</th>
            <th className="py-2 pr-2 text-right">{'Actions'}</th>
          </tr>
        </thead>
        <tbody>
          {state.entries.map((e) => (
            <tr key={e.id} className="border-t">
              <td className="py-2 pr-2">{e.name}</td>
              <td className="py-2 pr-2 truncate max-w-[240px]">
                <a href={e.url} target="_blank" rel="noopener noreferrer" className="underline">
                  {e.url}
                </a>
              </td>
              <td className="py-2 pr-2">
                <div className="flex flex-wrap gap-1">
                  {e.categories.map((c) => (
                    <Badge key={c} variant="secondary" className="bg-neutral-100 text-neutral-800">
                      {c}
                    </Badge>
                  ))}
                </div>
              </td>
              <td className="py-2 pr-2">
                <div className="flex items-center justify-end">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="size-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onEdit(e)}>
                        <Pencil className="mr-2 size-4" />
                        <span>{'Edit'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete(e.id)}
                      >
                        <Trash className="mr-2 size-4" />
                        <span>{'Delete'}</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </td>
            </tr>
          ))}
          {state.entries.length === 0 && (
            <tr>
              <td className="py-4 text-neutral-600" colSpan={4}>
                {'No entries. Use "Add Entry" to create one.'}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function CategoriesManager({
  categories,
  onRename,
  onDelete,
}: {
  categories: string[]
  onRename: (oldName: string, newName: string) => void
  onDelete: (name: string) => void
}) {
  const [editing, setEditing] = useState<string | null>(null)
  const [value, setValue] = useState<string>("")

  return (
    <div className="space-y-2">
      {categories.map((c) => (
        <div key={c} className="flex items-center justify-between gap-2 border rounded-md p-2">
          {editing === c ? (
            <div className="flex-1 flex items-center gap-2">
              <Input value={value} onChange={(e) => setValue(e.target.value)} />
              <Button
                size="sm"
                onClick={() => {
                  if (value.trim()) onRename(c, value.trim())
                  setEditing(null)
                }}
              >
                {'Save'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                {'Cancel'}
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1">{c}</div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setEditing(c)
                    setValue(c)
                  }}
                >
                  {'Rename'}
                </Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(c)}>
                  {'Delete'}
                </Button>
              </div>
            </>
          )}
        </div>
      ))}
      {categories.length === 0 && (
        <p className="text-sm text-neutral-600">{'No categories yet. Add some from the entry dialog.'}</p>
      )}
    </div>
  )
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
