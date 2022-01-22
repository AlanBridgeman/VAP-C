// External Imports (organized by package)
import { useEffect } from 'react';
import Head from 'next/head';
// External Style Imports (organized by package)
import 'bootstrap/dist/css/bootstrap.css';
// Custom/Project Imports
import SimpleLayout from '../components/layout/simple';
// Custom/Project Style Imports
import '../styles/globals.css';
import '../styles/accessible.css';
// Font-Awesome
import '../utils/font-awesome.ts';

/**
 * Note that this is a Custome `App` which allows easy "wrapping" of content
 * ex. introducting the use of a template, bootstrap, etc...
 * 
 * See: https://nextjs.org/docs/advanced-features/custom-app
 * 
 * "_app.js is rendered on both server-side and client-side (on the server 
 * during the initial SSR, on the client-side after hydration and then on 
 * every page/route navigation)." (A comment on https://stackoverflow.com/a/53324246/3092062) 
 */
function MyApp({ Component, pageProps }) {
    useEffect(() => {
        import("bootstrap/dist/js/bootstrap");
    }, []);

    return (
        <>
            <Head>
                <meta
                  httpEquiv='Content-Tu[e'
                  content='text/html;
                  charset=utf-8'
                />
                <meta 
                  name="viewport"
                  content="width=device-width,initial-scale=1" 
                />
                { /*<script src="https://kit.fontawesome.com/cd62abe954.js" crossOrigin="anonymous"></script>*/ }
            </Head>

            <SimpleLayout>
                <Component {...pageProps} />
            </SimpleLayout>
        </>
    );
}

export default MyApp
