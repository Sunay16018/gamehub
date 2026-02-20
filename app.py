import os, base64, sqlite3
from flask import Flask, render_template, request, session, redirect, url_for
from flask_socketio import SocketIO, emit, join_room

app = Flask(__name__)
app.config['SECRET_KEY'] = 'gamehub_final_2026'
socketio = SocketIO(app, cors_allowed_origins="*")

# Klasör ve DB Ayarları
ACCOUNTS_DIR = os.path.join(os.getcwd(), "accounts")
if not os.path.exists(ACCOUNTS_DIR): os.makedirs(ACCOUNTS_DIR)

def init_db():
    conn = sqlite3.connect('database.db')
    conn.execute('CREATE TABLE IF NOT EXISTS users (username TEXT PRIMARY KEY, password TEXT)')
    conn.close()

init_db()

def get_user_pic(username):
    pic_path = os.path.join(ACCOUNTS_DIR, username, f"{username}.png")
    if os.path.exists(pic_path):
        with open(pic_path, "rb") as f:
            return "data:image/png;base64," + base64.b64encode(f.read()).decode('utf-8')
    return "https://cdn-icons-png.flaticon.com/512/149/149071.png"

@app.route('/')
def index():
    if 'user_name' not in session: return redirect(url_for('login'))
    return render_template('index.html', user={'name': session['user_name'], 'picture': get_user_pic(session['user_name'])})

@app.route('/login')
def login(): return render_template('login.html')

@app.route('/login_api', methods=['POST'])
def login_api():
    data = request.json
    un, pw = data['name'].strip(), data['password'].strip()
    conn = sqlite3.connect('database.db'); curr = conn.cursor()
    curr.execute('SELECT * FROM users WHERE username=? AND password=?', (un, pw))
    user = curr.fetchone(); conn.close()
    if user:
        session['user_name'] = un
        return {'status': 'ok'}
    return {'status': 'error'}, 401

@app.route('/register', methods=['POST'])
def register():
    data = request.json
    un, pw, img = data['name'].strip(), data['password'].strip(), data.get('picture', '')
    try:
        conn = sqlite3.connect('database.db')
        conn.execute('INSERT INTO users VALUES (?,?)', (un, pw))
        conn.commit(); conn.close()
        u_path = os.path.join(ACCOUNTS_DIR, un)
        if not os.path.exists(u_path): os.makedirs(u_path)
        if img and "," in img:
            with open(os.path.join(u_path, f"{un}.png"), "wb") as f:
                f.write(base64.b64decode(img.split(",")[1]))
        session['user_name'] = un
        return {'status': 'ok'}
    except: return {'status': 'error'}, 400

@app.route('/game/<gamename>')
def game(gamename):
    if 'user_name' not in session: return redirect(url_for('login'))
    return render_template(f'{gamename}.html', username=session['user_name'])

@app.route('/chat')
def chat():
    if 'user_name' not in session: return redirect(url_for('login'))
    return render_template('chat.html', user={'name': session['user_name'], 'picture': get_user_pic(session['user_name'])})

@app.route('/logout')
def logout():
    session.clear(); return redirect(url_for('login'))

# --- SocketIO Chat & XOX ---
@socketio.on('send_message')
def handle_msg(data): emit('receive_message', data, broadcast=True)

@socketio.on('join_xox')
def xox_j(data): join_room("xox_room"); emit('player_update', {'count': 2}, room="xox_room")

@socketio.on('xox_move')
def xox_m(data): emit('receive_move', data, room="xox_room", include_self=False)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    socketio.run(app, host='0.0.0.0', port=port)
