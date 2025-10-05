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
    const CORRECT_MESSAGE = "Happy Birthday Ed 40!";
    let placedLetters = Array(balloonData.length).fill(null);
    let activeDrag = null;

    // Intentar reproducir audio automáticamente
    birthdayAudio.volume = 0.5;
    birthdayAudio.play().catch(e => {
        console.log("No se pudo reproducir el audio automáticamente. Requiere interacción del usuario.", e);
        // Si falla, el usuario escuchará el audio al interactuar con la página
    });


    /**
     * Función para crear y posicionar un globo.
     */
    function createBalloon(data) {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon', `color-${data.color}`);
        balloon.dataset.text = data.text;
        balloon.dataset.order = data.correctOrder;

        // Posición aleatoria
        const x = Math.random() * 75 + 5; 
        const y = Math.random() * 40 + 5; 

        balloon.style.left = `${x}vw`;
        balloon.style.top = `${y}vh`;

        // Contenido del globo (texto oculto por CSS)
        const content = document.createElement('div');
        content.classList.add('balloon-content');
        content.textContent = data.text;
        balloon.appendChild(content);

        // Evento de clic para "explotar" y soltar la letra
        balloon.addEventListener('click', () => dropLetter(balloon, data.text));
        
        balloonArea.appendChild(balloon);
    }

    /**
     * Función para soltar la letra del globo.
     */
    function dropLetter(balloon, text) {
        if (!balloon.classList.contains('popped')) {
            balloon.classList.add('popped');
            balloon.style.display = 'none';
            
            const rect = balloon.getBoundingClientRect();

            const letter = document.createElement('div');
            letter.classList.add('draggable-letter', 'dropping');
            letter.textContent = text;
            letter.dataset.text = balloon.dataset.text;
            letter.dataset.order = balloon.dataset.order;

            // Posición inicial de la letra caída (donde estaba el globo)
            letter.style.left = `${rect.left}px`;
            letter.style.top = `${rect.top}px`;
            
            document.body.appendChild(letter);
            
            // Animación de caída
            setTimeout(() => {
                // Leer la posición real del targetArea (que está ahora a altura media)
                const targetRect = targetArea.getBoundingClientRect();
                
                // La letra cae justo encima de la línea punteada del targetArea
                const dropY = targetRect.top - letter.offsetHeight; 

                letter.style.top = `${dropY}px`;
                letter.style.transition = 'top 1.5s cubic-bezier(0.5, 0, 1, 1)';
                letter.style.zIndex = 20;

                // Después de la caída, habilitar el arrastre
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
        element.style.zIndex = 30; 
        
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
        const clientY = e.touches[0].clientY;
        
        activeDrag.style.left = `${clientX - activeDrag.offsetX}px`;
        activeDrag.style.top = `${clientY - activeDrag.offsetY}px`;
    }

    function endDrag(e) {
        if (!activeDrag) return;
        
        const targetRect = targetArea.getBoundingClientRect();
        const letterRect = activeDrag.getBoundingClientRect();

        // Chequeo de colisión simple
        const isOverTarget = (
            letterRect.bottom > targetRect.top &&
            letterRect.top < targetRect.bottom &&
            letterRect.left < targetRect.right &&
            letterRect.right > targetRect.left
        );

        if (isOverTarget) {
            placeLetterInTarget(activeDrag);
        } else {
            activeDrag.style.zIndex = 20;
        }

        // Limpiar los listeners
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
        
        // Manejo de duplicados
        if (placedLetters.includes(letterElement)) {
            const oldIndex = placedLetters.indexOf(letterElement);
            placedLetters[oldIndex] = null;
        }

        placedLetters[orderIndex] = letterElement;
        
        // Ajuste visual
        letterElement.style.position = 'relative';
        letterElement.style.top = '0';
        letterElement.style.left = '0';
        letterElement.style.transform = 'none';
        letterElement.style.zIndex = 5;
        letterElement.classList.add('target-letter');
        
        letterElement.removeEventListener('mousedown', startDrag);
        letterElement.removeEventListener('touchstart', startDrag);

        // Reconstruir el targetArea
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

        // Solo chequear si tenemos todas las partes
        if (fullMessageArray.length === balloonData.length) {
            if (currentMessage === CORRECT_MESSAGE.replace(/\s/g, '')) {
                winMessage.classList.remove('hidden');
                winImage.classList.remove('hidden');
                targetArea.style.borderBottom = '3px solid gold';
                
                // Opcional: pausar la música
                // birthdayAudio.pause(); 
            }
        }
    }

    // Inicializar el juego creando los globos
    balloonData.forEach(createBalloon);
});