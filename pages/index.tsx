import Head from 'next/head';
import { useRouter } from 'next/router';

import { SupportedLocales } from '../lib/locales';

import ServiceGrid from '../components/services/service-grid';

import styles from '../styles/Home.module.css';

function EnglishHome() {
    return (
        <>
            <Head>
                <title>Home</title>
                <meta name="description" content="Alan Bridgeman's website home page" />
                <link rel="icon" href="/favicon.ico" />
            </Head>

            <h1 className={styles.title}>Welcome</h1>
            <h2 className={styles.subtitle}>To Alan Bridgeman&apos;s website</h2>

            <p className={styles.description}>
                A great place to see the various services I offer.
            </p>

            <ServiceGrid locale={SupportedLocales.english} />
        </>
    );
}

function FrenchHome() {
  return (
    <>
      <Head>
        <title>Home</title>
        <meta name="description" content="Alan Bridgeman's website home page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className={styles.title}>Bienvenue</h1>
      <h2 className={styles.subtitle}>À le site d&apos; Alan Bridgeman</h2>

      <p className={styles.description}>
        Un bon place de vais vu Les services je offerte.
      </p>

      <ServiceGrid locale={SupportedLocales.french} />
    </>
  );
}

export default function Home() {
    const router = useRouter();

    if(router.locale == 'fr-CA') {
        return <FrenchHome />
    }
    else { // Meaning en-CA as it's the default
        return <EnglishHome />
    }
}
