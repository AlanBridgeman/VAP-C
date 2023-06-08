import { Form } from "react-bootstrap";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

/**
 * This interface denotes the required and optional properties of this 
 * React component
 * 
 * label (string) - The displayed label
 * inputName (string) - The name provided to the input fields
 * type (string - constrained) - The type of input control (see https://developer.mozilla.org/en-US/docs/Learn/Forms/HTML5_input_types)
 */
interface props {
    label: string | JSX.Element,
    inputName: string,
    type: 'text' | 'email' | 'search' | 'tel' | 'url' | 'number' | 'date' | 'password',
    children?: any[]
};

/**
 * This is a React component for required fields in particular it is for 
 * ease of use within forms while being accessible
 * 
 * @see https://userway.org/blog/html-required-versus-aria-required
 * @param props - The properties of the component (see interface above for specifics)
 * @returns - JSX code of the component
 */
export default function RequiredInput(props: props) {
    return (
        <>
            <Form.Label htmlFor={props.inputName}>{props.label}<FontAwesomeIcon icon={['fal','asterisk']} style={{color: 'red', width: '0.8rem', height: '0.8rem', verticalAlign: 'middle'}} /><span className="sr-only">(required)</span></Form.Label>
            { props.children }
            <Form.Control type={props.type} name={props.inputName} id={props.inputName} style={{ backgroundColor: "#FFBABA" }}required />
        </>
    )
}