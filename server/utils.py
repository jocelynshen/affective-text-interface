import json
import subprocess
import numpy as np
from pydub import AudioSegment
from google.cloud import speech
import pandas as pd
import uuid
import numpy as np
import os
import json
import os
import opensmile
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import random
import re
from multiprocessing import Lock

BASE_DIR = ""

lock = Lock()

def get_nouns_set():
  with open('nouns.txt', 'r') as f:
      a = json.loads(f.read())
      return set(a)

nouns = get_nouns_set()
processed_emojis = pd.read_csv("processed_emojis.csv")

def get_emoji_for_word(word):
  processed_text = re.sub('[!@#$,.:]', '', word).lower()
  if processed_text not in nouns:
    return word
  matches = []
  for i, description in enumerate(processed_emojis["description"]):
    processed_description = eval(description)
    if processed_text in processed_description:
      matches.append(i)
  if len(matches) == 0:
    return word
  index = random.choice(matches)
  last_letter = word[-1]
  if last_letter == "." or last_letter == "," or last_letter == ":" or last_letter == ";":
      return word[:-1] + " " + processed_emojis["emoji"][index] + last_letter
  return word + " " + processed_emojis["emoji"][index]


def get_features_opensmile(input_filepath: str, base_dir):
    """
    input_filepath: path to .wav sound file relative to base_dir
    output_filepath: path to .wav sound file relative to base_dir
    """
    smile = opensmile.Smile(
        feature_set=opensmile.FeatureSet.GeMAPSv01b,
        feature_level=opensmile.FeatureLevel.LowLevelDescriptors,
    )

    # Extact this for our test sentence, out comes a pandas dataframe
    result_df = smile.process_file(os.path.join(base_dir, input_filepath))

    # result_df.to_csv("opensmile_features.csv")
    return result_df


class NpEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, np.integer):
            return int(obj)
        if isinstance(obj, np.floating):
            return float(obj)
        if isinstance(obj, np.ndarray):
            return obj.tolist()
        return super(NpEncoder, self).default(obj)

def get_audio_from_video(video_file, audio_file):
    command = f'ffmpeg -loglevel panic -i "{video_file}" -ab 160k -ac 1 -ar 16000 -vn "{audio_file}"'
    subprocess.call(command, shell=True)
    return audio_file

# def get_speech_emotion(emotion_model, audio_file):
#     emotion_label, probability = predict(emotion_model, audio_file)
#     # json_object = dict(emotion_label=emotion_label)
#     # return json.dumps(json_object, cls=NpEncoder)
#     return emotion_label

def get_text_emotion(text):
    analyzer = SentimentIntensityAnalyzer()
    vs = analyzer.polarity_scores(text)
    vs = {'pos': vs['pos'],
          'neg': vs['neg'],
          'neu': vs['neu'],
          'compound': vs['compound']}
    # label = max(vs, key=vs.get)
    return vs


def top_elements(array, k):
    ind = np.argpartition(array, -k)[-k:]
    return ind[np.argsort(array[ind])][::-1]

def score_text_emojis(tokenizer, emoji_model, sentences):
    global lock
    lock.acquire()
    tokenized, _, _ = tokenizer.tokenize_sentences(sentences)
    prob = emoji_model.predict(tokenized)
    scores = []
    for i, t in enumerate(sentences):
        t_tokens = tokenized[i]
        t_score = [t]
        t_prob = prob[i]
        ind_top = top_elements(t_prob, 5)
        t_score.append(sum(t_prob[ind_top]))
        t_score.extend(ind_top)
        t_score.extend([t_prob[ind] for ind in ind_top])
        scores.append(t_score)
    lock.release()
    return scores


def get_loudness(df, time_range):
    # df["normalized_loudness"] = (df["Loudness_sma3"]-df["Loudness_sma3"].min())/(df["Loudness_sma3"].max()-df["Loudness_sma3"].min())
    # df = df[["start", "end", "normalized_loudness"]]
    # df = df.iloc[::2, :]
    mean_loudness = np.mean(df["Loudness_sma3"])
    return mean_loudness

def in_interval(a, b):
    start = a[0]
    end = a[1]
    t0 = b[0]
    t1 = b[1]
    return (start <= t0 and end > t0) or (start >= t0 and end <= t1) or (start < t1 and end >t1)


def affective_text_processing(tokenizer, emoji_model, audio_file, group_size=1):
    out = []
    transcript=''
    # path for output audio file segments
    new_uuid = str(uuid.uuid4())
    output_folder_path = BASE_DIR + '/audio_segments/'+ new_uuid

    if not os.path.exists(output_folder_path):
        os.mkdir(output_folder_path)

    df = get_features_opensmile(audio_file, f'{BASE_DIR}')
    df.reset_index(inplace=True)
    df["normalized_loudness"] = (df["Loudness_sma3"] - df["Loudness_sma3"].min()) / (
                df["Loudness_sma3"].max() - df["Loudness_sma3"].min())
    df = df[["start", "end", "normalized_loudness"]]
    df['start'] = df['start'].apply(lambda x: pd.to_timedelta(x).total_seconds())
    df['end'] = df['end'].apply(lambda x: pd.to_timedelta(x).total_seconds())
    df['time_interval'] = df.apply(lambda x: (x.start, x.end), axis=1)

    client = speech.SpeechClient()
    with open(audio_file, 'rb') as f1:
        byte_data_wav = f1.read()
    audio = speech.RecognitionAudio(content=byte_data_wav)

    #config for wav files
    config = speech.RecognitionConfig(
        # encoding=speech.RecognitionConfig.AudioEncoding.FLAC,
        sample_rate_hertz=48000,
        enable_automatic_punctuation=True,
        # language_code="zh",
        language_code="en-US",
        # audio_channel_count=2,
        enable_word_time_offsets=True,
    )

    operation = client.long_running_recognize(config=config, audio=audio)

    print("Waiting for operation to complete...")
    result = operation.result(timeout=90)
    all_loudness = []
    for result in result.results:
        alternative = result.alternatives[0]
        print("Transcript: {}".format(alternative.transcript))
        transcript = alternative.transcript
        print("Confidence: {}".format(alternative.confidence))
        if (group_size > len(alternative.words)):
            group_size = 1
        for i in range(0, len(alternative.words),group_size):
            j = min(i+group_size , len(alternative.words))
            word_group = ' '.join([alternative.words[x].word for x in range(i,j)])
            start_time = alternative.words[i].start_time.total_seconds()
            end_time = alternative.words[j-1].end_time.total_seconds()

            word_group_file_path = output_folder_path+'/'+str(int(i/group_size))+'.wav'
            newAudio = AudioSegment.from_wav(audio_file)
            # time in milliseconds
            newAudio = newAudio[start_time*1000:end_time*1000]
            newAudio = newAudio.set_channels(1)
            newAudio.export(word_group_file_path, format="wav")

            # Emotional_Label
            # emotion_label, probability = predict(emotion_model, word_group_file_path)

            # Loudness
            # df = get_features_opensmile(word_group_file_path, '/')
            # df.reset_index(inplace=True)
            time_range = (start_time, end_time)
            # loudness = get_loudness(df, time_range)
            indexes_in_interval = df.apply(lambda x: in_interval(x.time_interval, time_range), axis=1)
            mean_loudness = np.mean(df.loc[indexes_in_interval == True]["normalized_loudness"])
            all_loudness.append(mean_loudness)
            json_object = {'word_groups': word_group, 'time_interval': (start_time, end_time), "loudness": mean_loudness} # TODO: change emotion label
            out.append(json_object)
    full_text = " ".join([_["word_groups"] for _ in out])
    sentences = full_text.split(".")
    filtered_sentences = []
    emotion_labels = []
    for sentence in sentences:
        if len(sentence) > 0:
            emotion_label = get_text_emotion(sentence)
            emotion_labels.append(emotion_label)
            filtered_sentences.append(sentence)
    if len(filtered_sentences) > 0:
        emoji_scores = score_text_emojis(tokenizer, emoji_model, filtered_sentences)
    i = 0
    new_json_objects = []
    for json_object in out:
        string = json_object["word_groups"]
        words = string.split(" ")
        new_word_group = ' '.join(get_emoji_for_word(_) for _ in words)
        json_object["word_groups"] = new_word_group
        json_object["all_loudness"] = all_loudness
        json_object["emojis"] = []
        json_object["emotion_label"] = [emotion_labels[i]]
        for character in string:
            if character == ".":
                json_object["emojis"].append(emoji_scores[i])
                i += 1
                if i < len(emotion_labels):
                    json_object["emotion_label"].append(emotion_labels[i])
        d = "."
        split = [e + d for e in json_object["word_groups"].split(d) if e]
        for j, chunk in enumerate(split):
            if len(chunk) > 0:
                if len(json_object["emojis"]) > 0 and j < len(json_object["emojis"]):
                    emojis = [json_object["emojis"][j]]
                else:
                    emojis = []
                new_json_object = {
                    "word_groups": chunk,
                    "time_interval": json_object["time_interval"],
                    "loudness": json_object["loudness"],
                    "all_loudness": json_object["all_loudness"],
                    "emojis": emojis,
                    "emotion_label": json_object["emotion_label"][j]
                }
                new_json_objects.append(new_json_object)

    out = [json.dumps(json_object, cls=NpEncoder) for json_object in new_json_objects]
    return {'transcript': transcript, 'data': out}