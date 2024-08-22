const socket = io();

const form = document.getElementById('general-chat');
const input = document.getElementById('general-chat-input');
const messages = document.getElementById('general-chat-box');
const username = document.getElementById('username-inputs');

var playInfo

form.addEventListener('submit', (e) => {
  e.preventDefault();
  if (input.value) {
    socket.emit('message', playInfo.preferred_username, input.value);
    input.value = '';
  }
});

var scrollableDiv = document.getElementById('general-chat-box');

function scrollToBottom() {
  var bottomElement = scrollableDiv.lastElementChild;

  bottomElement.scrollIntoView({ behavior: 'smooth', block: 'end' });
}


socket.on('newtext', (user, msg) => {
  var item = document.createElement('li');
  item.innerHTML = user + ": " + msg;
  messages.appendChild(item);
  scrollToBottom()
});

socket.on('login_return', (token) => {
  console.log('Received token from server:', token);
  if (token) {
    playInfo = token
    document.getElementById('username_text_header').innerText = token.preferred_username;
    document.getElementById('image0_26_114').setAttribute('xlink:href', token.picture) 
  }
});

socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  socket.emit('login_request')
});
