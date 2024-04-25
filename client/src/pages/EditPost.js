import { useEffect, useState } from "react";
import Editor from "../Editor";
import { Navigate, useParams } from "react-router-dom";
import 'react-quill/dist/quill.snow.css';

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [files, setFiles] = useState('');
  const [redirect, setRedirect] = useState(false);

  useEffect(() => {
    fetch('http://localhost:4000/post/' + id)
      .then(response => {
        response.json().then(postInfo => {
          setTitle(postInfo.title);
          setContent(postInfo.content);
          setDescription(postInfo.description);
          setCover(postInfo.cover);
        });
      });
  }, [id]);

  async function updatePost(ev) {
    ev.preventDefault();

    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('content', content);
    formData.append('id', id);
    if (files) {
      formData.append('file', files);  // Include the file only if a new file has been selected
    }
    const response = await fetch('http://localhost:4000/post', {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      setRedirect(true);
    }
  }

  // Function to handle file selection
  function handleFileChange(event) {
    const file = event.target.files[0]; // Get the first file (if multiple are selected, only the first one is used)
    if (file) {
      setFiles(file);
    }
  }

  if (redirect) {
    return <Navigate to={'/post/' + id} />
  }

  return (
    <form onSubmit={updatePost}>

      <input type="title"
        placeholder={"Title"}
        value={title}
        onChange={ev => setTitle(ev.target.value)} />

      <input type="description"
        placeholder={"Description"}
        value={description}
        onChange={ev => setDescription(ev.target.value)}
      />

      <input type="file"
        onChange={handleFileChange}
      />

      {/* Display the cover image if available */}
      <div className="edit-image">
        <div className="edit-image-current">
          Current Image
          {cover && <img src={'http://localhost:4000/' + cover}
            alt="Cover"
          />}
        </div>
        {/* Display the selected file as an image if available */}
        <div className="edit-image-new">
          New Image
          {files && <img src={URL.createObjectURL(files)}
            alt="Preview"
            onLoad={() => URL.revokeObjectURL(files)} />}
        </div>
      </div>

      <Editor onChange={setContent} value={content} />

      <button style={{ marginTop: '10px' }}>Post</button>

    </form>
  );

}
