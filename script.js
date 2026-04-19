let books = JSON.parse(localStorage.getItem('lumina_db')) || [];
let selectedUnit = 'pages'; // Default unit

function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.bottom-nav button').forEach(b => b.classList.remove('active'));
    document.getElementById(viewId).classList.add('active');
    document.getElementById('nav-' + viewId).classList.add('active');
}

function setUnit(unit) {
    selectedUnit = unit;
    const isPages = unit === 'pages';
    
    // Update Button UI
    document.getElementById('unit-pages').classList.toggle('active', isPages);
    document.getElementById('unit-chapters').classList.toggle('active', !isPages);
    
    // Update Labels
    document.getElementById('totalLabel').innerText = isPages ? 'Total Pages' : 'Total Chapters';
    document.getElementById('currentLabel').innerText = isPages ? 'Current Page' : 'Current Chapter';
}

function toggleWishlistFields() {
    const type = document.getElementById('type').value;
    document.getElementById('wishlistFields').style.display = type === 'wishlist' ? 'block' : 'none';
    document.getElementById('libraryFields').style.display = type === 'library' ? 'block' : 'none';
}

function openModal(editId = null) {
    const modal = document.getElementById('bookModal');
    const progressWrapper = document.getElementById('currentProgressWrapper');
    
    if (editId) {
        const book = books.find(b => b.id === editId);
        document.getElementById('editId').value = book.id;
        document.getElementById('title').value = book.title;
        document.getElementById('cover').value = book.cover;
        document.getElementById('totalPages').value = book.total;
        document.getElementById('currentPage').value = book.current;
        document.getElementById('price').value = book.price || '';
        document.getElementById('buyLink').value = book.link || '';
        document.getElementById('type').value = book.type;
        
        setUnit(book.unit || 'pages'); // Restore the saved unit
        progressWrapper.style.display = 'block'; // Show progress field when editing
    } else {
        document.getElementById('editId').value = "";
        document.getElementById('title').value = "";
        document.getElementById('cover').value = "";
        document.getElementById('totalPages').value = "";
        document.getElementById('currentPage').value = 0; // Default to 0
        
        setUnit('pages'); // Default for new books
        progressWrapper.style.display = 'none'; // Hide progress field for new books
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
    unit: selectedUnit, // Store if it's pages or chapters
    title: document.getElementById('title').value,
    // ... rest of your code
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
    const unitLabel = book.unit === 'chapters' ? 'chapters' : 'pages';
    const infoText = book.type === 'wishlist' 
    ? `<div style="color:var(--purple); font-weight:bold;">£${book.price || '0.00'}</div>` 
    : `<div style="font-size:0.7rem; color:var(--text-dim)">${book.current} / ${book.total} ${unitLabel}</div>`;

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

        const infoText = book.type === 'wishlist' ? `<div style="color:var(--purple); font-weight:bold;">£${book.price || '0.00'}</div>` : `<div style="font-size:0.7rem; color:var(--text-dim)">${book.current} / ${book.total} pages</div>`;
        const progress = book.type === 'library' ? `<div class="progress-container"><div class="progress-fill" style="width: ${percent}%"></div></div>` : '';

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