import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Navbar, Container, Nav, NavLink, NavDropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useUser, useCategories, useServices, useCart } from '../../lib/hooks';

import { ActiveLink } from './ActiveLink';

import { KeyedMutator } from 'swr';

import { User } from '../../types/User';
import { Service } from '../../types/Service';
import { ServiceCategory } from '../../types/ServiceCategory';
import { Cart } from '../../types/Cart';
import { Name } from '../../types/Name';

import style from '../../styles/fontawesome.module.css';

export default function Linkbar() {
    const [user, { mutate }]: [User, {mutate: KeyedMutator<any>}] = useUser();
    const [categories, { loading: loadingCategoires }]: [ServiceCategory[], { loading: boolean }] = useCategories();
    const [services, { loading: loadingServices }]: [Service[], { loading: boolean }] = useServices();
    const [cart, { loading: loadingCart }]: [Cart, {loading: boolean}] = useCart();
    const router = useRouter();

    const userSectionDefault = (
        <>
            <ActiveLink href="/users/Login" passHref>
                <NavLink>
                    <FontAwesomeIcon className={style.gpg5s} icon={['fad', 'sign-in']} />
                    {' '}<span style={{color: "green"}}>Login</span>
                </NavLink>
            </ActiveLink>
            <Navbar.Text>
                or
            </Navbar.Text>
            <ActiveLink href="/users/SignUp" passHref>
                <NavLink>
                    <FontAwesomeIcon className={style.gpg5si} icon={['fad', 'user-plus']} />
                    {' '}<span style={{color: "green"}}>Sign Up</span>
                </NavLink>
            </ActiveLink>
        </>
    );
    const [userDropdown, setUserDropdown] = useState(userSectionDefault)

    useEffect(
        () => {
            // Change the navigation if/when the user is loaded
            if (user) {
                setUserDropdown((
                    <>
                        <Navbar.Text>
                            Signed in as:{' '}
                        </Navbar.Text>
                        <NavDropdown 
                            title={
                                <>
                                    <FontAwesomeIcon className={style.gpgs} icon={['fad', 'user-circle']} aria-hidden="true" />
                                    {' '}<span style={{ color: "green" }}>{ !!user.properties.name ? typeof user.properties.name === 'object' ? user.properties.name.fname + ' ' + user.properties.name.lname : user.properties.name : user.email }</span>
                                </>
                                //    {' '}<FontAwesomeIcon icon={['fas', 'angle-down']} style={{color: "green"}} />
                            }
                            id='user-dropdown'
                            menuVariant='dark'
                        >
                            <Link href="/dashboard" passHref>
                                <NavDropdown.Item>
                                    <FontAwesomeIcon icon={['fad', 'columns']} />
                                    {' '}Dashboard
                                </NavDropdown.Item>
                            </Link>
                            <Link href="/users/Settings" passHref>
                                <NavDropdown.Item>
                                    <FontAwesomeIcon icon={['fad', 'cog']} />
                                    {' '}Settings
                                </NavDropdown.Item>
                            </Link>
                            <Link href="/users/Logout" passHref>
                                <NavDropdown.Item>
                                    <FontAwesomeIcon icon={['fad', 'sign-out']} />
                                    {' '}Logout
                                </NavDropdown.Item>
                            </Link>
                        </NavDropdown>
                    </>
                ));
            }
            else {
                setUserDropdown(userSectionDefault);
            }
        },
        [user]
    )

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
            <Navbar.Brand href="/" style={{color:"green"}}>Alan Bridgeman</Navbar.Brand>
            <Navbar.Toggle aria-controls="basic-navbar-nav" />
            <Navbar.Collapse id="basic-navbar-nav">
                <Nav className="me-auto">
                    <ActiveLink href="/" passHref>
                        <NavLink>
                            <FontAwesomeIcon className={style.gso} icon={['fad', 'home']} aria-hidden="true" />
                            {' '}Home
                        </NavLink>
                    </ActiveLink>
                    <ActiveLink href="/About" passHref>
                        <NavLink>
                            <FontAwesomeIcon className={style.gso} icon={['fad', 'alien']} aria-hidden="true" />
                            {' '}About
                        </NavLink>
                    </ActiveLink>
                    {
                        categories && categories.map(
                            (category: ServiceCategory, index: number) => {
                                return (
                                    <NavDropdown 
                                        title={
                                            <>
                                                <span aria-hidden="true" className="fa-stack fa-2x" style={{fontSize: "0.8em", verticalAlign: "top"}}>
                                                    <FontAwesomeIcon icon={['fas', 'square']} className="fa-stack-2x" style={{color: "#333333", fontSize: "0.8em"}} />
                                                    <FontAwesomeIcon icon={['fas', 'terminal']} className="fa-stack-1x fa-inverse" style={{color: "green"}} />
                                                </span>
                                                {
                                                    category.properties.names.map(
                                                        (name: Name, index: number) => {
                                                            const localeLang = router.locale.split('-')[0];
                                                            const localeCountry = router.locale.split('-')[1];
                                                            const matchLocale = name.locale.language == localeLang && name.locale.country == localeCountry;
                                                            if(matchLocale) {
                                                                return name.value;
                                                            }
                                                        }
                                                    )
                                                }
                                            </>
                                        }
                                        id={
                                            category.properties.names.map(
                                                (name: Name, index: number) => {
                                                    const localeLang = router.locale.split('-')[0];
                                                    const localeCountry = router.locale.split('-')[1];
                                                    const matchLocale = name.locale.language == localeLang && name.locale.country == localeCountry;
                                                    if(matchLocale) {
                                                        return name.value.replaceAll(' ', '-') + '-dropdown';
                                                    }
                                                }
                                            ).join('')
                                        }
                                        renderMenuOnMount={true}
                                        menuVariant='dark'
                                    >
                                        {
                                            services && services.map(
                                                (service: Service, index: number) => {
                                                    if(JSON.stringify(service.category) === JSON.stringify(category)) {
                                                        return (
                                                            <ActiveLink href={service.properties.usage} passHref>
                                                                <NavDropdown.Item>
                                                                    <FontAwesomeIcon className={style.gpbs} icon={service.properties.icon} aria-hidden="true" />
                                                                    {' '}{
                                                                        service.properties.names.map(
                                                                            (name: Name, index: number) => {
                                                                                const localeLang = router.locale.split('-')[0];
                                                                                const localeCountry = router.locale.split('-')[1];
                                                                                const matchLocale = name.locale.language == localeLang && name.locale.country == localeCountry;
                                                                                if(matchLocale) {
                                                                                    return name.value;
                                                                                }
                                                                            }
                                                                        )
                                                                    }
                                                                </NavDropdown.Item>
                                                            </ActiveLink>
                                                        );
                                                    }
                                                }
                                            )
                                        }
                                    </NavDropdown>
                                )
                            }
                        )
                    /*<NavDropdown 
                        title={
                            <>
                                <span aria-hidden="true" className="fa-stack fa-2x" style={{fontSize: "0.8em", verticalAlign: "top"}}>
                                    <FontAwesomeIcon icon={['fas', 'square']} className="fa-stack-2x" style={{color: "#333333", fontSize: "0.8em"}} />
                                    <FontAwesomeIcon icon={['fas', 'terminal']} className="fa-stack-1x fa-inverse" style={{color: "green"}} />
                                </span>
                                Tech Services
                            </>
                        }
                        id="tech-services-dropdown"
                        renderMenuOnMount={true}
                        menuVariant='dark'
                    >
                        <ActiveLink href="/products/tech-services/Event_Support" passHref>
                            <NavDropdown.Item>
                                <FontAwesomeIcon className={style.gpbs} icon={['fad', 'users-class']} aria-hidden="true" />
                                {' '}Event Support
                            </NavDropdown.Item>
                        </ActiveLink>
                        <ActiveLink href="/products/tech-services/Video_Editing" passHref>
                            <NavDropdown.Item>
                                <FontAwesomeIcon className={style.gpbsi} icon={['fad', 'video']} aria-hidden="true" />
                                {' '}Video Editing
                            </NavDropdown.Item>
                        </ActiveLink>
                        <NavDropdown.Divider />
                        <ActiveLink href="/products/tech-services/tech-support" passHref>
                            <NavDropdown.Item>
                                <FontAwesomeIcon className={style.gpbs} icon={['fad', 'user-headset']} aria-hidden="true" />
                                {' '}Tech Support
                            </NavDropdown.Item>
                        </ActiveLink>
                    </NavDropdown>*/
                    }
                    <NavDropdown
                        title={
                            <>
                                <FontAwesomeIcon className={style.gpg5s} icon={['fad', 'universal-access']} aria-hidden="true" />
                                {' '}Accessibility Services
                            </>
                        }
                        id="accessibility-services-dropdown"
                        menuVariant='dark'
                    >
                        <ActiveLink href="/products/accessibility-services/Consulting" passHref>
                            <NavDropdown.Item>
                                <FontAwesomeIcon className={style.gpbs} icon={['fad', 'user-group']} aria-hidden="true" />
                                {' '}Consulting
                            </NavDropdown.Item>
                        </ActiveLink>
                        <ActiveLink href="/products/accessibility-services/Doc_Services" passHref>
                            <NavDropdown.Item>
                                <FontAwesomeIcon className={style.gpbsi} icon={['fad', 'file']} aria-hidden="true" />
                                {' '}Document Remediation
                            </NavDropdown.Item>
                        </ActiveLink>
                    </NavDropdown>
                
                </Nav>
            </Navbar.Collapse>
            <Navbar.Collapse className="justify-content-end navbar-nav">
                {cart &&
                    <ActiveLink href="/cart" passHref>
                        <NavLink>
                            <FontAwesomeIcon className={style.gpbs} icon={['fad', 'cart-shopping']} aria-hidden="true" />
                            {' '}Go To Cart
                        </NavLink>
                    </ActiveLink>
                }
                {userDropdown}
            </Navbar.Collapse>
        </Container>
    </Navbar>
  )
}
