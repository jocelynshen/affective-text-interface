import sys
from flask import Flask
from flask import request, jsonify
import json
import os
import pathlib
from datetime import datetime
from utils import affective_text_processing
import subprocess
from DeepMoji.deepmoji.model_def import deepmoji_emojis
from DeepMoji.deepmoji.sentence_tokenizer import SentenceTokenizer
import tensorflow as tf
gpus = tf.config.experimental.list_physical_devices('GPU')
for gpu in gpus:
  tf.config.experimental.set_memory_growth(gpu, True)
from DeepMoji.deepmoji.global_variables import PRETRAINED_PATH, VOCAB_PATH
from flask import Flask
from flask_cors import CORS
import logging

with open(VOCAB_PATH, 'r') as f:
    vocabulary = json.load(f)


app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = "data/"
app.config['MAX_CONTENT_LENGTH'] = 10000 * 1024 * 1024
CORS(app)
logging.getLogger('flask_cors').level = logging.DEBUG

maxlen = 30
batch_size = 32

emoji_model = deepmoji_emojis(maxlen, PRETRAINED_PATH)
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '[application_key].json'
tokenizer = SentenceTokenizer(vocabulary, maxlen)


@app.route('/')
def hello_world():
    return "Hello World"

################################### AFFECTIVE TEXT HANDLERS ###################################
@app.route('/testing/', methods=["GET"])
def testing():  # put application's code here
    response = jsonify({'some': 'data'})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response


@app.route('/textSamples/', methods=["GET"])
def textSamples():
    response = jsonify({'textSamples': [
        "Tell me a story about an emotional experience (whether positive or negative) that’s on your mind.",
        "Tell me a story about an emotional experience (whether positive or negative) that’s on your mind."
        ]})
    response.headers.add('Access-Control-Allow-Origin', '*')
    return response

@app.route('/upload/', methods=["POST"])
def upload():
    try:
        file = request.files['audioFile']
        group_size = int(request.form['groupSize'])
        if file:
            file.save(os.path.join(pathlib.Path().resolve(), "tmp.webm"))
            output_filename = f'audio_files/out-{datetime.now().strftime("%d-%b-%Y (%H:%M:%S.%f)")}.wav'
            command = ['ffmpeg', '-i', "tmp.webm", '-ac', '1', output_filename]
            subprocess.run(command,stdout=subprocess.PIPE,stdin=subprocess.PIPE)
            data = affective_text_processing(tokenizer, emoji_model, output_filename, group_size)
            response = jsonify({'output': data})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response
    except:
        data = {"data": []}
        response = jsonify({'output': data})
        response.headers.add('Access-Control-Allow-Origin', '*')
        return response


################################### START SERVER ###################################
if __name__ == '__main__':
    host = sys.argv[1]
    port = sys.argv[2]
    debug = sys.argv[3]
    # app.run(host='0.0.0.0', port=5000, debug=True)
    app.run(host=host, port=port, debug=debug)
