import { useState } from "react"
import type {
  DocumentActionComponent,
  DocumentActionDialogProps,
  DocumentActionProps
} from "sanity"

// Wraps the default publish action in a critical confirm dialog so editors get
// a deliberate warning before changes go live. Intended for production only —
// see sanity.config.ts, where the wrap is applied behind a NODE_ENV check.
export function createConfirmPublishAction(
  originalPublishAction: DocumentActionComponent
): DocumentActionComponent {
  const ConfirmPublishAction = (props: DocumentActionProps) => {
    const original = originalPublishAction(props)
    const [dialogOpen, setDialogOpen] = useState(false)

    if (!original) return null

    const { dialog: _originalDialog, ...originalWithoutDialog } = original
    const dialog: DocumentActionDialogProps | false = dialogOpen
      ? {
          type: "confirm",
          tone: "critical",
          message:
            "This will make these changes live on the production site immediately. Continue?",
          onCancel: () => setDialogOpen(false),
          onConfirm: () => {
            setDialogOpen(false)
            original.onHandle?.()
          }
        }
      : false

    return {
      ...originalWithoutDialog,
      onHandle: () => setDialogOpen(true),
      dialog
    }
  }

  return ConfirmPublishAction
}
