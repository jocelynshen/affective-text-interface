import React, { Component } from 'react'
import {Recorder} from 'react-voice-recorder'
import 'react-voice-recorder/dist/index.css'
import axios from '../node_modules/axios';
import Tabs from 'react-bootstrap/Tabs';
import Tab from 'react-bootstrap/Tab';
import 'bootstrap/dist/css/bootstrap.css';
import { Container } from 'react-bootstrap';
import ReactLoading from "react-loading";

const BASE_URL = "http://10.31.83.90:5000/";
// const BASE_URL = "http://wall-e.media.mit.edu:5000/";
const EMOJI_MAP = {
  0: "😂",
  1: "😒",
  2: "😩",
  3: "😭",
  4: "😍",
  5: "😔",
  6: "👌",
  7: "😊",
  8: "❤️‍🩹",
  9: "😏",
  10: "😁",
  11: "🎶",
  12: "😳",
  13: "💯",
  14: "😴",
  15: "😌",
  16: "☺️",
  17: "🙌",
  18: "💕",
  19: "😑",
  20: "😅",
  21: "🙏",
  22: "😕",
  23: "😘",
  24: "♥️",
  25: "😐",
  26: "💁",
  27: "😞",
  28: "🙈",
  29: "😫",
  30: "✌️",
  31: "😎",
  32: "😡",
  33: "👍",
  34: "😢",
  35: "😪",
  36: "😋",
  37: "😤",
  38: "✋",
  39: "😷",
  40: "👏",
  41: "👀",
  42: "🔫",
  43: "😣",
  44: "😈",
  45: "😓",
  46: "💔",
  47: "♡",
  48: "🎧",
  49: "🙊",
  50: "😉",
  51: "💀",
  52: "😖",
  53: "😄",
  54: "😜",
  55: "😠",
  56: "🙅",
  57: "💪",
  58: "👊",
  59: "💜",
  60: "💖",
  61: "💙",
  62: "😬",
  63: "✨",
}

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
      loading: false
    }
  }

  componentDidMount() {
    const self = this;
    axios.get(BASE_URL + "textSamples/")
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
    this.setState({loading: true});
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
    axios.post(BASE_URL + "upload/", formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
    .then(function (response) {
      // handle success
      console.log(response);
      const response_data = response.data.output.data;
      let json_responses = new Array(response_data.length);
      // response_data.map((entry, i) => {(JSON.parse(entry))})
      console.log(response_data)
      for (var i=0;i<response_data.length;i++) {
        json_responses[i] = JSON.parse(response_data[i]);
      }
      console.log(json_responses)
      self.setState({loading: false})
      self.setState({outputData: json_responses});

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

  processText(entry) {
    const text = entry.word_groups
    const final_text_arr = [];
    const emojis = this.getEmojis(entry.emojis)
    const arr = text.split(".")
    for (var i=0;i<arr.length;i++){
      if (arr[i].length > 0) {
        final_text_arr.push(arr[i])
        if (emojis[i]) {
          final_text_arr.push(emojis[i].join("") + ". ")
        }
      }
    }
    return final_text_arr.join("")
  }

  getEmojis(emojis) {
    let emoji_unicode = [];
    for (var i=0;i<emojis.length;i++) {
      let temp_emojis = [];
      for (var j=2; j<3;j++) {
        temp_emojis.push(EMOJI_MAP[emojis[i][j]])
      }
      emoji_unicode.push(temp_emojis);
    }
    return emoji_unicode
  }

  generateStyle(features) {
    const labelToColor = {
      "neu": "black",
      "neg": "red",
      "pos": "gold",
    }

    const style = {};
    const loudness = features.loudness;
    const fontSize = `${Math.round(loudness * 72)}pt`;
    style.fontSize = fontSize;
    style.color = labelToColor[features.emotion_label];
    // style.opacity = features.confidence;
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
          {/*<span role="img" aria-label="label">*/}
          {/*    {String.fromCodePoint("0x263a")}*/}
          {/*</span>*/}
          <br/>
          {this.state.loading ? <ReactLoading type="bubbles" color="#0000FF"
                         height={100} width={50}/>: <></>}
          {this.state.outputData.map((entry, i) =>
            (
              <span key={i} style={this.generateStyle(entry)}>
                {` ${this.processText(entry)} ` }
                {/*{this.getEmojis(entry.emojis)}*/}
              </span>
            )
          )}
        </Container>

      </React.Fragment>

    )
  }
}

export default App;
