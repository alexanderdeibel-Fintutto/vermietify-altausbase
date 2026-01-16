import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

export default function HandwerkerPaymentForm({ orderId, handwerkerId, amount, description, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [stripe, setStripe] = useState(null);
    const [elements, setElements] = useState(null);

    useEffect(() => {
        const loadStripe = async () => {
            if (window.Stripe) {
                const stripeInstance = window.Stripe(window.STRIPE_PUBLISHABLE_KEY);
                setStripe(stripeInstance);
            }
        };
        loadStripe();
    }, []);

    const handleCreatePayment = async () => {
        setLoading(true);
        try {
            const response = await base44.functions.invoke('createMarketplacePayment', {
                order_id: orderId,
                amount: amount,
                handwerker_id: handwerkerId,
                description: description,
            });

            setClientSecret(response.data.client_secret);
            toast.success(`Zahlung erstellt: €${(amount / 100).toFixed(2)}`);

            if (stripe && response.data.client_secret) {
                const elementsInstance = stripe.elements({ clientSecret: response.data.client_secret });
                const paymentElement = elementsInstance.create('payment');
                paymentElement.mount('#payment-element');
                setElements(elementsInstance);
            }
        } catch (error) {
            toast.error('Fehler: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setLoading(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/orders/${orderId}/success`,
            },
        });

        if (error) {
            toast.error(error.message);
            setLoading(false);
        } else {
            if (onSuccess) onSuccess();
        }
    };

    return (
        <Card className="bg-white shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    Zahlung durchführen
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="bg-slate-50 rounded-lg p-4 border">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600">Gesamtbetrag</span>
                        <span className="text-2xl font-bold text-slate-900">
                            €{(amount / 100).toFixed(2)}
                        </span>
                    </div>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>

                {!clientSecret ? (
                    <Button
                        onClick={handleCreatePayment}
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Wird vorbereitet...
                            </>
                        ) : (
                            'Zahlungsmethode auswählen'
                        )}
                    </Button>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div id="payment-element" className="border rounded-lg p-4"></div>

                        <Button
                            type="submit"
                            disabled={!stripe || loading}
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Wird verarbeitet...
                                </>
                            ) : (
                                `€${(amount / 100).toFixed(2)} bezahlen`
                            )}
                        </Button>

                        <p className="text-xs text-slate-500 text-center">
                            Sichere Zahlung durch Stripe. Ihre Daten werden verschlüsselt übertragen.
                        </p>
                    </form>
                )}
            </CardContent>
        </Card>
    );
}