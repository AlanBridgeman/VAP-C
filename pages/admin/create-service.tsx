import { useState } from "react";
import { Form, Button } from "react-bootstrap";

export default function CreateService() {
    const [notification, setNotification]: [string, any] = useState();
    const [errorMsg, setErrorMsg]: [string, any] = useState();

    function close(e) {
        if(e.currentTarget.id == 'notification-close') {
            setNotification(null);
        }
        if(e.currentTarget.id == 'error-close') {
            setErrorMsg(null);
        }
    }
    async function submit(e) {
        e.preventDefault();
    
        const body = {
          name: e.currentTarget.name.value,
          //e.currentTarget.date.valueAsNumber
        }
    
        const res = await fetch('/api/payments/create-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
    
        if (res.status === 201) {
          const productObj = await res.json()
          // set user to useSWR state
          setNotification('Created product ' + productObj.productId);
        }
        else {
          setErrorMsg('Something went wrong')
        }
    }

    return (
        <>
            {
                notification && 
                <div style={{display: 'block'}}>
                    <p style={{ backgroundColor: "green" }}>
                        {notification}
                    </p>
                    <Button id="notification-close" variant="secondary" onClick={close}>Close</Button>
                </div>
            }
            {
                errorMsg && 
                <div style={{backgroundColor: 'red', display: 'block', height: '2rem'}}>
                    <span style={{ height: '100%'}}>
                        {errorMsg}
                    </span>
                    {' '}
                    <Button id="error-close" style={{ height: '100%', verticalAlign: 'middle' }} variant="secondary" onClick={close}>Close</Button>
                </div>
            }
            <Form onSubmit={submit}>
                <Form.Group>
                    <Form.Label htmlFor="name">Name:</Form.Label>
                    <Form.Control type="text" name="name" id="name" />
                </Form.Group>
                <Form.Group>
                    <Button variant="primary" type="submit">Create</Button>
                </Form.Group>
            </Form>
        </>
    )
}