"use client"
import { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player/youtube';
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios"

function App() {
  const [url, setUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [error, setError] = useState(false);
  const [visible, setIsVisible] = useState(false);
  const [ allVideo , setAllVideo ] = useState([]);
  const [duration, setDuration] = useState(0);
  const [watchProgress, setWatchProgress] = useState({
    playedSeconds: 0,
    playedPercent: 0,
  });
  const [watchTime, setWatchTime] = useState(0);
  const [watchedSeconds, setWatchedSeconds] = useState(new Set());

  const playerRef = useRef(null);
  const lastPlayedRef = useRef(0);

  const extractVideoId = (link) => {
    const regExp =
      /(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|embed|shorts)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
    const match = link.match(regExp);
    return match ? match[1] : '';
  };

  const all = async()=>{
    const res = await axios.get("/get");
    setAllVideo(res.data)
    console.log("a;;vedio",res);
  }

  useEffect(()=>{
    all()
  },[])

  const handlePlay = () => {
    if(inputUrl.trim() === ""){
      toast.error("Empty field" ,{ position :"top-right" , autoClose:1000 })
      return;
    }
    setUrl(inputUrl.trim());
    setError(false);
    setWatchProgress({ playedSeconds: 0, playedPercent: 0 });
    setWatchTime(0);
    setWatchedSeconds(new Set());
    lastPlayedRef.current = 0;
  };

  const handleDuration = (d) => {
    setDuration(d);
  };  

  const handleError = () => {
    setError(true);
  };

  const handleProgress = (state) => {
    const current = state.playedSeconds;
    const roundedSecond = Math.floor(current);

    setWatchedSeconds((prevWatched) => {
      if (!prevWatched.has(roundedSecond)) {
        const updatedSet = new Set(prevWatched);
        updatedSet.add(roundedSecond);
        setWatchTime(updatedSet.size);

        const videoId = extractVideoId(url);
        localStorage.setItem(
          `progress_${videoId}`,
          JSON.stringify({
            playedSeconds: current,
            watched: Array.from(updatedSet),
          })
        );

        saveProgressToDB(url, current, updatedSet);

        return updatedSet;
      }
      return prevWatched;
    });

    setWatchProgress({
      playedSeconds: current,
      playedPercent: Math.round(state.played * 100),
    });

    lastPlayedRef.current = current;
  };

  const saveProgressToDB = async (url, playedSeconds , watched) => {
    try {
      const wt = Array.from(watched);
      const res = await axios.post("/add",{ url , playedSeconds , watched : wt});
      console.log("res",res);
    } catch (err) {
      console.error('Failed to save progress:', err);
    }
  };  

  const handleReady = () => {
    const videoId = extractVideoId(url);
    const saved = JSON.parse(localStorage.getItem(`progress_${videoId}`));
    if (saved?.playedSeconds) {
      playerRef.current.seekTo(saved.playedSeconds, 'seconds');
      lastPlayedRef.current = saved.playedSeconds;
    }
    if (Array.isArray(saved?.watched)) {
      const watchedSet = new Set(saved.watched);
      setWatchedSeconds(watchedSet);
      setWatchTime(watchedSet.size);
    }
  };

  return (
    <div className="min-h-screen relative bg-black flex flex-col items-center justify-center p-4">
      <ToastContainer />
      {/* {visible && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsVisible(false)}
        />
      )} */}
      <div className="absolute top-10 max-sm:right-5 right-20 bg-cyan-500 text-black rounded-md">
        <button className='h-full w-full hover:cursor-pointer p-2' onClick={() => setIsVisible(true)}>All Video</button>
      </div>
      <div className={`fixed max-sm:top-10 bottom-0 left-0 h-screen right-0 rounded-l-md rounded-r-md transform transition-transform duration-400 ${
          visible ? "translate-y-0" : "translate-y-full"
        } bg-white shadow-lg p-4`}>
        <div className=" w-full rounded-l-md rounded-r-md overflow-auto">
          <p onClick={() => setIsVisible(false)} className='text-black p-2 hover:cursor-pointer'>Close</p>
          {
            allVideo.length > 0 ? 
              allVideo.map((vedio)=> (
                <>
                 <div className="overflow-auto max-sm:bg-gray-500">
                 <div className="shadow-xl shadow-gray-600 p-2">
                 <p className='text-black p-2'>{vedio.url}</p>
                 <div className="flex items-center justify-center">
                  <p className='text-black p-2'>{vedio.playedSeconds}</p>
                  <p className='text-cyan-600 font-bold'>Seconds</p>
                 </div>
                 <p className='text-black p-2 overflow-auto'>{vedio.watched}</p>
                 </div>
                 </div>
                </>
              ))
            ) : (
              <p className='p-2'>No Video found!</p>
            )
          }
        </div>
      </div>
      <h1 className="text-2xl font-bold mb-4">🎥 YouTube Player with Accurate Unique Watch Time</h1>

      <input
        type="text"
        placeholder="Paste YouTube link"
        className="w-full max-w-md p-2 text-white max-sm:shadow-lg max-sm:shadow-cyan-200 border-none outline-none rounded-md mb-2 hover:shadow-lg hover:shadow-cyan-400"
        value={inputUrl}
        onChange={(e) => setInputUrl(e.target.value)}
      />

      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        onClick={handlePlay}
      >
        Play Video
      </button>

      {error && (
        <div className="text-red-600 mb-2">
          ❌ This video cannot be embedded due to restrictions.
        </div>
      )}

      {url && !error && (
        <>
          <div className="w-full max-w-2xl aspect-video mb-4">
            <ReactPlayer
              ref={playerRef}
              playsinline={true}
              url={url}
              controls
              width="100%"
              height="100%"
              onError={handleError}
              onProgress={handleProgress}
              onReady={handleReady}
              onDuration={handleDuration}
            />
          </div>

          {/* <div className="mb-2 text-gray-700">
            ▶️ Played: {Math.floor(watchProgress.playedSeconds)} sec (
            {watchProgress.playedPercent}%)
          </div> */}

          <div className="text-green-700 font-medium">
            ⏱️ Unique Watch Time: {watchTime} seconds
          </div>

          {duration > 0 && (
            <div className="text-blue-700 font-medium">
              📊 Unique Watch Percentage: {((watchTime / duration) * 100).toFixed(2)}%
            </div>
           )}
        </>
      )}
    </div>
  );
}

export default App;
