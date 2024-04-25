import { formatISO9075 } from "date-fns";
import { Link } from "react-router-dom";

const apiUrl = process.env.REACT_APP_API_URL;

export default function Post({ _id, title, description, cover, createdAt, author }) {
  return (
    <div className='post'>
      <div className='images'>
        <Link to={`/post/${_id}`}>
          <img src={apiUrl + cover} alt="Blog"></img>
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
