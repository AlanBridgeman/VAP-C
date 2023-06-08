import Router from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { useUser, useCart } from '../../lib/hooks';
import { User } from '../../types/User';
import { Cart as MyCart } from '../../types/Cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

interface Props {
    productId: string,
    priceId: string,
    children?: string | JSX.Element | JSX.Element[]
}

export default function ProductPageLayout(props: Props) {
    // Get the current user. This is neccessary for checkout only
    const [user, { loading }]: [User, { loading: boolean }] = useUser();
    
    // Get the existing items to display from the cart cookie (via 
    // getServerSideProps SSR stuff)
    const [cart, { mutate: change_cart, loading: cart_loading }]: [MyCart, { mutate: any, loading: boolean }] = useCart();

    /**
     * Callback to handle the "Buy It Now" button
     * 
     * @param e - The click event that triggered the callback
     */
    async function checkout(e) {
        // It's important to note we only force the user to login if 
        // they're trying to checkout
        if(!user && !loading) {
            // Go to the login page
            Router.push('/users/Login');

            // Don't continue processing stop here.
            return;
        }
        
        // Get the product currently being looked at's cart ready details
        const itemDetails = await fetch('/api/payments/get-item-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({product: props.productId, price: props.priceId, quantity: 1})
        })
        .then(r => r.json());

        // Create the items list with the single element of what we just 
        // recieved for the checkout endpoint body
        const items = [itemDetails];

        // Create a Stripe checkout session
        const session = await fetch('/api/payments/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body:JSON.stringify({items: items, from: window.location.href})
        })
        .then(r => r.json());

        // Ensure stripe is initialized
        const stripe = await stripePromise;
        
        // Redirect to Stripe checkout
        const { error } = await stripe.redirectToCheckout({
            sessionId: session.sessionId
        })
    }

    /**
     * Callback to handle the "Add To Cart" button
     * 
     * @param e - The click event that triggered the callback 
     */
    async function addItem(e) {
        const productId = props.productId;
        const priceId = props.priceId;
        const quantity = 1;

        // Call the add checkout item API end point
        await fetch('/api/payments/add-checkout-item', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({
                product: productId,
                price: priceId,
                quantity: quantity
            })
        })
        .then(r => r.json())
        .then(
            (data) => {
                console.log('What is cart in this callback: ' + JSON.stringify(cart));
                
                let items;
                if(cart) {
                    items = cart.items; 
                    items.push(data.item);
                }
                else {
                    items = [data.item];
                }

                change_cart({items: items});
            }
        );
    }

    return (
        <>
            {props.children}
            <ButtonGroup>
                <Button variant="primary" onClick={addItem}>Add Item</Button>
                <Button variant="secondary" onClick={checkout}>Checkout</Button>
            </ButtonGroup>
        </>
    );
}