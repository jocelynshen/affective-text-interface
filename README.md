# ML-React-App
It's a template on which we can build a React app and call endpoints to make predictions.

### Usage
The complete guide to use this repository: https://towardsdatascience.com/create-a-complete-machine-learning-web-application-using-react-and-flask-859340bddb33

Starting the server:
```
virtualenv -p Python3 .
source bin/activate
pip install -r requirements.txt
```
```
FLASK_APP=app.py flask run
set FLASK_APP=app.py
flask run
```
Starting the UI:
```
npm install -g serve
npm run build
serve -s build -l 3000
```