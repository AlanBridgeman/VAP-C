import { Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

interface props {
    onSubmit: (e: any) => void | Promise<void>,
    children: any[]
}

export default function FormWithRequiredInput(props: props) {
    return (
        <Form onSubmit={props.onSubmit}>
          <Form.Text style={{color: "red"}}>All Required fields are denoted by an asterisk (<FontAwesomeIcon icon={['fal', 'asterisk']} />), slight pink color, and include required in the title for screen readers</Form.Text>
          {props.children}
        </Form>
    )
}