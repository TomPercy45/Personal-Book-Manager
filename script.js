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
        document.getElementById('totalPages').value = book.total;
        document.getElementById('currentPage').value = book.current;
        document.getElementById('price').value = book.price || '';
        document.getElementById('buyLink').value = book.link || '';
        document.getElementById('type').value = book.type;
    } else {
        document.getElementById('editId').value = "";
        document.getElementById('title').value = "";
        document.getElementById('cover').value = "";
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
    // Add this logic inside your saveBook function
    if (bookData.current >= bookData.total && bookData.total > 0) {
    // Only set the year if it wasn't already set (to keep the original completion year)
    if (!bookData.completedYear) {
        bookData.completedYear = new Date().getFullYear();
    }
    } else {
    // If they move it back from completed, remove the year
    bookData.completedYear = null;
}
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

function renderStats() {
    const container = document.getElementById('statsContainer');
    container.innerHTML = '';

    // 1. Filter only completed books that have a year assigned
    const completedBooks = books.filter(b => b.completedYear);

    // 2. Group books by year
    const statsByYear = {};
    completedBooks.forEach(book => {
        const year = book.completedYear;
        if (!statsByYear[year]) {
            statsByYear[year] = { count: 0, pages: 0, longest: { title: 'None', val: 0, unit: '' } };
        }
        
        statsByYear[year].count++;
        statsByYear[year].pages += (book.total || 0);

        // Track longest book
        if (book.total > statsByYear[year].longest.val) {
            statsByYear[year].longest = { 
                title: book.title, 
                val: book.total, 
                unit: book.unit || 'pages' 
            };
        }
    });

    // 3. Sort years descending (newest first)
    const sortedYears = Object.keys(statsByYear).sort((a, b) => b - a);

    if (sortedYears.length === 0) {
        container.innerHTML = `<p style="text-align:center; color:var(--text-dim); margin-top:20px;">Finish a book to see your stats!</p>`;
        return;
    }

    // 4. Build the HTML
    sortedYears.forEach(year => {
        const data = statsByYear[year];
        container.innerHTML += `
            <div class="stats-card">
                <div class="stats-year">${year}</div>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-value">${data.count}</span>
                        <span class="stat-label">Books Read</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-value">${data.pages.toLocaleString()}</span>
                        <span class="stat-label">Total Units</span>
                    </div>
                </div>
                <div class="stats-footer">
                    <strong>Longest:</strong> ${data.longest.title} (${data.longest.val} ${data.longest.unit})
                </div>
            </div>
        `;
    });
}

// Ensure renderStats is called when the view changes
const originalShowView = showView;
showView = function(viewId) {
    originalShowView(viewId);
    if (viewId === 'stats') renderStats();
};

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

// Load settings from local storage
let ghConfig = JSON.parse(localStorage.getItem('lumina_gh_config')) || null;

function saveSettings() {
    const config = {
        user: document.getElementById('gh-user').value,
        repo: document.getElementById('gh-repo').value,
        token: document.getElementById('gh-token').value
    };
    localStorage.setItem('lumina_gh_config', JSON.stringify(config));
    ghConfig = config;
    alert("Settings saved! Refreshing data...");
    fetchFromGitHub();
}

// THE SYNC ENGINE
async function fetchFromGitHub() {
    if (!ghConfig) return;
    
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/data.json`;
    
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `token ${ghConfig.token}` }
        });
        const data = await response.json();
        
        // GitHub sends file content as Base64 encoded string
        const content = JSON.parse(atob(data.content));
        books = content;
        render(); // Update your UI
        return data.sha; // We need this "sha" to update the file later
    } catch (err) {
        console.error("Fetch failed", err);
    }
}

async function pushToGitHub() {
    if (!ghConfig) return;

    // 1. Get the current file's SHA (GitHub requires this to prevent overwriting errors)
    const currentSha = await fetchFromGitHub();
    
    const url = `https://api.github.com/repos/${ghConfig.user}/${ghConfig.repo}/contents/data.json`;
    
    const body = {
        message: "Update library data",
        content: btoa(JSON.stringify(books, null, 2)), // Encode to Base64
        sha: currentSha
    };

    try {
        await fetch(url, {
            method: 'PUT',
            headers: { 
                'Authorization': `token ${ghConfig.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        console.log("GitHub Synced!");
    } catch (err) {
        alert("Sync failed: " + err.message);
    }
}

async function saveBook() {
    // ... your existing logic to update the 'books' array ...
    
    // Add this at the end:
    if (ghConfig) {
        await pushToGitHub();
    } else {
        localStorage.setItem('lumina_db', JSON.stringify(books));
    }
    
    closeModal();
    render();
}

render();