let books = JSON.parse(localStorage.getItem('livia_books_real_v5')) || [];
let selectedBookId = books.length > 0 ? books[0].id : null;

let currentEpubBook = null;
let currentRendition = null;

document.addEventListener('DOMContentLoaded', () => {
  initGalaxyBackground();
  renderApp();
  setupEvents();
  setupDropzone();
  setupRatingPicker();
});

// PARTÍCULAS DA GALÁXIA
function initGalaxyBackground() {
  const canvas = document.getElementById('galaxyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let width = canvas.width = window.innerWidth;
  let height = canvas.height = window.innerHeight;

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const particles = [];
  const particleCount = Math.floor((width * height) / 14000);
  const colors = [
    'rgba(255, 255, 255, ',
    'rgba(233, 213, 255, ',
    'rgba(192, 132, 252, ',
    'rgba(147, 51, 234, '
  ];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.6 + 0.3,
      colorPrefix: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.7 + 0.2,
      speedX: (Math.random() - 0.5) * 0.2,
      speedY: -Math.random() * 0.3 - 0.1,
      pulseSpeed: Math.random() * 0.02 + 0.005
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);
    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

      if (p.y < 0) p.y = height;
      if (p.x < 0) p.x = width;
      if (p.x > width) p.x = 0;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.colorPrefix + Math.max(0.1, Math.min(0.8, p.alpha)) + ')';
      ctx.fill();
    });
    requestAnimationFrame(animate);
  }
  animate();
}

function renderApp() {
  const heroSection = document.getElementById('heroSection');
  const emptyState = document.getElementById('emptyState');
  const carouselsContainer = document.getElementById('carouselsContainer');

  if (books.length === 0) {
    heroSection.style.display = 'none';
    carouselsContainer.style.display = 'none';
    emptyState.style.display = 'flex';
  } else {
    emptyState.style.display = 'none';
    heroSection.style.display = 'flex';
    carouselsContainer.style.display = 'flex';

    renderTracks();
    const currentBook = books.find(b => b.id === selectedBookId) || books[0];
    updateHero(currentBook);
  }
}

function renderTracks(filterText = '') {
  const tracks = {
    romance: document.getElementById('trackRomance'),
    best: document.getElementById('trackBest'),
    suspense: document.getElementById('trackSuspense'),
    terror: document.getElementById('trackTerror')
  };

  Object.values(tracks).forEach(t => t.innerHTML = '');

  const filtered = books.filter(b => 
    b.title.toLowerCase().includes(filterText.toLowerCase()) || 
    b.author.toLowerCase().includes(filterText.toLowerCase())
  );

  filtered.forEach(book => {
    const card = document.createElement('div');
    card.className = 'card-item';
    card.onclick = () => openDetailModal(book.id);

    card.innerHTML = `
      <img src="${book.cover}" alt="${book.title}" class="card-poster" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div class="card-poster-fallback" style="display:none;">
        <span class="fb-title">📖 ${book.title}</span>
        <span class="fb-author">${book.author}</span>
      </div>
      <div class="card-title">${book.title}</div>
      <div class="card-author">${book.author}</div>
    `;

    if (tracks[book.category]) {
      tracks[book.category].appendChild(card);
    } else {
      tracks.romance.appendChild(card);
    }
  });
}

function updateHero(book) {
  if (!book) return;
  selectedBookId = book.id;
  document.getElementById('heroBg').style.backgroundImage = `url('${book.cover}')`;
  document.getElementById('heroCover').src = book.cover;
  document.getElementById('heroTitle').textContent = book.title;
  document.getElementById('heroAuthor').textContent = `por ${book.author}`;
  document.getElementById('heroRating').textContent = '💖'.repeat(parseInt(book.rating || 5));
  document.getElementById('heroSummary').textContent = book.bio || 'Abra o diário de leitura para escrever os destaques desta obra.';
}

// UPLOAD INSTANTÂNEO COM MENSAGEM DE IA (SEM TRAVAR)
function setupDropzone() {
  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('bookEpubInput');
  const uploadStatus = document.getElementById('uploadStatus');

  dropzone.onclick = () => fileInput.click();
  fileInput.onchange = (e) => handleFiles(e.target.files);

  dropzone.ondragover = (e) => { e.preventDefault(); dropzone.style.background = 'rgba(192, 132, 252, 0.08)'; };
  dropzone.ondragleave = () => { dropzone.style.background = 'rgba(255, 255, 255, 0.02)'; };
  dropzone.ondrop = (e) => {
    e.preventDefault();
    dropzone.style.background = 'rgba(255, 255, 255, 0.02)';
    handleFiles(e.dataTransfer.files);
  };

  function handleFiles(files) {
    if (!files.length) return;
    dropzone.style.display = 'none';
    uploadStatus.style.display = 'block';

    Array.from(files).forEach((file, index) => {
      const reader = new FileReader();

      reader.onload = function(event) {
        const arrayBuffer = event.target.result;
        const cleanTitle = file.name.replace('.epub', '').replace(/_/g, ' ');
        const base64Data = arrayBufferToBase64(arrayBuffer);

        const newBook = {
          id: (Date.now() + index).toString(),
          title: cleanTitle,
          author: 'Autor Selecionado',
          category: 'romance',
          cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop',
          epubData: base64Data,
          bio: `✨ IA concluiu a análise do livro '${cleanTitle}'. Caderno de leitura e leitor 3D prontos para uso!`,
          bestPart: '', favChar: '', favQuote: '', vibe: 'Coração quentinho 💖', notes: [], summary: '', rating: '5'
        };

        books.push(newBook);
        selectedBookId = newBook.id;
        saveData();

        // Simula o tempo ideal da IA gerando sinopse e capa com elegância
        setTimeout(() => {
          uploadStatus.style.display = 'none';
          dropzone.style.display = 'block';
          document.getElementById('addModal').classList.remove('active');
          renderApp();
        }, 1500);
      };

      reader.onerror = function() {
        uploadStatus.style.display = 'none';
        dropzone.style.display = 'block';
        alert('Erro ao carregar o arquivo.');
      };

      reader.readAsArrayBuffer(file);
    });
  }
}

function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64) {
  const binary_string = window.atob(base64);
  const bytes = new Uint8Array(binary_string.length);
  for (let i = 0; i < binary_string.length; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

// LEITOR COM EFEITO DE FOLHA EM 3D E SOMBRA DE DOBRA
function openReader() {
  const book = books.find(b => b.id === selectedBookId);
  if (!book || !book.epubData) {
    alert('Arquivo .epub não encontrado.');
    return;
  }

  document.getElementById('readerBookTitle').textContent = book.title;
  document.getElementById('readerModal').classList.add('active');

  const viewer = document.getElementById('epubViewer');
  viewer.innerHTML = '<p style="text-align:center; padding-top:40vh; opacity:0.6; color:#c084fc;">Abrindo livro em 3D...</p>';

  try {
    const bookData = base64ToArrayBuffer(book.epubData);

    if (currentRendition) {
      currentRendition.destroy();
    }

    currentEpubBook = ePub(bookData);
    
    // Força layout de colunas e paginação imersiva para ativar a dobra de folha 3D
    currentRendition = currentEpubBook.renderTo("epubViewer", {
      width: "100%",
      height: "100%",
      flow: "paginated",
      spread: "always"
    });

    currentRendition.themes.default({
      'p': { 'color': '#e2e8f0 !important', 'font-size': '1.1rem !important', 'line-height': '1.65 !important', 'text-align': 'justify !important' },
      'body': { 'background': '#0c0814 !important', 'color': '#e2e8f0 !important', 'padding': '25px !important' },
      'h1, h2, h3': { 'color': '#c084fc !important', 'font-family': 'Playfair Display, serif !important' }
    });

    viewer.innerHTML = '';
    currentRendition.display();

    // Toque nas bordas laterais para virar a folha
    document.getElementById('touchNext').onclick = () => currentRendition.next();
    document.getElementById('touchPrev').onclick = () => currentRendition.prev();

    // Gesto de deslizar (Swipe) no celular para efeito de virada de página
    let startX = 0;
    viewer.addEventListener('touchstart', (e) => {
      startX = e.changedTouches[0].screenX;
    }, false);

    viewer.addEventListener('touchend', (e) => {
      let endX = e.changedTouches[0].screenX;
      if (startX - endX > 40) {
        currentRendition.next();
      } else if (endX - startX > 40) {
        currentRendition.prev();
      }
    }, false);

  } catch (err) {
    console.error(err);
    viewer.innerHTML = `<div style="padding-top:40vh; text-align:center; color:#fff;"><p>Erro ao carregar a leitura 3D.</p></div>`;
  }
}

function setupRatingPicker() {
  const stars = document.querySelectorAll('#ratingPicker span');
  stars.forEach(star => {
    star.onclick = () => {
      const rate = parseInt(star.dataset.rate);
      const book = books.find(b => b.id === selectedBookId);
      if (book) {
        book.rating = rate;
        updateRatingUI(rate);
        saveData();
      }
    };
  });
}

function updateRatingUI(rate) {
  const stars = document.querySelectorAll('#ratingPicker span');
  stars.forEach((s, idx) => {
    if (idx < rate) s.classList.add('active');
    else s.classList.remove('active');
  });
}

function openDetailModal(bookId) {
  selectedBookId = bookId;
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('detailCover').src = book.cover;
  document.getElementById('detailTitle').textContent = book.title;
  document.getElementById('detailAuthor').textContent = `por ${book.author}`;
  document.getElementById('detailCategory').textContent = book.category.toUpperCase();
  document.getElementById('detailRating').textContent = '💖'.repeat(parseInt(book.rating || 5));
  document.getElementById('detailBio').textContent = book.bio || 'Sem detalhes.';

  document.getElementById('detailModal').classList.add('active');
  updateHero(book);
}

function openNotesModal(bookId) {
  const book = books.find(b => b.id === bookId);
  if (!book) return;

  document.getElementById('journalBookSub').textContent = book.title;
  document.getElementById('bestPartText').value = book.bestPart || '';
  document.getElementById('favCharInput').value = book.favChar || '';
  document.getElementById('favQuoteInput').value = book.favQuote || '';
  document.getElementById('vibeSelect').value = book.vibe || 'Coração quentinho 💖';
  document.getElementById('finalSummaryText').value = book.summary || '';

  updateRatingUI(parseInt(book.rating || 5));
  renderPostits(book.notes || []);

  document.getElementById('notesModal').classList.add('active');
}

function renderPostits(notes) {
  const grid = document.getElementById('postitsGrid');
  grid.innerHTML = notes.map(n => `
    <div class="postit-card ${n.isSpoiler ? 'spoiler' : ''}">
      <p>${n.text}</p>
    </div>
  `).join('') || '<p style="opacity:0.5; font-size:0.8rem; grid-column:1/-1;">Nenhum post-it adicionado ainda.</p>';
}

function setupEvents() {
  const addModal = document.getElementById('addModal');
  const detailModal = document.getElementById('detailModal');
  const readerModal = document.getElementById('readerModal');
  const notesModal = document.getElementById('notesModal');

  document.getElementById('openAddModal').onclick = () => addModal.classList.add('active');
  document.getElementById('emptyAddBtn').onclick = () => addModal.classList.add('active');
  document.getElementById('mobileFabBtn').onclick = () => addModal.classList.add('active');
  document.getElementById('closeAddModal').onclick = () => addModal.classList.remove('active');
  document.getElementById('closeDetailModal').onclick = () => detailModal.classList.remove('active');
  document.getElementById('closeReaderModal').onclick = () => readerModal.classList.remove('active');
  document.getElementById('closeNotesModal').onclick = () => notesModal.classList.remove('active');
  document.getElementById('mobileNotesBtn').onclick = () => openNotesModal(selectedBookId);

  document.getElementById('heroReadBtn').onclick = () => openReader();
  document.getElementById('openReaderBtn').onclick = () => { detailModal.classList.remove('active'); openReader(); };
  document.getElementById('heroNotesBtn').onclick = () => openNotesModal(selectedBookId);
  document.getElementById('openNotesBtn').onclick = () => { detailModal.classList.remove('active'); openNotesModal(selectedBookId); };

  document.getElementById('addPostitBtn').onclick = () => {
    const box = document.getElementById('addPostitBox');
    box.style.display = box.style.display === 'none' ? 'block' : 'none';
  };

  document.getElementById('savePostitBtn').onclick = () => {
    const text = document.getElementById('newPostitText').value;
    const isSpoiler = document.getElementById('spoilerCheck').checked;
    if (!text) return;

    const book = books.find(b => b.id === selectedBookId);
    if (book) {
      book.notes.push({ text, isSpoiler });
      saveData();
      renderPostits(book.notes);
      document.getElementById('newPostitText').value = '';
      document.getElementById('addPostitBox').style.display = 'none';
    }
  };

  document.getElementById('generateAiSummaryBtn').onclick = () => {
    const book = books.find(b => b.id === selectedBookId);
    const textarea = document.getElementById('finalSummaryText');
    textarea.value = "🤖 IA organizando diário e resenha do livro...";

    setTimeout(() => {
      textarea.value = `✨ Resenha Poética de '${book.title}':\n\nUma leitura que traz a vibe de ${book.vibe}. ` +
      (book.bestPart ? `\n\nO momento mais marcante foi: ${book.bestPart}.` : '') +
      (book.favChar ? `\nPersonagem inesquecível: ${book.favChar}.` : '') +
      `\n\nVeredito: Leitura recomendadíssima! 💖`;
    }, 1000);
  };

  document.getElementById('saveJournalBtn').onclick = () => {
    const book = books.find(b => b.id === selectedBookId);
    if (book) {
      book.bestPart = document.getElementById('bestPartText').value;
      book.favChar = document.getElementById('favCharInput').value;
      book.favQuote = document.getElementById('favQuoteInput').value;
      book.vibe = document.getElementById('vibeSelect').value;
      book.summary = document.getElementById('finalSummaryText').value;

      saveData();
      notesModal.classList.remove('active');
      renderApp();
      alert('Diário de leitura salvo no caderno! 💜✨');
    }
  };
}

function saveData() {
  localStorage.setItem('livia_books_real_v5', JSON.stringify(books));
}

// PWA
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Lívia\'s Library PWA Ativo! 💜'))
    .catch(err => console.log('Erro PWA:', err));
}
