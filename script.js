 const socket = io('');
        const commentForm = document.getElementById('commentForm');
        const messageInput = document.getElementById('message');
        const commentModal = document.getElementById('commentModal');
        const modalNameInput = document.getElementById('modalName');
        const modalEmailInput = document.getElementById('modalEmail');
        const submitModalBtn = document.getElementById('submitModalBtn');

        const savedName = localStorage.getItem('username');
        const savedEmail = localStorage.getItem('email');
        if (savedName && savedEmail) {
          modalNameInput.value = savedName;
          modalEmailInput.value = savedEmail;
        }

        socket.on('loadComments', (comments) => {
          const commentsList = document.getElementById('comments');

          const sortedComments = comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

          commentsList.innerHTML = sortedComments.map(comment => formatComment(comment)).join('');
        });

        socket.on('newComment', (data) => {
          const commentsList = document.getElementById('comments');
          const commentItem = document.createElement('li');
          commentItem.innerHTML = formatComment(data);
          commentsList.insertBefore(commentItem, commentsList.firstChild);
        });

        socket.on('deleteComment', (commentId) => {
          const commentItem = document.getElementById(commentId);
          if (commentItem) {
            commentItem.remove();
          }
        });

        socket.on('showDeleteButton', (commentId) => {
          const deleteButton = document.querySelector(`[data-comment-id="${commentId}"]`);
          if (deleteButton) {
            deleteButton.style.display = 'inline-block';
          }
        });

        commentForm.addEventListener('submit', (event) => {
          event.preventDefault();
          const name = modalNameInput.value.trim();
          const email = modalEmailInput.value.trim();
          const message = messageInput.value.trim();

          if (!name || !email || !message) {
            commentModal.style.display = 'flex';
          } else {
            socket.emit('newComment', { name, email, message });
            messageInput.value = '';
            commentModal.style.display = 'none';
          }
        });

        function formatComment(comment) {
          const deleteButton = comment.isSender ? `<button class="delete-button" data-comment-id="${comment.id}" onclick="deleteComment('${comment.id}')">Delete</button>` : '';
          const time = new Date(comment.timestamp).toLocaleString();

          const verifiedBadge = comment.email === 'princemaster400@gmail.com' ? '<img src="https://princewebsite.princemaster1.repl.co/princeimg/verified.png" alt="Verified Badge" class="verified-badge">' : '';

          const formattedMessage = linkify(comment.message).replace(/\n/g, '<br>');

          const backgroundColor = comment.isSender ? 'background-color: #e6f7ff;' : '';

          return `
            <li id="${comment.id}" class="comment" style="${backgroundColor}">
              <div class="user-info">
                <span class="username">${comment.name} ${verifiedBadge}</span>
                <span class="time">${time}</span>
              </div>
              <div class="comment-message" id="commentMessage_${comment.id}">
                ${formattedMessage}
              </div>
              ${deleteButton}
            </li>
          `;
        }

        function deleteComment(commentId) {
          socket.emit('deleteComment', commentId);
        }

        commentForm.addEventListener('submit', (event) => {
          if (messageInput.value.trim() !== '') {
            event.preventDefault();
            commentModal.style.display = 'flex';
          }
        });

        submitModalBtn.addEventListener('click', () => {
          const name = modalNameInput.value.trim();
          const email = modalEmailInput.value.trim();

          if (name && email) {
            localStorage.setItem('username', name);
            localStorage.setItem('email', email);

            socket.emit('newComment', { name, email, message: messageInput.value.trim() });
            messageInput.value = '';
            commentModal.style.display = 'none';
          }
        });

        function linkify(message) {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          return message.replace(urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
        }
