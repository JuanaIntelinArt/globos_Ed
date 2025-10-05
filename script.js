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

    // --- Lógica de Inicio y Audio Mejorada ---
    startGameButton.addEventListener('click', () => {
        // Intentar reproducir audio con la interacción del usuario
        birthdayAudio.volume = 0.5;
        birthdayAudio.play().catch(e => {
            console.warn("Error al intentar reproducir audio:", e);
        });
        
        // Ocultar la pantalla de inicio
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

        // Posicionamiento de los globos
        const x = Math.random() * 75 + 5; 
        const y = Math.random() * 40 + 5; 

        balloon.style.left = `${x}vw`;
        balloon.style.top = `${y}vh`;

        const content = document.createElement('div');
        content.classList.add('balloon-content');
        content.textContent = data.text; 
        balloon.appendChild(content);

        balloon.addEventListener('click', () => dropLetter(balloon, data.text));
        
        balloonArea.appendChild(balloon);
    }

    /**
     * Función para soltar la letra del globo.
     */
    function dropLetter(balloon, text) {
        if (!balloon.classList.contains('popped')) {
            balloon.classList.add('popped');
            
            // Crear el elemento de letra que cae
            const rect = balloon.getBoundingClientRect();
            const letter = document.createElement('div');
            letter.classList.add('draggable-letter', 'dropping');
            letter.textContent = text;
            letter.dataset.text = balloon.dataset.text;
            letter.dataset.order = balloon.dataset.order;

            // Posicionar la letra donde estaba el globo
            letter.style.left = `${rect.left}px`;
            letter.style.top = `${rect.top}px`;
            document.body.appendChild(letter);
            
            // Animación de caída
            setTimeout(() => {
                const targetRect = targetArea.getBoundingClientRect();
                const dropY = targetRect.top - letter.offsetHeight; 

                letter.style.top = `${dropY}px`;
                letter.style.transition = 'top 1.5s cubic-bezier(0.5, 0, 1, 1)'; 
                letter.style.zIndex = 60; 

                letter.addEventListener('transitionend', () => {
                    letter.classList.remove('dropping');
                    makeDraggable(letter);
                }, { once: true });
            }, 50); 
        }
    }

    /**
     * Implementa la lógica de arrastrar y soltar.
     */
    function makeDraggable(element) {
        element.addEventListener('mousedown', startDrag);
        element.addEventListener('touchstart', startDrag);
    }

    function startDrag(e) {
        e.preventDefault(); 
        
        const element = e.currentTarget;
        activeDrag = element;
        element.style.position = 'absolute'; 
        element.style.zIndex = 70; 
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        element.offsetX = clientX - element.getBoundingClientRect().left;
        element.offsetY = clientY - element.getBoundingClientRect().top; 
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('touchmove', drag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);
    }

    function drag(e) {
        if (!activeDrag) return;
        e.preventDefault();
        
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
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
        
        // Si la letra ya estaba colocada, la quitamos de su posición anterior
        if (placedLetters.includes(letterElement)) {
            const oldIndex = placedLetters.indexOf(letterElement);
            placedLetters[oldIndex] = null;
        }

        // Colocamos la letra en su posición nueva/correcta
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
        // Obtenemos el mensaje actual uniendo las letras en el orden del array
        const fullMessageArray = placedLetters.map(l => l ? l.dataset.text : '').filter(Boolean);
        const currentMessage = fullMessageArray.join('');

        if (fullMessageArray.length === balloonData.length) {
            // Compara el mensaje sin espacios
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