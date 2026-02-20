from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gizlisifre123'
# Bu kısım bağlantı kopmalarını ve oda sorunlarını engeller
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet', ping_timeout=60)

xox_rooms = {}

@app.route('/')
def index():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        session['username'] = request.form.get('username')
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
    if room not in xox_rooms:
        xox_rooms[room] = set() # Tekrarı önlemek için set kullanıyoruz
    xox_rooms[room].add(request.sid) # Kişiyi benzersiz ID ile ekle
    emit('player_update', {'count': len(xox_rooms[room])}, room=room)

@socketio.on('xox_move')
def handle_move(data):
    emit('receive_move', data, room="xox_global_room", include_self=False)

@socketio.on('send_message')
def handle_message(data):
    # Mesajı gönderen dahil herkese yayınla (broadcast)
    emit('receive_message', {
        'user': session.get('username', 'Misafir'),
        'msg': data['msg']
    }, broadcast=True)

@socketio.on('disconnect')
def on_disconnect():
    room = "xox_global_room"
    if room in xox_rooms and request.sid in xox_rooms[room]:
        xox_rooms[room].remove(request.sid)
        emit('player_update', {'count': len(xox_rooms[room])}, room=room)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    socketio.run(app, host='0.0.0.0', port=port)
