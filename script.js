const supabaseUrl = 'https://dfqegppotcuslkrzcpqh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmcWVncHBvdGN1c2xrcnpjcHFoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1OTk5ODgsImV4cCI6MjA5MjE3NTk4OH0.ft4apDfAmNwneUmm4hc7hIPJNPZdUP80I5G3HH1FHE4';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

let books = [];
let selectedUnit = 'pages'; // For the toggle we added earlier

async function handleAuth(type) {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    if (!email || !password) return alert("Please enter both email and password");

    const { error } = (type === 'signIn') 
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });

    if (error) alert(error.message);
}

async function handleSignOut() {
    await supabase.auth.signOut();
    location.reload();
}

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

// REPLACE your old fetchBooks/saveBook/deleteBook with these:
async function fetchBooks() {
    const { data, error } = await supabase
        .from('books')
        .select('*')
        .order('id', { ascending: false });
    
    if (error) console.error(error);
    else {
        books = data;
        render(); // This triggers your existing UI drawing logic
    }
}

async function saveBook() {
    const user = (await supabase.auth.getUser()).data.user;
    const id = document.getElementById('editId').value;
    
    const bookData = {
        user_id: user.id,
        title: document.getElementById('title').value,
        cover: document.getElementById('cover').value,
        type: document.getElementById('type').value,
        unit: selectedUnit,
        total: parseInt(document.getElementById('totalPages').value) || 0,
        current: parseInt(document.getElementById('currentPage').value) || 0,
        price: parseFloat(document.getElementById('price').value) || 0,
        link: document.getElementById('buyLink').value
    };

    if (id) {
        await supabase.from('books').update(bookData).eq('id', id);
    } else {
        await supabase.from('books').insert([bookData]);
    }

    closeModal();
    fetchBooks(); // Refresh the list from the cloud
}

async function deleteBook(id) {
    if(confirm("Delete this book?")) {
        await supabase.from('books').delete().eq('id', id);
        fetchBooks();
    }
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

function exportData() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(books));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "lumina_library.json");
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

supabase.auth.onAuthStateChange((event, session) => {
    const authOverlay = document.getElementById('authOverlay');
    const mainApp = document.getElementById('mainApp');
    
    if (session) {
        authOverlay.style.display = 'none';
        mainApp.style.display = 'block';
        fetchBooks(); // Load data from the cloud
    } else {
        authOverlay.style.display = 'flex';
        mainApp.style.display = 'none';
    }
});

render();