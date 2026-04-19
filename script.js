let books = JSON.parse(localStorage.getItem('lumina_db')) || [];

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.getElementById('nav-' + viewId).classList.add('active');
}

function toggleWishlistFields() {
    const type = document.getElementById('type').value;
    document.getElementById('wishlistFields').style.display = type === 'wishlist' ? 'block' : 'none';
    document.getElementById('libraryFields').style.display = type === 'library' ? 'block' : 'none';
}

function openModal(editId = null) {
    const modal = document.getElementById('bookModal');
    if (editId) {
        const book = books.find(b => b.id === editId);
        document.getElementById('editId').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('cover').value = book.cover;
        document.getElementById('totalPages').value = book.total || 0;
        document.getElementById('currentPage').value = book.current || 0;
        document.getElementById('price').value = book.price || '';
        document.getElementById('buyLink').value = book.link || '';
        document.getElementById('type').value = book.type;
    } else {
        document.getElementById('editId').value = "";
        document.getElementById('title').value = "";
    }
    toggleWishlistFields();
    modal.style.display = 'flex';
}

function closeModal() { document.getElementById('bookModal').style.display = 'none'; }

function saveBook() {
    const id = document.getElementById('editId').value;
    const type = document.getElementById('type').value;
    
    const bookData = {
        id: id ? parseInt(id) : Date.now(),
        type: type,
        title: document.getElementById('title').value,
        cover: document.getElementById('cover').value || 'https://via.placeholder.com/150',
        total: parseInt(document.getElementById('totalPages').value) || 1,
        current: parseInt(document.getElementById('currentPage').value) || 0,
        price: document.getElementById('price').value,
        link: document.getElementById('buyLink').value
    };

    if (id) {
        const index = books.findIndex(b => b.id === parseInt(id));
        books[index] = bookData;
    } else {
        books.push(bookData);
    }

    localStorage.setItem('lumina_db', JSON.stringify(books));
    closeModal();
    render();
}

function render() {
    const query = document.getElementById('globalSearch').value.toLowerCase();
    const containers = {
        'unread': document.getElementById('unread'),
        'in-progress': document.getElementById('in-progress'),
        'completed': document.getElementById('completed'),
        'wishlist': document.getElementById('wishlist')
    };

    Object.values(containers).forEach(c => c.innerHTML = `<h3 class="view-title">${c.id}</h3>`);

    books.forEach(book => {
        if (!book.title.toLowerCase().includes(query)) return;

        const percent = Math.round((book.current / book.total) * 100);
        let targetId = book.type === 'wishlist' ? 'wishlist' : '';
        
        if (book.type === 'library') {
            if (book.current === 0) targetId = 'unread';
            else if (book.current >= book.total) targetId = 'completed';
            else targetId = 'in-progress';
        }

        const wishlistInfo = book.type === 'wishlist' ? 
            `<div class="price-tag">£${book.price || '0.00'}</div>
             <a href="${book.link}" target="_blank" style="color:var(--purple); font-size:10px;">Buy Link</a>` : '';

        const progressInfo = book.type === 'library' ? 
            `<div class="progress-container"><div class="progress-fill" style="width: ${percent}%"></div></div>` : '';

        const card = `
            <div class="book-card">
                <img src="${book.cover}" class="cover-preview">
                <div class="book-info">
                    <span class="book-title">${book.title}</span>
                    ${wishlistInfo}
                    ${progressInfo}
                    <div class="card-actions">
                        <button class="btn-small" onclick="openModal(${book.id})">EDIT</button>
                    </div>
                </div>
            </div>`;
        
        if (containers[targetId]) containers[targetId].innerHTML += card;
    });

    // Search Achievements
    document.querySelectorAll('.achievement-card').forEach(card => {
        const name = card.getAttribute('data-name').toLowerCase();
        card.style.display = name.includes(query) ? 'block' : 'none';
    });

    checkAchievements();
}

function deleteBook(id) {
    if(confirm("Delete?")) {
        books = books.filter(b => b.id !== id);
        localStorage.setItem('lumina_db', JSON.stringify(books));
        render();
    }
}

function checkAchievements() {
    const completedCount = books.filter(b => b.current >= b.total && b.type === 'library').length;
    if (completedCount >= 1) document.getElementById('ach-1').classList.add('unlocked');
    if (completedCount >= 5) document.getElementById('ach-5').classList.add('unlocked');
    if (completedCount >= 10) document.getElementById('ach-10').classList.add('unlocked');
    if (books.some(b => b.type === 'wishlist')) document.getElementById('ach-wish').classList.add('unlocked');
}

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lumina_library.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

render();