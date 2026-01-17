import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Download, Copy, Eye } from "lucide-react"

const VfGenerator = React.forwardRef(({ 
  form,
  preview,
  onDownload,
  onCopy,
  className,
  ...props 
}, ref) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(preview);
    onCopy?.();
  };

  return (
    <div ref={ref} className={cn("vf-generator", className)} {...props}>
      <div className="vf-generator-form">
        {form}
      </div>

      <div className="vf-generator-preview">
        <div className="vf-generator-preview-header">
          <h3 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Vorschau
          </h3>
          <div className="flex gap-2">
            {onCopy && (
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                <Copy className="h-4 w-4" />
              </Button>
            )}
            {onDownload && (
              <Button variant="outline" size="sm" onClick={onDownload}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            )}
          </div>
        </div>
        <div className="vf-generator-preview-content">
          {preview || (
            <div className="text-center text-[var(--theme-text-muted)]">
              Füllen Sie das Formular aus, um eine Vorschau zu sehen
            </div>
          )}
        </div>
      </div>
    </div>
  );
})
VfGenerator.displayName = "VfGenerator"

export { VfGenerator }