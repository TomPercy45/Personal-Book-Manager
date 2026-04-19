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
    const currentPosWrapper = document.getElementById('currentPosWrapper');
    const modalTitle = document.getElementById('modalTitle');

    if (editId) {
        // --- EDIT MODE ---
        const book = books.find(b => b.id === editId);
        modalTitle.innerText = "Edit Book Details";
        currentPosWrapper.style.display = "block"; // Show current position field
        
        document.getElementById('editId').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('cover').value = book.cover;
        document.getElementById('totalPages').value = book.total;
        document.getElementById('currentPage').value = book.current;
        document.getElementById('trackingType').value = book.trackingType || 'pages';
        document.getElementById('type').value = book.type;
        document.getElementById('price').value = book.price || '';
        document.getElementById('buyLink').value = book.link || '';
    } else {
        // --- ADD MODE ---
        modalTitle.innerText = "Add New Entry";
        currentPosWrapper.style.display = "none"; // HIDE current position field
        
        document.getElementById('editId').value = "";
        document.getElementById('title').value = "";
        document.getElementById('cover').value = "";
        document.getElementById('totalPages').value = "";
        document.getElementById('currentPage').value = 0; // Set to 0 in background
        document.getElementById('trackingType').value = 'pages';
        document.getElementById('type').value = 'library';
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
        trackingType: document.getElementById('trackingType').value, // NEW
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

        // DYNAMIC UNIT LABEL
        const unitLabel = book.trackingType === 'chapters' ? 'Ch.' : 'p.';

        const infoText = book.type === 'wishlist' ? 
            `<div style="color:var(--purple); font-weight:bold;">£${book.price || '0.00'}</div>` : 
            `<div style="font-size:0.7rem; color:var(--text-dim)">${unitLabel} ${book.current} / ${book.total}</div>`;

        const progress = book.type === 'library' ? 
            `<div class="progress-container"><div class="progress-fill" style="width: ${percent}%"></div></div>` : '';

        const card = `
            <div class="book-card">
                <img src="${book.cover}" class="cover-preview">
                <div class="book-info">
                    <span class="book-title">${book.title}</span>
                    ${infoText}
                    ${progress}
                    <div class="card-actions">
                        <button class="btn-card edit" onclick="openModal(${book.id})">EDIT</button>
                        <button class="btn-card del" onclick="deleteBook(${book.id})">DEL</button>
                    </div>
                </div>
            </div>`;
        
        if (containers[targetId]) containers[targetId].innerHTML += card;
    });

    renderAchievements(query);
}

function renderAchievements(query) {
    const grid = document.getElementById('achievementsGrid');
    grid.innerHTML = '';
    const completedCount = books.filter(b => b.current >= b.total && b.type === 'library').length;
    const wishlistCount = books.filter(b => b.type === 'wishlist').length;

    achievementData.forEach(ach => {
        if (!ach.name.toLowerCase().includes(query)) return;
        
        let isUnlocked = false;
        if (ach.type === 'completed' && completedCount >= ach.requirement) isUnlocked = true;
        if (ach.type === 'wishlist' && wishlistCount >= ach.requirement) isUnlocked = true;

        grid.innerHTML += `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : ''}">
                <div style="font-size: 1.5rem; margin-bottom:5px;">${ach.icon}</div>
                <div>${ach.name}</div>
            </div>`;
    });
}

function deleteBook(id) {
    if(confirm("Delete this book?")) {
        books = books.filter(b => b.id !== id);
        localStorage.setItem('lumina_db', JSON.stringify(books));
        render();
    }
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