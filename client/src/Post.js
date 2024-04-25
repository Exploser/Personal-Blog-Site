import { format, formatISO9075 } from "date-fns";

export default function Post({ title, description, cover, content, createdAt, author }) {
  console.log("createdAt:", createdAt);
  return (
    <div className='post'>
      <div className='images'>
        <img src={'http://localhost:4000/' + cover}></img>
      </div>
      <div className='texts'>
        <h2>{title}</h2>
        <p className='info'>
          <a className='author'>{author.username}</a>
          <time>{formatISO9075(new Date(createdAt))}</time>
        </p>
        <p className='description'> lorem20 </p>
      </div>
    </div>
  );
}
