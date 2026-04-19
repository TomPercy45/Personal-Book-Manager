const supabaseUrl = 'https://hhgybqhrhmlhgvatemcm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhoZ3licWhyaG1saGd2YXRlbWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2MDgwODAsImV4cCI6MjA5MjE4NDA4MH0.d0g0gxUjwCdG0HelL-5GOB_-YobQuypEsoX4Cs0Y5q0';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- NAVIGATION ---
function showView(viewId) {
    document.querySelectorAll('.view').forEach(v => v.style.display = 'none');
    document.getElementById(`view-${viewId}`).style.display = 'block';
    if(viewId === 'stats') renderStats();
}

// --- GOOGLE BOOKS API (Only Cover & Author) ---
async function searchBook(title) {
    const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${title}`);
    const data = await res.json();
    return data.items.map(item => ({
        title: item.volumeInfo.title,
        author: item.volumeInfo.authors?.[0] || 'Unknown',
        cover: item.volumeInfo.imageLinks?.thumbnail || '',
        pages: item.volumeInfo.pageCount || 0
    }));
}

// --- CORE LOGIC: AUTO-SORTING ---
async function updateProgress(bookId, newPage, totalPages) {
    let newStatus = 'unread';
    let finishDate = null;
    let startDate = null;

    if (newPage > 0 && newPage < totalPages) {
        newStatus = 'in_progress';
        startDate = new Date().toISOString().split('T')[0]; // Set start date on first progress
    } else if (newPage >= totalPages) {
        newStatus = 'read';
        finishDate = new Date().toISOString().split('T')[0];
    }

    const { data, error } = await supabase
        .from('books')
        .update({ current_page: newPage, status: newStatus, finish_date: finishDate })
        .eq('id', bookId);
    
    loadBooks(); // Refresh UI
}

// --- STATS LOGIC ---
async function renderStats() {
    const currentYear = new Date().getFullYear();
    const { data: books } = await supabase.from('books').select('*');
    
    // Fill year dropdown
    const years = [...new Set(books.map(b => new Date(b.finish_date || b.created_at).getFullYear()))];
    const select = document.getElementById('stats-year-select');
    select.innerHTML = years.map(y => `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${y}</option>`).join('');

    const filtered = books.filter(b => b.status === 'read' && new Date(b.finish_date).getFullYear() == select.value);
    
    const pages = filtered.reduce((acc, b) => acc + b.total_pages, 0);
    const longest = Math.max(...filtered.map(b => b.total_pages), 0);

    document.getElementById('stats-container').innerHTML = `
        <div class="stat-card"><h3>${filtered.length}</h3><p>Books Read</p></div>
        <div class="stat-card"><h3>${pages}</h3><p>Pages Read</p></div>
        <div class="stat-card"><h3>${longest}</h3><p>Longest Book</p></div>
    `;
}

// Initial Load
showView('progress');