import './App.css';

function App() {
  return (
    <main>
      <header>
        <a href='' className='logo'>Exploser's Blog</a>
        <nav>
          <a href=''>Login</a>
          <a href=''>Register</a>
        </nav>
      </header>
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
    </main>
  );
}

export default App;
