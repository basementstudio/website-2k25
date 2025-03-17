import { Vector2 } from "three"
import { create } from "zustand"

interface ContactStore {
  isContactOpen: boolean
  isClosing: boolean
  setIsContactOpen: (isContactOpen: boolean) => void
  formData: {
    name: string
    company: string
    email: string
    budget: string
    message: string
  }
  focusedElement: string | null
  cursorPosition: number
  setFocusedElement: (elementId: string | null, cursorPos?: number) => void
  updateFormField: (
    field: keyof ContactStore["formData"],
    value: string
  ) => void
  clearFormData: () => void
  worker: Worker | null
  setWorker: (worker: Worker | null) => void
  screenPosition: Vector2 | null
  screenDimensions: Vector2 | null
  screenTransform: {
    scale: number
    distance: number
    matrix: number[]
    cameraMatrix: number[]
  } | null
  updateScreenData: (
    position: Vector2,
    dimensions: Vector2,
    transform: {
      scale: number
      distance: number
      matrix: number[]
      cameraMatrix: number[]
    }
  ) => void
}

export const useContactStore = create<ContactStore>((set) => ({
  isContactOpen: false,
  isClosing: false,
  setIsContactOpen: (isContactOpen) => {
    if (!isContactOpen) {
      if (window.location.hash === "#contact") {
        const targetPath = sessionStorage.getItem("pendingNavigation")

        window.history.pushState(
          null,
          "",
          window.location.pathname + window.location.search
        )

        if (targetPath && targetPath !== window.location.pathname) {
          setTimeout(() => {
            window.dispatchEvent(
              new CustomEvent("contactFormNavigate", {
                detail: { path: targetPath }
              })
            )
            sessionStorage.removeItem("pendingNavigation")
          }, 50)
        }
      }

      set((state) => {
        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: false,
            isClosing: true
          })
        }
        return { isClosing: true }
      })

      setTimeout(() => {
        set((state) => {
          if (state.worker) {
            state.worker.postMessage({
              type: "update-contact-open",
              isContactOpen: false,
              isClosing: false
            })
          }
          return { isContactOpen: false, isClosing: false }
        })
      }, 1000)
    } else {
      if (window.location.hash !== "#contact") {
        window.history.pushState(
          null,
          "",
          window.location.pathname + window.location.search + "#contact"
        )
      }

      set((state) => {
        if (state.worker) {
          state.worker.postMessage({
            type: "update-contact-open",
            isContactOpen: true,
            isClosing: false
          })
        }
        return { isContactOpen: true, isClosing: false }
      })
    }
  },
  formData: {
    name: "",
    company: "",
    email: "",
    budget: "",
    message: ""
  },
  focusedElement: null,
  cursorPosition: 0,
  setFocusedElement: (elementId, cursorPos = 0) =>
    set((state) => {
      if (state.worker) {
        state.worker.postMessage({
          type: "update-focus",
          focusedElement: elementId,
          cursorPosition: cursorPos
        })
      }
      return { focusedElement: elementId, cursorPosition: cursorPos }
    }),
  clearFormData: () =>
    set((state) => {
      const emptyFormData = {
        name: "",
        company: "",
        email: "",
        budget: "",
        message: ""
      }

      if (state.worker) {
        state.worker.postMessage({
          type: "update-form",
          formData: emptyFormData
        })
      }

      return { formData: emptyFormData }
    }),
  updateFormField: (field, value) =>
    set((state) => {
      const newFormData = {
        ...state.formData,
        [field]: value.toUpperCase()
      }

      // Send form updates to the worker
      if (state.worker) {
        state.worker.postMessage({
          type: "update-form",
          formData: newFormData
        })
      }

      return { formData: newFormData }
    }),
  worker: null,
  setWorker: (worker) => {
    if (worker) {
      worker.addEventListener("message", (e) => {
        if (e.data.type === "update-screen-data") {
          set({
            screenPosition: e.data.position,
            screenDimensions: e.data.dimensions,
            screenTransform: {
              scale: e.data.scale,
              distance: e.data.distance,
              matrix: e.data.matrix,
              cameraMatrix: e.data.cameraMatrix
            }
          })
        }
      })
    }
    set({ worker })
  },
  screenPosition: null,
  screenDimensions: null,
  screenTransform: null,
  updateScreenData: (position, dimensions, transform) =>
    set({
      screenPosition: position,
      screenDimensions: dimensions,
      screenTransform: transform
    })
}))
