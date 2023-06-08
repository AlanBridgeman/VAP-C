// External Imports (organized by package)
import Document, { Html, Head, Main, NextScript } from 'next/document';

/**
 * Note that this is a Custome `Document` which allows easily adding 
 * properties to the default document structure
 * ex. adding the lang tab to the html attribute (for accessibility)
 * 
 * See: https://nextjs.org/docs/advanced-features/custom-document
 * 
 * "Note: _document.js is only rendered on the server side and not on 
 * the client side. so event handlers like onClick is not going to 
 * work." (https://stackoverflow.com/a/53324246/3092062) 
 */
class MyDocument extends Document {
    render() {
        return (
            <Html lang="en">
                <Head />
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        )
    }
}

export default MyDocument