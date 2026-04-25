"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { IconPlus, IconX } from "@tabler/icons-react"

interface RunSelectorProps {
  selected: string[]
  onChange: (runs: string[]) => void
  availableRuns?: string[]
}

export function RunSelector({ selected, onChange }: RunSelectorProps) {
  const [inputValue, setInputValue] = useState("")

  const handleAdd = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !selected.includes(trimmed)) {
      onChange([...selected, trimmed])
      setInputValue("")
    }
  }

  const handleRemove = (id: string) => {
    onChange(selected.filter((r) => r !== id))
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Paste a run ID to compare..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={!inputValue.trim()}>
            <IconPlus data-icon="inline-start" />
            Add
          </Button>
        </div>
        {selected.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selected.map((id) => (
              <div
                key={id}
                className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
              >
                <span className="font-mono text-xs">{id.slice(0, 8)}</span>
                <button
                  onClick={() => handleRemove(id)}
                  className="ml-1 text-muted-foreground hover:text-foreground"
                >
                  <IconX className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {selected.length < 2 && (
          <p className="text-sm text-muted-foreground">
            Add at least 2 run IDs to compare
          </p>
        )}
      </CardContent>
    </Card>
  )
}
