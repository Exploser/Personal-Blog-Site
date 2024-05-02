import { useEffect, useState } from "react";
import Post from "../Post";
import 'bootstrap/dist/css/bootstrap.min.css';

const apiUrl = process.env.REACT_APP_API_URL;

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // State to manage loading status

  useEffect(() => {
    fetch(`${apiUrl}post`)
      .then(response => response.json())
      .then(data => {
        setPosts(data);
        setIsLoading(false); // Set loading to false after data is fetched
      })
      .catch(err => {
        console.error('Failed to fetch posts:', err);
        setIsLoading(false); // Also set loading to false on error
      });
  }, []);

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
      {posts.length > 0 ? (
        posts.map(post => (
          <Post key={post._id} {...post} />
        ))
      ) : (
        <p className="text-center">No posts available.</p>
      )}
    </>
  );
}
