import { NextApiRequest, NextApiResponse } from 'next';
//import { createService } from '../../../lib/db';

export default async function CreateService(req: NextApiRequest, res: NextApiResponse) {
    const productBody = {
        name: req.body.name
    };

    // Create a Product in Stripe
    const stripeProduct = await fetch('/api/payments/create-product',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(productBody)
        }
    )
    .then(r => r.json());

    const priceBody = {
        'product': stripeProduct.id
    }

    // Create a Price in Stripe
    const stripePrice = await fetch('/api/payments/create-price',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(priceBody)
        }
    )
    .then(r => r.json())

    const priceProps = {
        stripePriceId: stripePrice.id,
        priceName: '',
        priceValue: 0,
        priceFrequency: '',
        priceType: 0
    }
    
    const serviceProps = {
        stripeProductId: stripeProduct.id, 
        serviceName: '',
        serviceShortDesc: '',
        serviceLongDesc: ''
    }

    //await createService(serviceProps, priceProps);
}