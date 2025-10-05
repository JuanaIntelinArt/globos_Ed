document.addEventListener('DOMContentLoaded', () => {
    // Definición de los globos y sus propiedades
    const balloonData = [
        { color: 'rosa', text: 'Ha', correctOrder: 0 },
        { color: 'verde', text: 'ppy', correctOrder: 1 },
        { color: 'azul', text: 'Bi', correctOrder: 2 },
        { color: 'amarillo', text: 'rth', correctOrder: 3 },
        { color: 'violeta', text: 'day', correctOrder: 4 },
        { color: 'plomo', text: 'Ed', correctOrder: 5 },
        { color: 'mostaza', text: '40!', correctOrder: 6 },
    ];
    
    const balloonArea = document.getElementById('balloon-area');
    const targetArea = document.getElementById('target-area');
    const winMessage = document.getElementById('win-message');
    const winImage = document.getElementById('win-image'); 
    const birthdayAudio = document.getElementById('birthday-audio'); 
    const startButtonOverlay = document.getElementById('start-button-overlay');
    const startGameButton = document.getElementById('start-game-button');
    
    const CORRECT_MESSAGE = "Happy Birthday Ed 40!";
    let placedLetters = Array(balloonData.length).fill(null);
    let activeDrag = null;

    // --- Lógica de Inicio y Audio ---
    startGameButton.addEventListener('click', () => {
        birthdayAudio.volume = 0.5;
        birthdayAudio.play().catch(e => {
            console.warn("Error al intentar reproducir audio:", e);
        });
        
        startButtonOverlay.classList.add('hidden');
    });


    /**
     * Función para crear y posicionar un globo.
     */
    function createBalloon(data) {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon', `color-${data.color}`);
        balloon.dataset.text = data.text;
        balloon.dataset.order = data.correctOrder;

        const x = Math.random() * 75 + 5; 
        const y = Math.random() * 40 + 5; 

        balloon.style.left = `${x}vw`;
        balloon.style.top = `${y}vh`;

        const content = document.createElement('div');
        content.classList.add('balloon-content');
        content.textContent = data.text; 
        balloon.appendChild(content);

        // Al hacer clic, ejecuta el inicio del arrastre
        balloon.addEventListener('click', (e) => dropLetter(e, balloon, data.text));
        
        balloonArea.appendChild(balloon);
    }

    /**
     * Función para soltar la letra del globo y activar el arrastre.
     */
    function dropLetter(e, balloon, text) {
        if (!balloon.classList.contains('popped')) {
            balloon.classList.add('popped');
            
            // Crear el elemento de letra
            const rect = balloon.getBoundingClientRect();
            const letter = document.createElement('div');
            letter.classList.add('draggable-letter');
            letter.textContent = text;
            letter.dataset.text = balloon.dataset.text;
            letter.dataset.order = balloon.dataset.order;

            // Posicionar la letra donde estaba el globo
            letter.style.left = `${rect.left}px`;
            letter.style.top = `${rect.top}px`;
            document.body.appendChild(letter);
            
            // Iniciar el arrastre inmediatamente
            startDrag({
                clientX: e.clientX,
                clientY: e.clientY,
                currentTarget: letter,
                preventDefault: () => {} 
            }, true); 
        }
    }

    /**
     * Implementa la lógica de arrastrar y soltar.
     */
    function makeDraggable(element) {
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);
    }

    function startDrag(e, isForcedStart = false) {
        e.preventDefault(); 
        
        const element = e.currentTarget;
        activeDrag = element;
        element.style.position = 'absolute'; 
        element.style.zIndex = 70; 
        
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;
        
        if (isForcedStart) {
            // Centra la letra bajo el cursor al inicio
            element.offsetX = element.offsetWidth / 2;
            element.offsetY = element.offsetHeight / 2;
        } else {
            element.offsetX = clientX - element.getBoundingClientRect().left;
            element.offsetY = clientY - element.getBoundingClientRect().top; 
        }

        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        if (isForcedStart) {
            drag(e);
        }
    }

    function drag(e) {
        if (!activeDrag) return;
        e.preventDefault();
        
        const clientX = e.clientX || e.touches?.[0].clientX;
        const clientY = e.clientY || e.touches?.[0].clientY;
        
        activeDrag.style.left = `${clientX - activeDrag.offsetX}px`;
        activeDrag.style.top = `${clientY - activeDrag.offsetY}px`;
    }

    function endDrag(e) {
        if (!activeDrag) return;
        
        const targetRect = targetArea.getBoundingClientRect();
        const letterRect = activeDrag.getBoundingClientRect();

        const isOverTarget = (
            letterRect.bottom > targetRect.top &&
            letterRect.top < targetRect.bottom &&
            letterRect.left < targetRect.right &&
            letterRect.right > targetRect.left
        );

        if (isOverTarget) {
            placeLetterInTarget(activeDrag);
        } else {
            activeDrag.style.zIndex = 60;
            makeDraggable(activeDrag); // Sigue siendo arrastrable si se suelta fuera
        }

        document.removeEventListener('mousemove', drag);
        document.removeEventListener('touchmove', drag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);
        activeDrag = null;
    }

    /**
     * Coloca la letra en el array de posición y actualiza la visualización.
     */
    function placeLetterInTarget(letterElement) {
        const orderIndex = parseInt(letterElement.dataset.order);
        
        if (placedLetters.includes(letterElement)) {
            const oldIndex = placedLetters.indexOf(letterElement);
            placedLetters[oldIndex] = null;
        }

        placedLetters[orderIndex] = letterElement;
        
        // Estilo para acomodar la letra en el contenedor flexbox
        letterElement.style.position = 'relative'; 
        letterElement.style.top = '0';
        letterElement.style.left = '0';
        letterElement.style.transform = 'none';
        letterElement.style.zIndex = 5; 
        letterElement.classList.add('target-letter');
        
        letterElement.removeEventListener('mousedown', startDrag);
        letterElement.removeEventListener('touchstart', startDrag);

        // Reconstruir el targetArea para el orden correcto
        targetArea.innerHTML = '';
        placedLetters.forEach(letter => {
            if (letter) {
                targetArea.appendChild(letter);
            }
        });

        checkWinCondition();
    }

    /**
     * Revisa si el mensaje completo es correcto.
     */
    function checkWinCondition() {
        const fullMessageArray = placedLetters.map(l => l ? l.dataset.text : '').filter(Boolean);
        const currentMessage = fullMessageArray.join('');

        if (fullMessageArray.length === balloonData.length) {
            if (currentMessage === CORRECT_MESSAGE.replace(/\s/g, '')) {
                winMessage.classList.remove('hidden');
                winImage.classList.remove('hidden');
                targetArea.style.borderBottom = '3px solid gold';
                birthdayAudio.pause();
            }
        }
    }

    // Inicializar el juego creando los globos
    balloonData.forEach(createBalloon);
});