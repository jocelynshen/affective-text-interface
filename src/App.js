import React, { Component } from 'react'
import {Recorder} from 'react-voice-recorder'
import 'react-voice-recorder/dist/index.css'
import axios from '../node_modules/axios';
import 'bootstrap/dist/css/bootstrap.css';
import "react-voice-recorder/dist/index.css";
import { Container } from "react-bootstrap";
import ReactLoading from "react-loading";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import Slider from '@mui/material/Slider';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Stack from '@mui/material/Stack';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';


function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

// const BASE_URL = "http://10.31.83.90:5000/";
// const BASE_URL = "http://wall-e.media.mit.edu:5000/";
const BASE_URL = "https://matlaber7.media.mit.edu:5192/";
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
const EMOTION_COLORS = {
  red: "#B63E3E",
  orange: "#E28112",
  yellow: "#E4C111",
  green: "#6F9D26",
  blue: "#4278B6",
  purple: "#6E46C3",
  pink: "#B43BB8",
  brown: "#906F51",
  black: "#232323",
  gray: "#707070",
}

class App extends Component {
  constructor(props) {
    super(props);

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
        },
      },
      outputData: [],
      loading: false,
      groupSize: 1,
      promptNum: 0,
      negColor: "red",
      // excitedColor: "yellow",
      posColor: "green",
      // sadColor: "blue",
      neutralColor: "black",
      includeEmojis: false,
    }
  }

  componentDidMount() {
    const self = this;
    axios
      .get(BASE_URL + "textSamples/")
      .then(function (response) {
        // handle success
        self.setState({ textSamples: response.data.textSamples });
        console.log(response);
      })
      .catch(function (error) {
        // handle error
        console.log(error);
      });
  }

  handleAudioStop(data) {
    console.log(data);
    this.setState({ audioDetails: data });
  }

  handleAudioUpload(file) {
    console.log(file);
    this.setState({ loading: true });
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
    formData.append("groupSize", this.state.groupSize);
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
      self.setState({loading: false})
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
      },
    };
    this.setState({ audioDetails: reset });
  }

  processText(entry) {
    const text = entry.word_groups;
    const final_text_arr = [];
    const emojis = this.getEmojis(entry.emojis);
    const arr = text.split(".");
    if (arr.length == 1) {
      final_text_arr.push(arr[0]);
    } else {
      for (var i = 0; i < arr.length; i++) {
        if (arr[i].length > 0) {
          final_text_arr.push(arr[i]);
          if (emojis[i]) {
            final_text_arr.push(emojis[i].join("") + ". ");
          }
        }
      }
    }
    const output = final_text_arr.join("");
    if (!this.state.includeEmojis) {
      return output.replace(/[^\p{L}\p{N}\p{P}\p{Z}^$\n]/gu, '');
    }
    return output;
  }

  getEmojis(emojis) {
    let emoji_unicode = [];
    for (var i = 0; i < emojis.length; i++) {
      let temp_emojis = [];
      for (var j = 2; j < 3; j++) {
        temp_emojis.push(EMOJI_MAP[emojis[i][j]]);
      }
      emoji_unicode.push(temp_emojis);
    }
    return emoji_unicode;
  }

  generateStyle(features) {
    const style = {};
    const loudness = features.loudness;
    // const allLoudness = features.all_loudness;
    // const average = (array) => array.reduce((a, b) => a + b) / array.length;
    // const avgLoudness = average(allLoudness);
    const fontWeight = `${Math.round(loudness * 9) * 100}`;
    style.fontSize = "24pt";
    style.fontWeight = fontWeight;
    style.color = EMOTION_COLORS[this.state.neutralColor]; // Neutral

    const compound_score = features.emotion_label["compound"]
    if (compound_score < -0.5) {
      style.color = EMOTION_COLORS[this.state.negColor];
    } else if (compound_score > 0.5) {
      style.color = EMOTION_COLORS[this.state.posColor];
    } else {
      style.color = EMOTION_COLORS[this.state.neutralColor];
    }
    // if (loudness > avgLoudness) {
    //   if (features.emotion_label === "neg") {
    //     style.color = EMOTION_COLORS[this.state.angerColor]; // Angry
    //   } else if (features.emotion_label === "pos") {
    //     style.color = EMOTION_COLORS[this.state.excitedColor]; // Excited
    //   }
    // } else {
    //   if (features.emotion_label === "neg") {
    //     style.color = EMOTION_COLORS[this.state.sadColor]; // Sad
    //   } else if (features.emotion_label === "pos") {
    //     style.color = EMOTION_COLORS[this.state.calmColor]; // Calm
    //   }
    // }
    const speakingLength =
      features.time_interval[1] - features.time_interval[0];
    const speakingRate =
      features.word_groups.replace(/\s/g, "").length / speakingLength;

    // Normal: 8-18 letters per second
    // WCAG guidelines: 0.12 times the font size (16px = 1rem)
    if (speakingRate > 8 && speakingRate < 18) {
      style.letterSpacing = "normal";
    }
    // Fast: >= 8 letters per second
    else if (speakingRate >= 18) {
      style.letterSpacing = "-.1rem";
    }
    // Slow: <= 18 letters per second
    else if (speakingRate <= 8) {
      style.letterSpacing = ".2rem";
    }
    // style.opacity = features.confidence;
    return style;
  }

  // handleGroupSizeSelect(e) {
  //   this.setState({groupSize: e})
  // }

  render() {
    return (
      <React.Fragment>
        {/* <Tabs className="m-3">
          {this.state.textSamples.map((text, i) => (
            <Tab className="m-3" eventKey={i} key={i} title={`Prompt ${i}`}>
              {text}
            </Tab>
          ))}
        </Tabs> */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={this.state.promptNum}
              onChange={(e, newVal) => {this.setState({promptNum: newVal})}}
              aria-label="wrapped label tabs example"
            >
              {this.state.textSamples.map((_, i) => (
                <Tab value={i} key={i} label={`Prompt ${i+1}`}/>
              ))}
            </Tabs>
          </Box>
          {this.state.textSamples.map((text, i) => (
            <TabPanel index={i} key={i} value={this.state.promptNum}>
              {text}
            </TabPanel>
          ))}
        </Box>

        <Recorder
          record={true}
          title={"IM FINE"}
          audioURL={this.state.audioDetails.url}
          showUIAudio
          handleAudioStop={(data) => this.handleAudioStop(data)}
          handleOnChange={(value) => this.handleOnChange(value, "firstname")}
          handleAudioUpload={(data) => this.handleAudioUpload(data)}
          handleReset={() => this.handleReset()}
          // mimeTypeToUseWhenRecording={'audio/wave'}
          hideHeader
        />
        <Container fluid>
        <Stack direction="row" spacing={2} alignItems="center">
          {/*<Box sx={{ width: 240 }}>*/}
          {/*  <Typography gutterBottom>*/}
          {/*    Word Group Size*/}
          {/*  </Typography>*/}
          {/*  <Slider*/}
          {/*    // defaultValue={3}*/}
          {/*    value={this.state.groupSize}*/}
          {/*    onChange={(e) => {this.setState({groupSize: e.target.value})}}*/}
          {/*    valueLabelDisplay="auto"*/}
          {/*    step={1}*/}
          {/*    marks*/}
          {/*    min={1}*/}
          {/*    max={5}*/}
          {/*  />*/}
          {/*</Box>*/}
          <Box sx={{ width: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Negative Color</InputLabel>
              <Select
                value={this.state.negColor}
                label="Negative Color"
                onChange={(e) => {this.setState({negColor: e.target.value})}}
              >
                {Object.keys(EMOTION_COLORS).map((color, i) => (
                  <MenuItem key={i} value={color} style={{color: EMOTION_COLORS[color]}}>{color}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          {/*<Box sx={{ width: 120 }}>*/}
          {/*  <FormControl fullWidth>*/}
          {/*    <InputLabel>Excited Color</InputLabel>*/}
          {/*    <Select*/}
          {/*      value={this.state.excitedColor}*/}
          {/*      label="Excited Color"*/}
          {/*      onChange={(e) => {this.setState({excitedColor: e.target.value})}}*/}
          {/*    >*/}
          {/*      {Object.keys(EMOTION_COLORS).map((color, i) => (*/}
          {/*        <MenuItem key={i} value={color} style={{color: EMOTION_COLORS[color]}}>{color}</MenuItem>*/}
          {/*      ))}*/}
          {/*    </Select>*/}
          {/*  </FormControl>*/}
          {/*</Box>*/}
          {/*<Box sx={{ width: 120 }}>*/}
          {/*  <FormControl fullWidth>*/}
          {/*    <InputLabel>Sad Color</InputLabel>*/}
          {/*    <Select*/}
          {/*      value={this.state.sadColor}*/}
          {/*      label="Sad Color"*/}
          {/*      onChange={(e) => {this.setState({sadColor: e.target.value})}}*/}
          {/*    >*/}
          {/*      {Object.keys(EMOTION_COLORS).map((color, i) => (*/}
          {/*        <MenuItem key={i} value={color} style={{color: EMOTION_COLORS[color]}}>{color}</MenuItem>*/}
          {/*      ))}*/}
          {/*    </Select>*/}
          {/*  </FormControl>*/}
          {/*</Box>*/}
          <Box sx={{ width: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Positive Color</InputLabel>
              <Select
                value={this.state.posColor}
                label="Positive Color"
                onChange={(e) => {this.setState({posColor: e.target.value})}}
              >
                {Object.keys(EMOTION_COLORS).map((color, i) => (
                  <MenuItem key={i} value={color} style={{color: EMOTION_COLORS[color]}}>{color}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ width: 120 }}>
            <FormControl fullWidth>
              <InputLabel>Neutral Color</InputLabel>
              <Select
                value={this.state.neutralColor}
                label="Neutral Color"
                onChange={(e) => {this.setState({neutralColor: e.target.value})}}
              >
                {Object.keys(EMOTION_COLORS).map((color, i) => (
                  <MenuItem key={i} value={color} style={{color: EMOTION_COLORS[color]}}>{color}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          <FormGroup>
            <FormControlLabel control={<Switch checked={this.state.includeEmojis} onChange={(e) => {this.setState({includeEmojis: e.target.checked})}}/>} label="Include Emojis" />
          </FormGroup>
        </Stack>
        </Container>
        <Container fluid>
          Result
          {/*<span role="img" aria-label="label">*/}
          {/*    {String.fromCodePoint("0x263a")}*/}
          {/*</span>*/}
          <br/>
          <Container className='result-container' fluid>
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
        </Container>
      </React.Fragment>
    );
  }
}

export default App;
