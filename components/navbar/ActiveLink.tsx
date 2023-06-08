import React from 'react'
import Link, { LinkProps } from 'next/link'
import { useRouter } from 'next/router'

export interface NavLinkProps extends LinkProps {
  children: React.ReactElement
}

export function ActiveLink({ children, href, ...props }: NavLinkProps) {
  const router = useRouter()
  console.log('Address: ' + router.pathname);
  return (
    <Link href={href} {...props}>
      {router.pathname === href ? React.cloneElement(children, { 'active': true }) : children}
    </Link>
  )
}