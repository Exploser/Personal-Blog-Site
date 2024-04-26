import { useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./UserContext";
const apiUrl = process.env.REACT_APP_API_URL;
export default function Header() {
  const { setUserInfo, userInfo } = useContext(UserContext);
  useEffect(() => {
    let isMounted = true; // Flag to check the mounted status
    fetch(`${apiUrl}profile`, {
      credentials: 'include',
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Network response was not ok.');
      })
      .then(userInfo => {
        if (isMounted) {
          setUserInfo(userInfo);
        }
      })
      .catch(error => console.error('Error fetching profile:', error));
    return () => {
      isMounted = false; // Set it to false when the component unmounts
    };
  }, [setUserInfo]); // Dependency array to ensure effect runs only if setUserInfo changes
  function logout() {
    fetch(`${apiUrl}logout`, {
      credentials: 'include',
      method: 'POST',
    })
      .then(response => {
        if (response.ok) {
          setUserInfo(null);
        } else {
          throw new Error('Logout failed');
        }
      })
      .catch(error => console.error('Error during logout:', error));
  }
  const username = userInfo?.username;

  return (
    <header>
      <Link to="/" className="logo">
        <img src="https://firebasestorage.googleapis.com/v0/b/blogs-27e6d.appspot.com/o/blogs-logo-smaller.png?alt=media&token=b3dbbb97-ed87-4edd-bf78-be620912a8f5" />
        <p>Exploser's Blog</p>
      </Link>
      <nav>
        {username ? (
          <>
            <Link to="/create">Create new post</Link>
            <a href="#logout" onClick={logout}>Logout</a> {/* Improved accessibility by adding href */}
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </nav>
    </header>
  );
}
