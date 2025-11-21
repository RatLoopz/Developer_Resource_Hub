"use client"

import Link from "next/link"
import { UserMenu } from "@/components/auth/user-menu"

export function SiteHeader() {
  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4 h-14 md:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="size-7 rounded-md bg-neutral-900 text-white grid place-items-center text-xs font-bold">
            {"AI"}
          </div>
          <span className="font-semibold tracking-tight">{"Links Hub"}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link className="text-neutral-700 hover:text-neutral-900" href="/">
            {"Home"}
          </Link>
          <UserMenu />
        </nav>
      </div>
    </header>
  )
}
