// Load Banner
fetch('banner.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('banner').innerHTML = data;
    })
    .catch(error => console.error('Error loading banner:', error));

// Load Header
fetch('header.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('header').innerHTML = data;
    })
    .catch(error => console.error('Error loading header:', error));

// Load Navigation
fetch('nav.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('nav').innerHTML = data;
        // Highlight the active link based on the current URL
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a');
        navLinks.forEach(link => {
            if (link.getAttribute('href') === currentPage) {
                link.classList.add('active');
            }
        });
    })
    .catch(error => console.error('Error loading nav:', error));

// Load Footer
fetch('footer.html')
    .then(response => response.text())
    .then(data => {
        document.getElementById('footer').innerHTML = data;
    })
    .catch(error => console.error('Error loading footer:', error));
