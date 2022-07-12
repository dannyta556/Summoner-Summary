
import './App.css';
import { useCallback, useState } from 'react';
import axios from 'axios';
import html2canvas from 'html2canvas';
import downloadjs from 'downloadjs';


function App() {
  const [searchText, setSearchText] = useState("");
  const [searchRegion, setSearchRegion] = useState("NA1");
  const [summary, setSummary] = useState({});
  const [winRate, setWinRate] = useState(0);
  const [isSearching, setSearching] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [isValid, setValid] = useState(true);

  // calculates win rate
  function calculateWinRate(win, loss) {
    let num = (parseInt(win.wins) / (parseInt(win.wins) + parseInt(loss.losses))) * 100;
    setWinRate(num.toFixed(2))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      getPlayerSummary()
    }
  }
  // get image
  const handleCaptureImage = useCallback(async () => {
    const resultsElement = document.querySelector('.results-container');
    if (!resultsElement) return;

    const canvas = await html2canvas(resultsElement, { letterRendering: 1, useCORS: true });
    const dataURL = canvas.toDataURL('image/png');
    downloadjs(dataURL, 'summoner-summary.png', 'image/png');
    setDownloaded(true);
  }, []);

  function checkValidSummoner(mainChamp) {
    console.log("We in here")
    if (mainChamp.mainChamp === "NULL") {
      setValid(false)
    }
  }
  // pulls player data from the api
  function getPlayerSummary(event) {
    setSearching(true);
    setValid(true);
    axios.get("http://localhost:4000/summary", { params: { username: searchText, region: searchRegion } })
      .then(function (response) {
        let data = response.data
        if (data.name !== "AxiosError") {
          let summonerName = { name: data.name }
          let summonerLevel = { level: data.level }
          let summonerIcon = { icon: data.icon }
          let summonerRank = { rank: data.rank }
          let summonerTier = { tier: data.tier }
          let summonerLP = { lp: data.lp }
          let summonerWins = { wins: data.wins }
          let summonerLosses = { losses: data.losses }
          let mainChamp = { mainChamp: data.mainChamp }
          let championNames = { championNames: data.championNames }
          let championLevels = { championLevels: data.championLevels }
          let championPoints = { championPoints: data.championPoints }

          setSummary(summary => ({
            ...summary,
            ...summonerName,
            ...summonerLevel,
            ...summonerIcon,
            ...summonerRank,
            ...summonerTier,
            ...summonerLP,
            ...summonerWins,
            ...summonerLosses,
            ...mainChamp,
            ...championNames,
            ...championLevels,
            ...championPoints
          }));


          calculateWinRate(summonerWins, summonerLosses);
          checkValidSummoner(mainChamp);
          setSearching(false);
          setDownloaded(false);
        }
      }).catch(function (error) {
        console.log(error);
        setSearching(false);
        setDownloaded(false);
      })

  }

  return (
    <div className="App">
      <header className='main-header'>
        <h1 className='title'>Summoner Summary</h1>
      </header>
      <div className="container">
        <select className="region-select" name="regions" id="regions" onChange={e => setSearchRegion(e.target.value)}>
          <option value="NA1">NA</option>
          <option value="EUN1">EUNE</option>
          <option value="EUW1">EUW</option>
          <option value="KR">KR</option>
          <option value="BR1">BR</option>
          <option value="JP1">JP</option>
          <option value="LA1">LAN</option>
          <option value="LA2">LAS</option>
          <option value="OC1">OCE</option>
          <option value="TR1">TR</option>
          <option value="RU">RU</option>
        </select>
        <input className="summoner-search-box" type="text" onChange={e => setSearchText(e.target.value)} onKeyDown={handleKeyDown} maxLength="16"></input>
        <button className="search-btn btn" onClick={getPlayerSummary} disabled={isSearching}>
          {isSearching && (
            <span className="spinner-container">
              <div className="loading-spinner" />
            </span>

          )}
          {isSearching === false ? <span>Get Summary </span> : <span className="search-text">Loading</span>}</button>
        {Object.keys(summary).length !== 0 && isSearching === false ?
          <>
            {
              isValid ? <>
                <div className='results-container' style={{ backgroundImage: "url(http://ddragon.leagueoflegends.com/cdn/img/champion/splash/" + summary.mainChamp + "_0.jpg)", backgroundSize: 'cover', objectFit: 'cover', width: '100%' }}>
                  <div className="top-half">
                    <div className='summoner-img-wrapper'>
                      <img className="summoner-icon-img" width="125" height="125" src={"http://ddragon.leagueoflegends.com/cdn/12.10.1/img/profileicon/" + summary.icon + ".png"} alt="summoner-icon"></img>
                      <p className='summoner-level-text'>{"Level: " + summary.level}</p>
                    </div>
                    <div className='summoner-title-wrapper'>
                      <p className="summoner-name-title">{summary.name}</p>
                      {summary.rank !== "unranked" ? <>
                        <p className="summoner-ranked-title">{summary.tier + " " + summary.rank + " " + summary.lp + " LP "}</p>
                        <p className='summoner-ranked-title'>{summary.wins + " W / " + summary.losses + " L "}</p>
                        <p className='summoner-ranked-title'>{winRate + "% WR"}</p>
                      </> : <></>}
                    </div>
                    {summary.rank !== "unranked" ? <>
                      <div className='ranked-img-wrapper'>
                        <img className="ranked-icon-img" width="150" height="150" src={process.env.PUBLIC_URL + `images/Emblem_${summary.tier}.png`} alt="ranked-icon"></img>
                      </div>
                    </> :
                      <>
                      </>
                    }
                  </div>
                  <p className='top-champions-label'>Top 5 Champions</p>
                  <div className="champion-section">
                    <span className="champion-info">
                      <img className="champion-icon-img" src={"http://ddragon.leagueoflegends.com/cdn/12.11.1/img/champion/" + summary.championNames[3] + ".png"} alt="champion-icon"></img>
                      <p className='champion-name'>{summary.championNames[3]}</p>
                      <p className='champion-level'>{"Mastery Level " + summary.championLevels[3]}</p>
                      <p className='champion-points'>{summary.championPoints[3].toLocaleString("en-US") + " points"}</p>
                    </span>
                    <span className="champion-info">
                      <img className="champion-icon-img" src={"http://ddragon.leagueoflegends.com/cdn/12.11.1/img/champion/" + summary.championNames[1] + ".png"} alt="champion-icon"></img>
                      <p className='champion-name'>{summary.championNames[1]}</p>
                      <p className='champion-level'>{"Mastery Level " + summary.championLevels[1]}</p>
                      <p className='champion-points'>{summary.championPoints[1].toLocaleString("en-US") + " points"}</p>
                    </span>
                    <span className="champion-info">
                      <img className="champion-icon-img" src={"http://ddragon.leagueoflegends.com/cdn/12.11.1/img/champion/" + summary.championNames[0] + ".png"} alt="champion-icon"></img>
                      <p className='champion-name'>{summary.championNames[0]}</p>
                      <p className='champion-level'>{"Mastery Level " + summary.championLevels[0]}</p>
                      <p className='champion-points'>{summary.championPoints[0].toLocaleString("en-US") + " points"}</p>
                    </span>
                    <span className="champion-info">
                      <img className="champion-icon-img" src={"http://ddragon.leagueoflegends.com/cdn/12.11.1/img/champion/" + summary.championNames[2] + ".png"} alt="champion-icon"></img>
                      <p className='champion-name'>{summary.championNames[2]}</p>
                      <p className='champion-level'>{"Mastery Level " + summary.championLevels[2]}</p>
                      <p className='champion-points'>{summary.championPoints[2].toLocaleString("en-US") + " points"}</p>
                    </span>
                    <span className="champion-info">
                      <img className="champion-icon-img" src={"http://ddragon.leagueoflegends.com/cdn/12.11.1/img/champion/" + summary.championNames[4] + ".png"} alt="champion-icon"></img>
                      <p className='champion-name'>{summary.championNames[4]}</p>
                      <p className='champion-level'>{"Mastery Level " + summary.championLevels[4]}</p>
                      <p className='champion-points'>{summary.championPoints[4].toLocaleString("en-US") + " points"}</p>
                    </span>
                  </div>
                </div>
                <button className="download-btn btn" onClick={handleCaptureImage} disabled={downloaded}>
                  {downloaded === true ? <span> ✓ Downloaded</span> : <span>Download Image</span>}
                </button>
              </>
                :
                <> <h3>Summoner not found</h3></>
            }
          </>
          :
          <>

          </>
        }
      </div>

      <footer className='main-footer'>

      </footer>
    </div>
  );
}

export default App;
