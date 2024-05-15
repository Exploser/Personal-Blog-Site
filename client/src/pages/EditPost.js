import { useEffect, useState } from "react";
import Editor from "../Editor";
import { Navigate, useParams } from "react-router-dom";
import 'react-quill/dist/quill.snow.css';
import ReactGA from 'react-ga';

const apiUrl = process.env.REACT_APP_API_URL;

export default function EditPost() {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [cover, setCover] = useState('');
  const [files, setFiles] = useState('');
  const [redirect, setRedirect] = useState(false);

  ReactGA.initialize('G-NR6K22996F', {
    debug: true,
    titleCase: false,
    gaOptions: {
      userId: 123
    }
  });

  useEffect(() => {
    fetch(`${apiUrl}post/${id}`)
      .then(response => {
        response.json().then(postInfo => {
          setTitle(postInfo.title);
          setContent(postInfo.content);
          setDescription(postInfo.description);
          setCover(postInfo.cover);
        });
      });
  }, [id]);

  function convertToFirebaseUrl(storageUrl) {
    const matches = storageUrl.match(/https:\/\/storage\.googleapis\.com\/([^\/]+)\/(.+)/);
    if (matches && matches.length === 3) {
      const bucketName = matches[1];
      const filePath = matches[2].replace(new RegExp("/", "g"), "%2F");
      return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${filePath}?alt=media`;
    }
    return storageUrl; // return the original URL if it doesn't match the expected pattern
  }

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
    const response = await fetch(`${apiUrl}post`, {
      method: 'PUT',
      body: formData,
      credentials: 'include'
    });

    if (response.ok) {
      setRedirect(true);
    }
    ReactGA.event({
      category: 'User',
      action: 'Created an Account'
    });
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
          {cover && <img src={`${convertToFirebaseUrl(cover)}`}
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
