import { useState } from 'react';
import { Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import RequiredInput from './RequiredInput';

interface props {
    label: string | JSX.Element,
    inputName: string,
    isRequired?: boolean,
    value?: string
}

export default function ShowablePassword(props: props) {
    const showButton = (
        <>
            <FontAwesomeIcon icon={['fad', 'eye']} />
            {' '}Show
        </>
    );
    const hideButton = (
        <>
            <FontAwesomeIcon icon={['fad', 'eye-slash']} />
            {' '}Hide
        </>
    );

    const [buttonContents, setButtonContents] = useState(showButton);

    /**
     * This is partially for functionatlity though that could easily be done 
     * in a one-liner. However, there are accessibility (specifically screen 
     * reader) concerns here I wanted to address
     * 
     * @see https://incl.ca/show-hide-password-accessibility-and-password-hints-tutorial/
     * @param e - The event that occured (used to get the button that was pressed, so that I can get the corresponding input field)
     */
    const onShowHidePassword = (e) => {
        let button = e.currentTarget;
        let formGroup = button.parentElement;
        let srPasswordText = formGroup.getElementsByTagName('p').length === 1 ? formGroup.getElementsByTagName('p')[0] : null;
        let input = formGroup.getElementsByTagName('input').length === 1 ? formGroup.getElementsByTagName('input')[0] : null;

        if(input != null) {
            if(input.getAttribute('type') === 'password') {
                srPasswordText.innerText = "Password shown";
                button.setAttribute('aria-pressed', 'true');
                input.setAttribute('type', 'text');
                setButtonContents(hideButton);
            }
            else {
                srPasswordText.innerText = "Password hidden";
                button.setAttribute('aria-pressed', 'false');
                input.setAttribute('type', 'password');
                setButtonContents(showButton);
            }
        }
        /*else {
            throw 
        }*/
    };
    
    return (
        <>
            <p aria-live="polite" id="password-text" className="sr-only">Password hidden.</p>
            { 
                props.isRequired 
                ?
                    <RequiredInput type="password" label={props.label} inputName={props.inputName} />
                : 
                <>
                    <Form.Label htmlFor={props.inputName}>{props.label}</Form.Label>
                    <Form.Control type="password" value={props.value} name={props.inputName} id={props.inputName} />
                </>
            }
            <Button variant="secondary" onClick={onShowHidePassword} aria-pressed="false">{buttonContents}</Button>
        </>
    );
}