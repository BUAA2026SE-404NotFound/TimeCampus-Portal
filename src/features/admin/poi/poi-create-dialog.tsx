import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export type PoiFormState = {
  name: string
  latitude: string
  longitude: string
  description: string
}

export function PoiCreateDialog({
  open,
  form,
  onOpenChange,
  onFormChange,
  onSubmit,
  submitting,
}: {
  open: boolean
  form: PoiFormState
  onOpenChange: (open: boolean) => void
  onFormChange: (form: PoiFormState) => void
  onSubmit: () => void
  submitting?: boolean
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-none font-mono" disabled={submitting}>
          <Plus data-icon="inline-start" />
          新增 POI
        </Button>
      </DialogTrigger>
      <DialogContent className="rounded-none font-mono sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新增 POI</DialogTitle>
          <DialogDescription>提交到 POST /api/v1/admin/pois。</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="poi-name">名称</FieldLabel>
            <Input
              id="poi-name"
              value={form.name}
              onChange={(event) =>
                onFormChange({ ...form, name: event.target.value })
              }
              className="rounded-none"
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="poi-lat">纬度</FieldLabel>
              <Input
                id="poi-lat"
                value={form.latitude}
                onChange={(event) =>
                  onFormChange({ ...form, latitude: event.target.value })
                }
                className="rounded-none"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="poi-lng">经度</FieldLabel>
              <Input
                id="poi-lng"
                value={form.longitude}
                onChange={(event) =>
                  onFormChange({ ...form, longitude: event.target.value })
                }
                className="rounded-none"
              />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="poi-description">简介</FieldLabel>
            <Input
              id="poi-description"
              value={form.description}
              onChange={(event) =>
                onFormChange({ ...form, description: event.target.value })
              }
              className="rounded-none"
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <Button
            className="rounded-none font-mono"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "保存中" : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
