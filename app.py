from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'cokgizlisifre123'
# Render için en kararlı socket ayarları
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

xox_rooms = {}

@app.route('/', methods=['GET'])
def index():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        if user:
            session['username'] = user
            session.permanent = True # Girişi kalıcı yap
            return redirect(url_for('index'))
    return render_template('login.html')

@app.route('/game/<game_name>')
def game(game_name):
    if 'username' not in session:
        return redirect(url_for('login'))
    return render_template(f'{game_name}.html', username=session['username'])

@socketio.on('join_xox')
def on_join(data):
    room = "xox_global_room"
    join_room(room)
    if room not in xox_rooms: xox_rooms[room] = set()
    xox_rooms[room].add(request.sid)
    emit('player_update', {'count': len(xox_rooms[room])}, room=room)

@socketio.on('send_message')
def handle_message(data):
    emit('receive_message', {
        'user': session.get('username', 'Misafir'),
        'msg': data['msg']
    }, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    socketio.run(app, host='0.0.0.0', port=port, debug=False)
