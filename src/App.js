import { useEffect, useState } from "react";
import "./App.css";

import beepFull from "./audios/beepFull.mp3";
import beepQuarter from "./audios/beepQuarter.mp3";

function App() {
  // reactive variables: UI and CSS
  const [status, setStatus] = useState("waiting"); //waiting || running || paused
  const [phase, setPhase] = useState("configuration"); // configuration || session || break
  const [finalSeconds, setFinalSeconds] = useState("notFinalSeconds"); //notFinalSeconds || finalSeconds
  const [disabledButton, setDisabledButton] = useState("buttonsState");// "" || disabledButton
  // reactive variables: logic
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [sessionLength, setSessionLength] = useState(0);
  const [sessionLengthMMSS, setSessionLengthMMSS] = useState("00:00");
  const [breakLength, setBreakLength] = useState(0);
  const [breakLengthMMSS, setBreakLengthMMSS] = useState("00:00");
  const [timerLength, setTimerLength] = useState(0);
  const [timerLengthMMSS, setTimerLengthMMSS] = useState("00:00");

  const [intervalID, setIntervalID] = useState()
  // internal variables
  // store id of interval to be able to stop it inside interval callback;
  let id;

  const alarmEnd = new Audio(beepFull);
  const alarmProximity = new Audio(beepQuarter);

  function changeSessionLength(variation) {
    console.log(`changeSessionLength called with variation: ${variation}`);
    // disable buttons if timer is running
    if (phase !== "configuration") {
      return undefined;
    }
    // between 00:00 and 59:59
    switch (variation) {
      case 1000:
        if (sessionLength >= 0 && sessionLength < 3599000) {
          setSessionLength(sessionLength + variation);
        }
        break;
      case -1000:
        if (sessionLength <= 3599000 && sessionLength >= 1000) {
          setSessionLength(sessionLength + variation);
        }
        break;
      case 60000:
        if (sessionLength >= 0 && sessionLength < 3540000) {
          setSessionLength(sessionLength + variation);
        }
        break;
      case -60000:
        if (sessionLength <= 3599000 && sessionLength >= 60000) {
          setSessionLength(sessionLength + variation);
        }
        break;
      default:
        break;
    }
  }

  function changeBreakLength(variation) {
    console.log(`changeBreakLength called with variation: ${variation}`);
    // disable buttons if timer is running
    if (phase !== "configuration") {
      return undefined;
    }
    // between 00:00 and 59:59
    switch (variation) {
      case 1000:
        if (breakLength >= 0 && breakLength < 3599000) {
          setBreakLength(breakLength + variation);
        }
        break;
      case -1000:
        if (breakLength <= 3599000 && breakLength >= 1000) {
          setBreakLength(breakLength + variation);
        }
        break;
      case 60000:
        if (breakLength >= 0 && breakLength < 3540000) {
          setBreakLength(breakLength + variation);
        }
        break;
      case -60000:
        if (breakLength <= 3599000 && breakLength >= 60000) {
          setBreakLength(breakLength + variation);
        }
        break;
      default:
        break;
    }
  }

  function conversionMStoMMSS(ms) {
    //console.log(`conversionMStoMMSS called with: ${ms}`);
    const minsec = new Date(ms).toISOString().slice(14, 19);
    //console.log(`conversionMStoMMSS returns: ${minsec}`);
    return minsec;
  }

  function convertSessionLength() {
    //console.log("convertSessionLength()");
    setSessionLengthMMSS(conversionMStoMMSS(sessionLength));
  }

  function convertBreakLength() {
    //console.log("convertBreakLength()");
    setBreakLengthMMSS(conversionMStoMMSS(breakLength));
  }

  function convertTimerLength() {
    //console.log("convertTimerLength()");
    setTimerLengthMMSS(conversionMStoMMSS(timerLength));
  }

  // effects to make unit conversion from ms to mm:ss everytime configuration is changed
  useEffect(convertSessionLength, [sessionLength]);
  useEffect(convertBreakLength, [breakLength]);
  useEffect(convertTimerLength, [timerLength]);

  function setTimerToSessionLength() {
    setTimerLength(sessionLength);
    setTimerLengthMMSS(sessionLengthMMSS);
  }

  function setTimerToBreakLength() {
    setTimerLength(breakLength);
    setTimerLengthMMSS(breakLengthMMSS);
  }

  // effect to set timer to the value of session during configuration
  useEffect(setTimerToSessionLength, [sessionLength]);

  function startTimerInterval() {
    console.log("startTimerInterval");
    id = setInterval(updateTimer, 1000);
    setIntervalID(id)
  }

  function stopTimerInterval(id=intervalID) {
    console.log(`stopTimerInterval id: ${id}`);
    clearInterval(id);
  }

  //passing a function to the `useState` hook that takes the previous state as an argument and returns the new state.
  function updateTimer() {
    console.log("updateTimer");
    console.log(`phase ${phase} ;intervalID: ${id}`);
    setTimerLength((prevTimerLength) => {
      if ((sessionLength > 0 || breakLength > 0) && prevTimerLength > 11000) {
        return prevTimerLength - 1000;
      } else if (
        (sessionLength > 0 || breakLength > 0) &&
        prevTimerLength <= 11000 &&
        prevTimerLength > 0
      ) {
        setFinalSeconds("finalSeconds");
        alarmProximity.play();
        return prevTimerLength - 1000;
      } else {
        alarmEnd.play();
        stopTimerInterval(id);
        setFinalSeconds("notFinalSeconds");
        setPhase((prevPhase) => {
          if (prevPhase === "session") {
            setSessionsCompleted((prevSessionsCompleted) => {
              return prevSessionsCompleted + 1;
            });
            setTimerToBreakLength();
            return "break";
          } else if (prevPhase === "break") {
            setTimerToSessionLength();
            return "session";
          }
        });
        startTimerInterval();
        return prevTimerLength;
      }
    });
  }

  function handlePlayClick() {
    if(timerLength===0){
      return undefined;
    }
    setDisabledButton("disabledButton")
    switch (phase) {
      case "configuration":
        setPhase("session");
        setStatus("running");
        startTimerInterval();
        break;
      case "session":
      case "break":
        
        if (status === "running") {
          setStatus("paused");
          stopTimerInterval();
        } else if (status === "paused") {
          setStatus("running");
          startTimerInterval();
        }
        break;
      default:
        break;
    }
  }

  function resetAll() {
    console.log("resetAll");
    setSessionLength(0);
    setBreakLength(0);
    setSessionsCompleted(0);
    
    setPhase("configuration");
    setStatus("waiting");
    setFinalSeconds(false);
    setDisabledButton();

    stopTimerInterval();
    setIntervalID();
    id = undefined;
  }

  return (
    <>
      <header>Timer</header>
      <main>
        <p id="instructions">Set lenghts in minutes and seconds</p>
        <section className="configuration">
          <div className="length">
            <h5>Session</h5>
            <div className="increments">
              <button
                type="button"
                className={`increment ${disabledButton}`}
                onClick={() => changeSessionLength(60000)}
              ></button>
              <button
                type="button"
                className={`increment ${disabledButton}`}
                onClick={() => changeSessionLength(1000)}
              ></button>
            </div>
            <div className="display">{sessionLengthMMSS}</div>
            <div className="decrements">
              <button
                type="button"
                className={`decrement ${disabledButton}`}
                onClick={() => changeSessionLength(-60000)}
              ></button>
              <button
                type="button"
                className={`decrement ${disabledButton}`}
                onClick={() => changeSessionLength(-1000)}
              ></button>
            </div>
          </div>
          <div className="buttonPad">
            <button id="play" onClick={handlePlayClick}></button>
            <button id="reset" onClick={resetAll}></button>
          </div>
          <div className="length">
            <h5>Break</h5>
            <div className="increments">
              <button
                type="button"
                className={`increment ${disabledButton}`}
                onClick={() => changeBreakLength(60000)}
              ></button>
              <button
                type="button"
                className={`increment ${disabledButton}`}
                onClick={() => changeBreakLength(1000)}
              ></button>
            </div>
            <div className="display">{breakLengthMMSS}</div>
            <div className="decrements">
              <button
                type="button"
                className={`decrement ${disabledButton}`}
                onClick={() => changeBreakLength(-60000)}
              ></button>
              <button
                type="button"
                className={`decrement ${disabledButton}`}
                onClick={() => changeBreakLength(-1000)}
              ></button>
            </div>
          </div>
        </section>

        <section className="monitor">
          <h5>{`${phase} ${status}`}</h5>
          <div className={`display timer ${finalSeconds}`}>
            {timerLengthMMSS}
          </div>
          <div className="display">Completed sessions: {sessionsCompleted}</div>
        </section>
      </main>
      <footer>Gonzalo M.G.</footer>
    </>
  );
}

export default App;
