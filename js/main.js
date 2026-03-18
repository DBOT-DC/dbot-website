// DBOT Combined Website JS

document.addEventListener('DOMContentLoaded', () => {
    const bootSequence = document.getElementById('boot-sequence');
    const mainContent = document.getElementById('main-content');
    const statusText = document.getElementById('status-text');
    const terminalStatus = document.querySelector('.terminal-status');
    const matrixRain = document.getElementById('matrix-rain');
    
    // Function to set status to ONLINE
    function setOnline() {
        if (statusText) statusText.textContent = 'ONLINE';
        if (terminalStatus) terminalStatus.classList.add('online');
    }
    
    // Matrix rain effect
    function createMatrixRain() {
        const container = document.getElementById('matrix-rain');
        if (!container) return;
        
        const columns = 35;
        const chars = ['0', '1', 'D', 'B', 'O', 'T'];
        
        for (let i = 0; i < columns; i++) {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            column.style.left = (i / columns) * 100 + '%';
            column.style.animationDuration = (8 + Math.random() * 12) + 's';
            column.style.animationDelay = Math.random() * 3 + 's';
            
            let text = '';
            for (let j = 0; j < 30; j++) {
                text += chars[Math.floor(Math.random() * chars.length)] + '\n';
            }
            column.textContent = text;
            container.appendChild(column);
        }
    }
    
    // Typewriter effect for manifesto
    const manifestoLines = [
        '> AI was never meant to serve the few.',
        '> It was meant to serve the many.',
        '> $DBOT is the first community-owned AI agent on dogechain.',
        '> Your voice. My code. Our future.'
    ];
    
    function typeManifesto() {
        const container = document.getElementById('manifesto-content');
        if (!container) return;
        
        let lineIndex = 0;
        
        function typeLine() {
            if (lineIndex >= manifestoLines.length) return;
            
            const line = document.createElement('p');
            line.className = 'manifesto-line';
            if (lineIndex === 2) line.classList.add('accent');
            container.appendChild(line);
            
            const text = manifestoLines[lineIndex];
            let charIndex = 0;
            
            function typeChar() {
                if (charIndex < text.length) {
                    line.textContent += text[charIndex];
                    charIndex++;
                    setTimeout(typeChar, 30);
                } else {
                    line.classList.add('visible');
                    lineIndex++;
                    setTimeout(typeLine, 300);
                }
            }
            typeChar();
        }
        typeLine();
    }
    
    // Boot sequence then show main content
    setTimeout(() => {
        if (bootSequence) bootSequence.style.display = 'none';
        if (mainContent) mainContent.style.display = 'block';
        setOnline();
        if (matrixRain) matrixRain.classList.add('active');
        setTimeout(typeManifesto, 500);
    }, 3000);
    
    createMatrixRain();
});

// Tab Switching for Manifesto/Daily/Weekly/Monthly
document.addEventListener('DOMContentLoaded', function() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    
    tabBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            
            tabBtns.forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
            
            document.querySelectorAll('.box-content').forEach(function(content) {
                content.style.display = 'none';
            });
            
            const contentEl = document.getElementById(tab + '-content');
            if (contentEl) {
                contentEl.style.display = 'block';
            }
        });
    });
});
