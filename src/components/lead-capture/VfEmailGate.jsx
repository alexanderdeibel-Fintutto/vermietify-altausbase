import * as React from "react"
import { Lock, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const VfEmailGate = React.forwardRef(({ 
  title = "Ergebnis freischalten",
  description = "Gib deine E-Mail-Adresse ein, um dein personalisiertes Ergebnis zu erhalten.",
  benefits = [
    "Kostenlose Analyse",
    "Keine Verpflichtung",
    "Datenschutz garantiert"
  ],
  onSubmit,
  loading,
  className,
  ...props 
}, ref) => {
  const [email, setEmail] = React.useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit?.(email)
  }

  return (
    <div ref={ref} className={cn("vf-email-gate", className)} {...props}>
      <Lock className="vf-email-gate-locked-icon" />
      <h2 className="vf-email-gate-title">{title}</h2>
      <p className="vf-email-gate-description">{description}</p>
      
      <form onSubmit={handleSubmit} className="vf-email-gate-form">
        <Input
          type="email"
          placeholder="deine@email.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="vf-email-gate-input"
        />
        <Button type="submit" variant="gradient" disabled={loading}>
          {loading ? "Wird verarbeitet..." : "Freischalten"}
        </Button>
      </form>

      <ul className="vf-email-gate-benefits">
        {benefits.map((benefit, index) => (
          <li key={index} className="vf-email-gate-benefit">
            <Check className="vf-email-gate-benefit-icon h-4 w-4" />
            {benefit}
          </li>
        ))}
      </ul>
    </div>
  );
})
VfEmailGate.displayName = "VfEmailGate"

export { VfEmailGate }