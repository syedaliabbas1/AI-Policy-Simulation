"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Streamdown } from "streamdown"
import { listDocuments, getDocument } from "@/lib/api"
import { IconChevronDown, IconChevronUp, IconFileText } from "@tabler/icons-react"

interface Doc {
  id: string
  title: string
  filename: string
  size: number
}

export default function LibraryPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [content, setContent] = useState<Record<string, string>>({})
  const [fetching, setFetching] = useState<string | null>(null)

  useEffect(() => {
    listDocuments()
      .then((d) => setDocs(d.documents))
      .finally(() => setLoading(false))
  }, [])

  async function toggle(id: string) {
    if (expanded === id) {
      setExpanded(null)
      return
    }
    setExpanded(id)
    if (!content[id]) {
      setFetching(id)
      try {
        const doc = await getDocument(id)
        setContent((prev) => ({ ...prev, [id]: doc.content }))
      } finally {
        setFetching(null)
      }
    }
  }

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "calc(var(--spacing) * 72)", "--header-height": "calc(var(--spacing) * 12)" } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader title="Data Library" />
        <div className="flex flex-1 flex-col gap-4 p-4 lg:p-6">
          {loading && <p className="text-sm text-muted-foreground">Loading documents...</p>}
          {docs.map((doc) => (
            <Card key={doc.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconFileText className="size-4 text-muted-foreground" />
                    <CardTitle className="text-base">{doc.title}</CardTitle>
                    <Badge variant="outline" className="font-mono text-xs">{doc.filename}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggle(doc.id)}
                  >
                    {expanded === doc.id ? <IconChevronUp className="size-4" /> : <IconChevronDown className="size-4" />}
                    {expanded === doc.id ? "Collapse" : "Read"}
                  </Button>
                </div>
              </CardHeader>
              {expanded === doc.id && (
                <CardContent>
                  {fetching === doc.id ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                  ) : (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                      <Streamdown>{content[doc.id] ?? ""}</Streamdown>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
