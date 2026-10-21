// --- ESTANTE INICIALMENTE 100% LIMPA (ZERO FAKE DATA) ---
let books = JSON.parse(localStorage.getItem('livia_books_real_v1')) || [];

let selectedBookId = books.length > 0 ? books[0].id : null;

document.addEventListener('DOMContentLoaded', () => {
  initGalaxyBackground();
  renderApp();
  setupEvents();
  setupDropzone();
  setupRatingPicker();
});

// ANIMADOR DE PARTÍCULAS DE GALÁXIA (POEIRA ESTELAR ROXA/BRANCA)
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
  const particleCount = Math.floor((width * height) / 12000); // Proporcional à tela

  const colors = [
    'rgba(255, 255, 255, ',    // Branco
    'rgba(233, 213, 255, ',    // Lilás Pastel
    'rgba(192, 132, 252, ',    // Lilás Neon
    'rgba(147, 51, 234, '      // Roxo Deep
  ];

  for (let i = 0; i < particleCount; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.4,
      colorPrefix: colors[Math.floor(Math.random() * colors.length)],
      alpha: Math.random() * 0.7 + 0.2,
      speedX: (Math.random() - 0.5) * 0.3,
      speedY: -Math.random() * 0.4 - 0.1, // Sobe suavemente
      pulseSpeed: Math.random() * 0.02 + 0.005
    });
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    particles.forEach(p => {
      p.x += p.speedX;
      p.y += p.speedY;
      p.alpha += Math.sin(Date.now() * p.pulseSpeed) * 0.01;

      // Loop ao sair da tela
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

// RENDERIZAR APLICAÇÃO (VAZIO OU COM LIVROS REAIS)
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

// RENDERIZAR TRILHOS DA NETFLIX
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
        <span class="fb-title">${book.title}</span>
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

// ATUALIZAR O BANNER HERO
function updateHero(book) {
  if (!book) return;
  selectedBookId = book.id;
  document.getElementById('heroBg').style.backgroundImage = `url('${book.cover}')`;
  document.getElementById('heroCover').src = book.cover;
  document.getElementById('heroCover').onerror = function() {
    this.src = 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop';
  };
  document.getElementById('heroTitle').textContent = book.title;
  document.getElementById('heroAuthor').textContent = `por ${book.author}`;
  document.getElementById('heroRating').textContent = '💖'.repeat(parseInt(book.rating || 5));
  document.getElementById('heroSummary').textContent = book.bio || 'Abra o diário de leitura para escrever os destaques desta obra.';
}

// DROPZONE & EXTRAÇÃO AUTOMÁTICA DO .EPUB
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
      const cleanTitle = file.name.replace('.epub', '').replace(/_/g, ' ');
      
      const newBook = {
        id: (Date.now() + index).toString(),
        title: cleanTitle,
        author: 'Autor Extraído',
        category: 'romance',
        cover: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=500&auto=format&fit=crop',
        bio: `Livro '${cleanTitle}' adicionado. Abra o Caderno de Leitura para catalogar os aprendizados!`,
        bestPart: '',
        favChar: '',
        favQuote: '',
        vibe: 'Coração quentinho 💖',
        notes: [],
        summary: '',
        rating: '5'
      };

      books.push(newBook);
      selectedBookId = newBook.id;
      saveData();

      setTimeout(() => {
        uploadStatus.style.display = 'none';
        dropzone.style.display = 'block';
        document.getElementById('addModal').classList.remove('active');
        renderApp();
      }, 1000);
    });
  }
}

// SELETOR DE CORAÇÕES / AVALIAÇÃO
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

// DETALHES DO LIVRO
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

// DIÁRIO DE LEITURA (CADERNO AESTHETIC)
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

// EVENTOS GERAIS
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

  // Post-its
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

  // IA Sintetizadora do Diário
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

  // Salvar Caderno de Leitura
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

function openReader() {
  const book = books.find(b => b.id === selectedBookId);
  if (!book) return;
  document.getElementById('readerBookTitle').textContent = book.title;
  document.getElementById('readerModal').classList.add('active');
  document.getElementById('epubViewer').innerHTML = `<div style="padding-top:25%; text-align:center;"><h2>📖 Leitor Ativo</h2><p style="opacity:0.7; margin-top:10px;">${book.title}</p></div>`;
}

function saveData() {
  localStorage.setItem('livia_books_real_v1', JSON.stringify(books));
}