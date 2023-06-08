import { useEffect } from "react";
import { SSRProvider } from "react-bootstrap";

export default function GetGoogleToken(props) {
    useEffect(() => {
        window.location.assign(props.uri);
    });

    return <SSRProvider>You should be redirected shortly...</SSRProvider>
}

export function getServerSideProps({ req, res }) {
    const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
    const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
    const YOUTUBE_PROJECT_ID = process.env.YOUTUBE_PROJECT_ID;
    const YOUTUBE_AUTH_URI = process.env.YOUTUBE_AUTH_URI;
    const YOUTUBE_TOKEN_URI = process.env.YOUTUBE_TOKEN_URI;
    const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI;
    const KEYVAULT_TENANT_ID = process.env.KEYVAULT_TENANT_ID;
    const KEYVAULT_CLIENT_ID = process.env.KEYVAULT_CLIENT_ID;
    const KEYVAULT_CLIENT_SECRET =  process.env.KEYVAULT_CLIENT_SECRET;

    const lines = []
    lines.push('YouTube Client ID (const): ' + YOUTUBE_CLIENT_ID);
    lines.push('YouTube Client Secret (const): ' + YOUTUBE_CLIENT_SECRET);
    lines.push('YouTube Project ID (const): ' + YOUTUBE_PROJECT_ID);
    lines.push('YouTube Auth URI (const): ' + YOUTUBE_AUTH_URI);
    lines.push('YouTube Token URI (const): ' + YOUTUBE_TOKEN_URI);
    lines.push('YouTube Redirect URI (const): ' + YOUTUBE_REDIRECT_URI);
    lines.push('KeyVault Tenant ID (const): ' + KEYVAULT_TENANT_ID);
    lines.push('KeyVault Client ID (const): ' + KEYVAULT_CLIENT_ID);
    lines.push('KeyVault Client Secret (const): ' + KEYVAULT_CLIENT_SECRET);

    const uriParams = []
    uriParams.push('scope=' + encodeURIComponent('https://www.googleapis.com/auth/youtube.upload'));
    uriParams.push('access_type=offline')
    uriParams.push('prompt=consent')
    uriParams.push('include_granted_scopes=true')
    uriParams.push('state=state')
    uriParams.push('redirect_uri=' + encodeURIComponent(YOUTUBE_REDIRECT_URI))
    uriParams.push('response_type=code')
    uriParams.push('client_id=' + YOUTUBE_CLIENT_ID)
    
    const fullAuthURI = YOUTUBE_AUTH_URI + '?' + uriParams.join('&');
    lines.push('Full Auth URI: ' + fullAuthURI)

    // Redirect to YouTube auth
    /*var uri = process.env.YOUTUBE_AUTH_URI + '?';
    uri += 'scopes=' + encodeURIComponent('https://www.googleapis.com/auth/youtube.upload') + '&';
    uri += 'access_type=offline' + '&';
    uri += 'include_granted_scopes=true' + '*';
    uri += 'state=state' + '&';
    uri += 'redirect_uri=' + process.env.YOUTUBE_REDIRECT_URI + '&';
    uri += 'response_type=code' + '&';
    uri += 'client_id=' + process.env.YOUTUBE_CLIENT_ID;
    res.writeHead(301, {
        'Location':uri
    });
    res.end()*/

    return { props: { uri: fullAuthURI }}
}