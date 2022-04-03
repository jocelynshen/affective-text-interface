import React, { Component } from 'react'
import {Recorder} from 'react-voice-recorder'
import 'react-voice-recorder/dist/index.css'
import axios from '../node_modules/axios';
 
class App extends Component {
  constructor(props) {
    super(props)
 
    this.state = {
      audioDetails: {
        url: null,
        blob: null,
        chunks: null,
        duration: {
          h: null,
          m: null,
          s: null,
          }
        }
    }
  }
 
  handleAudioStop(data){
    console.log(data)
    this.setState({ audioDetails: data });
  }

  handleAudioUpload(file) {
    console.log(file);
    // axios.get("http://127.0.0.1:5000/testing/")
    //   .then(function (response) {
    //     // handle success
    //     console.log(response);
    //   })
    //   .catch(function (error) {
    //     // handle error
    //     console.log(error);
    //   })
    const formData = new FormData();
    formData.append("audioFile", file);
    axios.post("http://127.0.0.1:5000/upload/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
      .then(function (response) {
        // handle success
        console.log(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      })
  }
  handleReset() {
    const reset = {
      url: null,
      blob: null,
      chunks: null,
      duration: {
        h: null,
        m: null,
        s: null,
      }
    }
    this.setState({ audioDetails: reset });
  }
 
  render() {
 
    return (
      <React.Fragment>    
        <Recorder
          record={true}
          title={"Record audio (1 minute limit)"}
          audioURL={this.state.audioDetails.url}
          showUIAudio
          handleAudioStop={data => this.handleAudioStop(data)}
          handleOnChange={(value) => this.handleOnChange(value, 'firstname')}
          handleAudioUpload={data => this.handleAudioUpload(data)}
          handleReset={() => this.handleReset()}
          // mimeTypeToUseWhenRecording={'audio/wave'}
        />
        <div>
          
        </div>
      </React.Fragment>
    )
  }
}

export default App;