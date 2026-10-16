import { useEffect, useMemo, useRef } from 'react'
import { Color } from '@tiptap/extension-color'
import Highlight from '@tiptap/extension-highlight'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Typography from '@tiptap/extension-typography'
import Underline from '@tiptap/extension-underline'
import { EditorContent, type Extension, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { cn } from '@/lib/utils'
import { TipTapFloatingMenu } from '@/components/tiptap/extensions/floating-menu'
import { FloatingToolbar } from '@/components/tiptap/extensions/floating-toolbar'
import { ImageExtension } from '@/components/tiptap/extensions/image'
import { ImagePlaceholder } from '@/components/tiptap/extensions/image-placeholder'
import SearchAndReplace from '@/components/tiptap/extensions/search-and-replace'
import './tiptap.css'
import { EditorToolbar } from './toolbars/editor-toolbar'

export interface TiptapEditorProps {
  output?: 'html' | 'text' | 'json'
  content?: string
  onChangeContent?: (value: string) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  extensions?: Extension[]
}

export function TiptapEditor({
  output = 'html',
  content = '',
  onChangeContent,
  disabled = false,
  className,
  placeholder = "Write, type '/' for commands",
  extensions: customExtensions,
}: TiptapEditorProps) {
  const onChangeRef = useRef(onChangeContent)
  useEffect(() => {
    onChangeRef.current = onChangeContent
  }, [onChangeContent])

  const isUpdatingRef = useRef(false)

  const defaultExtensions = useMemo(
    () => [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal pl-4',
          },
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc pl-4',
          },
        },
        heading: {
          levels: [1, 2, 3, 4],
        },
      }),
      Placeholder.configure({
        emptyNodeClass: 'is-editor-empty',
        placeholder: ({ node }) => {
          switch (node.type.name) {
            case 'heading':
              return `Heading ${node.attrs.level}`
            case 'detailsSummary':
              return 'Section title'
            case 'codeBlock':
              return ''
            default:
              return placeholder
          }
        },
        includeChildren: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      TextStyle,
      Subscript,
      Superscript,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      ImageExtension,
      ImagePlaceholder,
      SearchAndReplace,
      Typography,
    ],
    [placeholder]
  )

  const editor = useEditor({
    immediatelyRender: false,
    editable: !disabled,
    extensions: (customExtensions || defaultExtensions) as Extension[],
    content: content || '',
    editorProps: {
      attributes: {
        class:
          'max-w-full focus:outline-none min-h-[350px] p-4 prose dark:prose-invert max-w-none',
      },
    },
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true
      const value =
        output === 'text'
          ? editor.getText()
          : output === 'json'
            ? JSON.stringify(editor.getJSON())
            : editor.getHTML()

      onChangeRef.current?.(value)
      queueMicrotask(() => {
        isUpdatingRef.current = false
      })
    },
  })

  // Synchronize editable state
  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])

  // Synchronize external content changes
  useEffect(() => {
    if (!editor || isUpdatingRef.current) return

    const incoming = content || ''
    const current =
      output === 'text'
        ? editor.getText()
        : output === 'json'
          ? JSON.stringify(editor.getJSON())
          : editor.getHTML()

    if (incoming !== current) {
      editor.commands.setContent(incoming, { emitUpdate: false })
    }
  }, [editor, content, output])

  if (!editor) return null

  return (
    <div
      className={cn(
        'bg-card border-input relative w-full overflow-hidden rounded-md border shadow-xs transition-colors',
        disabled && 'cursor-not-allowed opacity-60',
        className
      )}
    >
      <EditorToolbar editor={editor} />
      <FloatingToolbar editor={editor} />
      <TipTapFloatingMenu editor={editor} />
      <EditorContent
        editor={editor}
        className='min-h-[350px] w-full cursor-text overflow-y-auto'
      />
    </div>
  )
}

export { TiptapEditor as RichTextEditor }
export default TiptapEditor
