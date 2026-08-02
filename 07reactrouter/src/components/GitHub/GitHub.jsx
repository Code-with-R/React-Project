import  { useEffect, useState } from 'react';
import {useLoaderData} from "react-router-dom";

function GitHub() {
    const data = useLoaderData();
    // const [data, setData] = useState([]);
    // useEffect(() => {

    //     fetch('https://api.github.com/users/Code-with-R')
    //     .then(response => response.json())
    //     .then(data => {
    //         console.log(data);
    //         setData(data);
    //     })
    // }, [])
  return (
    <div className='text-center m-5 bg-blue-500 text-white p-5 text-3xl'>GitHub Followers: {data.followers}
    <img className='' src={data.avatar_url} alt="Git picture" width={300} height={100} />
    </div>
  )
}

export default GitHub;

export const githubInfoLoader = async () => {
    const response = await fetch('https://api.github.com/users/Code-with-R');
    return response.json();
}
