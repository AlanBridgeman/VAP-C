import Head from 'next/head';

import ProductGrid from '../components/products/product-grid';

import styles from '../styles/Home.module.css';

export default function Home() {
  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Alan Bridgeman's website home page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      <h1 className={styles.title}>
        Welcome/Bienvenue
      </h1>
      <h2 className={styles.subtitle}>To Alan Bridgeman&apos;s website/À le site d&apos; Alan Bridgeman</h2>

      <p className={styles.description}>
        A great place to see the various services I offer.
      </p>

      <ProductGrid />
      <div className={styles.grid}>
        <a href="https://nextjs.org/learn" className={styles.card}>
          <h2>Learn &rarr;</h2>
          <p>Learn about Next.js in an interactive course with quizzes!</p>
        </a>

        <a
          href="https://github.com/vercel/next.js/tree/master/examples"
          className={styles.card}
        >
          <h2>Examples &rarr;</h2>
          <p>Discover and deploy boilerplate example Next.js projects.</p>
        </a>

        <a
          href="https://vercel.com/new?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          className={styles.card}
        >
          <h2>Deploy &rarr;</h2>
          <p>
            Instantly deploy your Next.js site to a public URL with Vercel.
          </p>
        </a>
      </div>
    </>
  )
}
