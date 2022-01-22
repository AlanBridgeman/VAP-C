// External Imports (organized by package)
import React from 'react';
import Image from 'next/image';
// Custom/Project Imports
import Linkbar from '../navbar/navbar';
// Custom/Project Style Imports
import styles from '../../styles/Home.module.css';

export default function SimpleLayout(props) {
  return (
    <>
      <Linkbar />
      <main role="main" className={styles.main}>
        {props.preContainer && props.preContainer}
        <div className="bg-dark" style={{color: "white"}}>
          <div className={styles.container}>
            {props.children}
          </div>
        </div>
        {props.postContainer && props.postContainer}
      </main>
      <footer className={styles.footer}>
        <small>
          Copyright &copy;2022 Alan Bridgeman
        </small>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by NextJS from{' '}
          <span className={styles.logo}>
            <Image
              src="/vercel.svg"
              alt="Vercel Logo"
              width={72}
              height={16} 
            />
          </span>
        </a>
      </footer>
    </>
  )
}