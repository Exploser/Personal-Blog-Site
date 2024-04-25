import { useEffect, useState } from "react";
import Post from "../Post";

const apiUrl = process.env.REACT_APP_API_URL;

export default function IndexPage() {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    fetch(`${apiUrl}post`).then(response => {
      response.json().then(posts => {
        setPosts(posts);
      });
    });
  }, []);
  return (
    <>
      {posts.length > 0 && posts.map(post => (
        <Post {...post} />
      ))}
    </>
  );
}
