from flask import Flask, render_template, request, redirect, url_for, session
from flask_socketio import SocketIO, emit, join_room
import os

app = Flask(__name__)
app.config['SECRET_KEY'] = 'dev_secret_key_99'
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='eventlet')

ACCOUNTS_DIR = 'accounts'
if not os.path.exists(ACCOUNTS_DIR):
    os.makedirs(ACCOUNTS_DIR)

def save_account(username, password):
    user_path = os.path.join(ACCOUNTS_DIR, username)
    if not os.path.exists(user_path):
        os.makedirs(user_path)
        with open(os.path.join(user_path, 'data.txt'), 'w') as f:
            f.write(f"{username},{password}")
        return True
    return False

def check_login(username, password):
    user_path = os.path.join(ACCOUNTS_DIR, username, 'data.txt')
    if os.path.exists(user_path):
        with open(user_path, 'r') as f:
            data = f.read().split(',')
            return data[0] == username and data[1] == password
    return False

@app.route('/')
def index():
    if 'username' in session:
        return render_template('index.html', username=session['username'])
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        user = request.form.get('username')
        pw = request.form.get('password')
        if check_login(user, pw):
            session['username'] = user
            return redirect(url_for('index'))
        return render_template('login.html', error="Hatalı kullanıcı adı veya şifre!")
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        user = request.form.get('username')
        pw = request.form.get('password')
        if save_account(user, pw):
            return redirect(url_for('login'))
        return render_template('register.html', error="Bu kullanıcı zaten var!")
    return render_template('register.html')

@app.route('/game/<game_name>')
def game(game_name):
    if 'username' not in session: return redirect(url_for('login'))
    return render_template(f'{game_name}.html', username=session['username'])

# --- SocketIO Düzenlemeleri ---
@socketio.on('join_xox')
def on_join(data):
    room = "xox_room"
    join_room(room)
    emit('player_update', {'count': 2}, room=room)

@socketio.on('send_message')
def handle_message(data):
    emit('receive_message', {'user': session.get('username'), 'msg': data['msg']}, broadcast=True)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    socketio.run(app, host='0.0.0.0', port=port)
