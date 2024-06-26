import { useState } from "react";

const apiUrl = process.env.REACT_APP_API_URL;

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');

  async function register(ev) {
    ev.preventDefault();
    const response = await fetch(`${apiUrl}register`, {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      headers: { 'Content-Type': 'application/json' },
    });
    if (response.status === 200) {
      alert('Registration Successful')
    } else {
      alert('Registration Failed')
    }
  }

  return (
    <form className="register" onSubmit={register}>
      <h1>Register</h1>

      <input type="text"
        placeholder="Username"
        value={username}
        onChange={ev => setUsername(ev.target.value)} />

      <input type="text"
        placeholder="Email"
        value={email}
        onChange={ev => setEmail(ev.target.value)} />

      <input type="password"
        placeholder="Password"
        value={password}
        onChange={ev => setPassword(ev.target.value)} />
      <button>Register</button>
    </form>
  );
}
