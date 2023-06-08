import Router from 'next/router';
import { loadStripe } from '@stripe/stripe-js';
import { Button, ButtonGroup, Form } from 'react-bootstrap';
import { useUser, useCart } from '../lib/hooks';
import { User } from '../types/User';
import { Cart as MyCart } from '../types/Cart';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function Cart(props) {
    // Get the current user. This is neccessary for checkout only
    const [user, { loading }]: [User, { loading: boolean }] = useUser();
    
    // Get the existing items to display from the cart cookie (via 
    // getServerSideProps SSR stuff)
    const [cart, { mutate: change_cart, loading: cart_loading }]: [MyCart, { mutate: any, loading: boolean }] = useCart();

    async function checkout(e) {
        if(!user && !loading) {
            Router.push('/users/Login');
        }
        else {
            const session = await fetch('/api/payments/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body:JSON.stringify({from: window.location.href})
            }).then(r => r.json());
            
            const stripe = await stripePromise;
            
            const { error } = await stripe.redirectToCheckout({
                sessionId: session.sessionId
            })
        }
    }
    async function addItem(e) {
        const productId = 'prod_KxLgos3Yl1IlTi';
        const priceId = 'price_1KHR8WI0ZxFgQb9j6Pot9dMp';
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
            <ul>
            {cart && 
                cart.items.map(
                    (item, index) => {
                        return (
                            <li key={index} style={{backgroundColor: "blue"}}>
                                <h2>{item.product.name}</h2>
                                <span>{item.line_item.description}</span>
                                <Form.Control type="number" value={item.line_item.quantity} />
                            </li>
                        );
                    }
                )
            }
            </ul>
            <ButtonGroup>
                <Button variant="primary" onClick={addItem}>Add Item</Button>
                <Button variant="secondary" onClick={checkout}>Checkout</Button>
            </ButtonGroup>
        </>
    );
}