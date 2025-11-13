from flask import Flask, render_template
from scraper import get_events, format_events

app = Flask(__name__)

@app.route('/')
def home():
    amc_response = get_events()
    return render_template('index.html', events=format_events(amc_response))

@app.route('/events')
def events():
    amc_response = get_events()
    return render_template('events.html', events=format_events(amc_response))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8081)
