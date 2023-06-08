import { NextApiResponse } from 'next';
import nextConnect from 'next-connect';
import cookie from '../../middleware/cookie';
import { Cart } from '../../types/Cart';
import ExtendedRequest from "../../types/ExtendedRequest";

const handler = nextConnect<ExtendedRequest,NextApiResponse>();

handler
    .use(cookie)
    .get(
        (req: ExtendedRequest, res: NextApiResponse) => {
            //console.log('Cart: ' + JSON.stringify(req.cookie));
            
            let cart: Cart;
            if(req.cookie.cart !== undefined) {
                cart = { 
                    items: JSON.parse(req.cookie.cart).items
                };
            }

            res.status(200).json({cart: cart});
        }
    );

    export default handler;