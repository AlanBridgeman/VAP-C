import styles from '../styles/grid.module.css';

export default function Tech() {
    return (
        <>
            <h1>Technology Use</h1>
            <p>
                This provides a brief idea of the technologies used 
                in and used for development of this website/webapp this is 
                for multiple reasons including but not limited to 
                transparency and accountability.
            </p>
            <p>
                While not automated or machine readable you can think of 
                this like a first step to or simplified version of a <a href="https://ntia.gov/sbom">
                Software Bill of Matterials (SBOM)</a> in terms of being 
                transparent about what technologies are used as this seems 
                to be becoming increasingly desirable for software 
                builder/providers to do. Particularly when working with 
                government. For example <a href="https://www.whitehouse.gov/briefing-room/presidential-actions/2021/05/12/executive-order-on-improving-the-nations-cybersecurity/">
                this US executive order</a>
            </p>
            <p>
                Admittedly, actual SBOMs, from what I&apos;ve read anyway, are 
                usually in a machine readable format like:
                <ul>
                    <li>
                        <a href="https://www.iso.org/standard/65666.html">
                        Software Identifictation Tagging (SWID)</a> which is an XML 
                        like document from what I can understand.
                    </li>
                    <li>
                        <a href="https://cyclonedx.org/">CycloneDX</a> which is a 
                        JSON/XML style document from the 
                        <a href="https://owasp.org/">The Open Web Application 
                        Security Project (OWASP)</a>
                    </li>
                    <li>
                        <a href="https://spdx.dev/">SPDX</a> which is a 
                        standard that supports multiple data formats (XML, 
                        JSON, YAML, Excel, etc...) from what I can tell 
                        from the <a href="https://linuxfoundation.org/">
                        Linux Foundation</a>
                    </li>
                </ul>
                So, this page only acts as a preliminary start.
            </p>
            <br />
            <h2><a href="https://stripe.com">Stripe</a></h2>
            <p>I use Stripe as my payment platform this is for simplificaiton of accepting various methods of payments as well as ensuring user confidence in payment collection.</p>
            <br />
            <hr />
            <br />
            <h2>JavaScript/TypeScript</h2>
            <div className={styles.grid}>
                <a href="https://www.typescriptlang.org/" className={styles.card}>
                    <h3>TypeScript &rarr;</h3>
                    <p>I use TypeScript throughout so that I can do type inforcement and more easily use autocomplete</p>
                </a>
                <a href="https://nodejs.org" className={styles.card}>
                    <h3>Node &rarr;</h3>
                    <p>I use node as my choosen server technology. Though this was more of a consequence of choosing NextJS than a concious choice.</p>
                </a>
                <a href="https://reactjs.org/" className={styles.card}>
                    <h3>React &rarr;</h3>
                    <p>I actually choose NextJS because it&apos;s a React based framework. I wanted to use React because of it&apos;s modular design that allows easy component and easy library plug-and-play front-end/UI code.</p>
                </a>
                <a href="https://nextjs.org/" className={styles.card}>
                    <h3>NextJS &rarr;</h3>
                    <p>I choose to use NextJS because it provided a way to have a simplified React front-end</p>
                </a>
                <a href="https://prisma.io">
                    <h3>Prisma</h3>
                    <p>I use Prisma as the way to connect to the database. It&apos;s a JavaScript ORM</p>
                </a>
                <a href="https://github.com/hoangvvo/next-connect#readme" className={styles.card}>
                    <h3>Next-Connect &rarr;</h3>
                    <p>As a middleware provider I use next-connect (a NextJS implementation of Connect middleware) which is similar to Express for people familiar.</p>
                </a>
                <a href="https://www.passportjs.org/" className={styles.card}>
                    <h3>Passport</h3>
                    <p>I use the Passport middleware for authenitcation simplification</p>
                </a>
                <a href="https://fontawesome.com/">
                    <h3>Font Awesome</h3>
                    <p>I use Font Awesome for a lot of my icons.</p>
                </a>
                <div className={styles.card}>
                    <h3>Various other NPM packages</h3>
                    <p>Such as <a href="">UUID</a> and <a href="">SWR</a></p>
                </div>
            </div>
            <br />
            <hr />
            <br />
            <h2>Azure</h2>
            <h3>Azure Container Registry (ACR)</h3>
            <p>I use ACR to host the container images (instructions) for the container that is this website</p>
            <h3>App Services (Container)</h3>
            <p>I use Azure App Services (container variant) as the host/provider of this website</p>
            <h3>Azure Storage Account (V2)</h3>
            <p>Use Azure Storage in a lot of ways including BLOB storag, Queue Storage, Table Storage, etc...</p>
            <h3>Azure SQL</h3>
            <p>Use Azure SQL for relational database storage and access.</p>
            <h3>Azure KeyVault</h3>
            <p>Use Azure Key Vault for secret storage as it means their more secure than trying to store secrets properly myself.</p>
            <br />
            <hr />
            <br />
            <h2>Github</h2>
            <p>I use Git as my source control and Github as the host for my remote repository</p>
            <h3>Private Repository</h3>
            <p>All of this code is hosted on a private Github repository. This is because with significant parts of this site and the technology connected to this site behind pay walls it seems keeping that private at least while it&apos;s being built fealt like it made sense</p>
            <h3>Actions</h3>
            <p>I use Github Actions as my Continous Deployment technology</p>
            <br />
            <hr />
            <br />
            <h2>Visual Studio Code (VS Code)</h2>
            <p>I tend to use VS Code (Insiders) to do a majority of my coding because of it&apos;s versitility to work with almost anything</p>
            <h3>Extensions</h3>
            <h4><a href="https://marketplace.visualstudio.com/items?itemName=ms-vscode.vscode-node-azure-pack">Azure Tools</a></h4>
            <p>This lets me manage Azure resources directly from VS Code which can be incredibly useful.</p>
            <h4><a href="https://marketplace.visualstudio.com/items?itemName=Stripe.vscode-stripeStripe">Stripe</a></h4>
            <p>This is useful to manage Stripe stuff directly from VS Code which can be incredibly useful.</p>
        </>
    );

}