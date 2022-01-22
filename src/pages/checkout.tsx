import { useState, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement } from '@stripe/react-stripe-js';
import SimpleLayout from '../components/layout/simple';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)

const handleClick = async (event) => {
    const { sessionId } = await fetch('/api/payment/session', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ quantity: 1 })
    }).then(res => res.json());
    const stripe = await stripePromise;
    const { error } = await stripe.redirectToCheckout({
        sessionId
    });
};

export default function Checkout() {
    const [clientSecret, setClientSecret] = useState('');

    useEffect(
        () => {
            // Create PaymentIntent as soon as the page loads
            fetch("/api/payments/create-payment")
            .then((res) => res.json())
            .then(({ clientSecret }) => setClientSecret(clientSecret));
        },
        []
    )

    const options = {
        clientSecret
    }
    
    return (
        <SimpleLayout>
            <main>
                <div style={{ minWidth: "250px", maxWidth: "30%", top: "100px", backgroundColor: "#666633" }}>
                    {clientSecret && (<Elements stripe={stripePromise} options={options}>
                        <Form>
                            <PaymentElement id="payment-element" />
                            <br />
                            <Button variant="success" style={{ width: "100%", bottom: 0 }} onClick={handleClick}>Checkout</Button>
                        </Form>
                    </Elements>)}
                </div>
            </main>
        </SimpleLayout>
    );
}