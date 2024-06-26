import { useState } from "react";
import { Navigate } from "react-router-dom";
import 'react-quill/dist/quill.snow.css';
import Editor from "../Editor";

const apiUrl = process.env.REACT_APP_API_URL;

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [files, setFiles] = useState('');
  const [redirect, setRedirect] = useState(false);

  async function createNewPost(ev) {
    const data = new FormData();
    data.set('title', title);
    data.set('description', description);
    data.set('content', content);
    data.set('file', files[0]);

    ev.preventDefault();
    const response = await fetch(`${apiUrl}post`, {
      method: 'POST',
      body: data,
      credentials: 'include',
    });
    if (response.ok) {
      setRedirect(true);
    }
  }

  if (redirect) {
    return <Navigate to={'/'} />
  }

  return (
    <form onSubmit={createNewPost}>

      <input type="title"
        placeholder={"Title"}
        value={title}
        onChange={ev => setTitle(ev.target.value)} />

      <input type="description"
        placeholder={"Description"}
        value={description}
        onChange={ev => setDescription(ev.target.value)}
      />
      <input type="file" onChange={ev => setFiles(ev.target.files)} />

      <Editor onChange={setContent} value={content} />

      <button style={{ marginTop: '10px' }}>Post</button>

    </form>
  );
}
