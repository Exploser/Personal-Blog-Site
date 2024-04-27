import { useContext, useState } from "react";
import { Navigate } from "react-router-dom";
import { UserContext } from "../UserContext";

const apiUrl = process.env.REACT_APP_API_URL;

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [redirect, setRedirect] = useState(false);
  const { setUserInfo } = useContext(UserContext);

  async function login(ev) {
    ev.preventDefault();

    try {
      const response = await fetch(`${apiUrl}login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, email, password })
      });

      if (response.ok) {
        const userInfo = await response.json();
        setUserInfo(userInfo);
        setRedirect(true);

      } else {
        // Handle HTTP errors e.g., 401, 403, etc.
        alert("Wrong Credentials"); // Correct spelling error in alert
      }
    } catch (error) {
      // Handle network errors
      console.error('Login failed:', error);
      alert('Failed to connect. Please try again later.');
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }
  return (
    <form className="login" onSubmit={login}>
      <h1>Login</h1>
      <input type="text"
        placeholder="Username"
        value={username}
        onChange={ev => setUsername(ev.target.value)} />

      <input type="password"
        placeholder="Password"
        value={password}
        onChange={ev => setPassword(ev.target.value)} />

      <button>Login</button>
    </form>
  );
}
