export interface ToastItem {
  id: number
  type: 'success' | 'error'
  title: string
  message?: string
}

const items = ref<ToastItem[]>([])
let seq = 0

export function useToast() {
  function push(type: ToastItem['type'], title: string, message?: string) {
    const id = ++seq
    items.value.push({ id, type, title, message })
    setTimeout(() => dismiss(id), 4500)
  }
  function dismiss(id: number) {
    items.value = items.value.filter((t) => t.id !== id)
  }
  return {
    items,
    dismiss,
    success: (t: string, m?: string) => push('success', t, m),
    error: (t: string, m?: string) => push('error', t, m),
  }
}
