export default function Post() {
  return (
    <div className='post'>
      <div className='images'>
        <img src='https://i.ibb.co/hLJNytx/image.png'></img>
      </div>
      <div className='texts'>
        <h2> Test Title </h2>
        <p className='info'>
          <a className='author'>Exploser </a>
          <time>NOW</time>
        </p>
        <p className='description'> lorem20 </p>
      </div>
    </div>
  );
}
