import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, CheckCircle } from "lucide-react"

const VfEmailGate = React.forwardRef(({ 
  title = "Ergebnisse freischalten",
  description = "Geben Sie Ihre E-Mail-Adresse ein, um die vollständigen Ergebnisse zu erhalten",
  benefits = [
    "100% kostenlos",
    "Keine Kreditkarte erforderlich",
    "Sofortiger Zugriff"
  ],
  onSubmit,
  className,
  ...props 
}, ref) => {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    await onSubmit?.(email);
    setLoading(false);
  };

  return (
    <div ref={ref} className={cn("vf-email-gate", className)} {...props}>
      <Lock className="vf-email-gate-locked-icon" />
      <h3 className="vf-email-gate-title">{title}</h3>
      <p className="vf-email-gate-description">{description}</p>
      
      <form onSubmit={handleSubmit} className="vf-email-gate-form">
        <Input
          type="email"
          placeholder="ihre@email.de"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="vf-email-gate-input"
        />
        <Button 
          type="submit" 
          variant="gradient"
          disabled={loading}
        >
          {loading ? 'Wird verarbeitet...' : 'Freischalten'}
        </Button>
      </form>

      {benefits.length > 0 && (
        <ul className="vf-email-gate-benefits">
          {benefits.map((benefit, index) => (
            <li key={index} className="vf-email-gate-benefit">
              <CheckCircle className="vf-email-gate-benefit-icon h-4 w-4" />
              {benefit}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
})
VfEmailGate.displayName = "VfEmailGate"

export { VfEmailGate }