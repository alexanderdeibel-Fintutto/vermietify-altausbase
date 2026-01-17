import * as React from "react"
import { Download, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

const VfGenerator = React.forwardRef(({ 
  form,
  preview,
  onGenerate,
  onDownload,
  loading,
  className,
  ...props 
}, ref) => {
  const handleCopy = async () => {
    const previewText = typeof preview === 'string' ? preview : preview?.props?.children
    if (previewText) {
      await navigator.clipboard.writeText(previewText)
      toast.success("In Zwischenablage kopiert")
    }
  }

  return (
    <div ref={ref} className={cn("vf-generator", className)} {...props}>
      <div className="vf-generator-form">
        {form}
      </div>

      <div className="vf-generator-preview">
        <div className="vf-generator-preview-header">
          <h3 className="font-semibold">Vorschau</h3>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleCopy}
              disabled={!preview}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onDownload}
              disabled={!preview}
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="vf-generator-preview-content">
          {preview || (
            <div className="text-center text-[var(--theme-text-muted)] py-12">
              Fülle das Formular aus, um eine Vorschau zu generieren
            </div>
          )}
        </div>
      </div>
    </div>
  );
})
VfGenerator.displayName = "VfGenerator"

export { VfGenerator }