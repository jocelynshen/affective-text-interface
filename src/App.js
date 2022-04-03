import React, { Component } from 'react'
import {Recorder} from 'react-voice-recorder'
import 'react-voice-recorder/dist/index.css'
import axios from '../node_modules/axios';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import 'bootstrap/dist/css/bootstrap.css';
import { Container } from 'react-bootstrap';

class App extends Component {
  constructor(props) {
    super(props)
 
    this.state = {
      textSamples: [],
      audioDetails: {
        url: null,
        blob: null,
        chunks: null,
        duration: {
          h: null,
          m: null,
          s: null,
        }
      },
      outputData: [],
    }
  }

  componentDidMount() {
    const self = this;
    axios.get("http://127.0.0.1:5000/textSamples/")
    .then(function (response) {
      // handle success
      self.setState({textSamples: response.data.textSamples})
      console.log(response);
    })
    .catch(function (error) {
      // handle error
      console.log(error);
    })
  }
 
  handleAudioStop(data) {
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
    const self = this;
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
      self.setState({outputData: response.data.output});
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

  generateStyle(features) {
    const labelToColor = {
      "neutral": "black",
      "calm": "cornflowerblue",
      "happy": "gold",
      "sad": "blue",
      "angry": "maroon",
      "fear": "red",
      "disgust": "olive",
      "ps": "deeppink",
      "boredom": "gray"
    }

    const style = {};
    const loudness = features.loudness;
    const fontSize = `${Math.round(loudness * 72)}pt`;
    style.fontSize = fontSize;
    style.color = labelToColor[features.emotion_label];
    style.opacity = features.confidence;
    return style
  }

  render() {
    return (
      <React.Fragment> 
        <Tabs className="m-3">        
          {this.state.textSamples.map((text, i) => (
            <Tab className="m-3" eventKey={i} key={i} title={`Sample ${i}`}>
              {text}
            </Tab>
          ))}
        </Tabs>

        <Recorder
          record={true}
          title={"IM FINE"}
          audioURL={this.state.audioDetails.url}
          showUIAudio
          handleAudioStop={data => this.handleAudioStop(data)}
          handleOnChange={(value) => this.handleOnChange(value, 'firstname')}
          handleAudioUpload={data => this.handleAudioUpload(data)}
          handleReset={() => this.handleReset()}
          // mimeTypeToUseWhenRecording={'audio/wave'}
          hideHeader
        />
        <Container fluid>
          Result
          <br/>
          {this.state.outputData.map((entry, i) =>
            (
              <span key={i} style={this.generateStyle(entry.features)}>
                {` ${entry.text} `}
              </span>
            )
          )}
        </Container>
        
      </React.Fragment>

    )
  }
}

export default App;