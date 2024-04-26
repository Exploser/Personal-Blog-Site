import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";


const firebaseUrl = process.env.REACT_APP_FIREBASE_URL;

const firebaseExt = process.env.REACT_APP_FIREBASE_EXT;

function convertToFirebaseUrl(storageUrl) {
  const matches = storageUrl.match(/https:\/\/storage\.googleapis\.com\/([^\/]+)\/(.+)/);
  if (matches && matches.length === 3) {
    const bucketName = matches[1];
    const filePath = matches[2].replace(new RegExp("/", "g"), "%2F");
    return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${filePath}?alt=media`;
  }
  return storageUrl; // return the original URL if it doesn't match the expected pattern
}

export default function Post({ _id, title, description, cover, createdAt, author }) {
  const convertedCover = convertToFirebaseUrl(cover);
  return (
    <div className='post'>
      <div className='images'>
        <Link to={`/post/${_id}`}>
          <img src={`${convertedCover}`} alt="Blog"></img>
        </Link>
      </div>
      <div className='texts'>
        <Link to={`/post/${_id}`}>
          <h2>{title}</h2>
        </Link>
        <p className='info'>
          <p className='author'>{author.username}</p>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className='description'>{description}</p>
      </div>
    </div>
  );
}
