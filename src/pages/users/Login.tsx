import { useState, useEffect } from 'react';
import Router from 'next/router';
import Link from 'next/link';
import { Form, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUser } from '../../lib/hooks';
import FormWithRequiredInput from '../../components/forms/FormWithRequiredInput';
import RequiredInput from '../../components/forms/RequiredInput';
import ShowablePassword from '../../components/forms/ShowablePassword';

export default function LoginPage() {
  const [user, { mutate }] = useUser()
  const [errorMsg, setErrorMsg] = useState('');

  async function onSubmit(e) {
    e.preventDefault()

    const body = {
      email: e.currentTarget.email.value,
      password: e.currentTarget.password.value,
    }

    const res = await fetch('/api/users/Login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.status === 200) {
      const userObj = await res.json()
      // set user to useSWR state
      mutate(userObj)
    }
    else {
      setErrorMsg('Incorrect username or password. Try better!')
    }
  }

  useEffect(() => {
    // redirect to home if user is authenticated
    if (user) Router.push('/')
  }, [user])

  return (
    <>
      <h1>Login</h1>
      {errorMsg && <p className="error">{errorMsg}</p>}
      <div className="form-container">
        <FormWithRequiredInput onSubmit={onSubmit}>
          <Form.Group>
              <RequiredInput label="Email" inputName="email" type="email" />
          </Form.Group>
          <Form.Group>
            <ShowablePassword label="Password" inputName="password" isRequired={true} />
          </Form.Group>
          <br />
          <div className="submit">
            <Button variant="primary" type="submit">Login</Button>
            {' '}
            <Link href="/signup">
              <a>I don&apos;t have an account</a>
            </Link>
          </div>
        </FormWithRequiredInput>
      </div>
    </>
  )
}
