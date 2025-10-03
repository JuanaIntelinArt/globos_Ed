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
    const CORRECT_MESSAGE = "Happy Birthday Ed 40!";
    let placedLetters = Array(balloonData.length).fill(null); // Para rastrear el orden
    let activeDrag = null; // Elemento que se está arrastrando

    /**
     * Función para crear y posicionar un globo.
     */
    function createBalloon(data) {
        const balloon = document.createElement('div');
        balloon.classList.add('balloon', `color-${data.color}`);
        balloon.dataset.text = data.text;
        balloon.dataset.order = data.correctOrder;

        // Posición aleatoria (75% del ancho para dejar espacio, 40% de alto para evitar la pizarra)
        const x = Math.random() * 75 + 5; // 5% a 80%
        const y = Math.random() * 40 + 5; // 5% a 45%

        balloon.style.left = `${x}vw`;
        balloon.style.top = `${y}vh`;

        // Contenido del globo
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
            balloon.style.display = 'none'; // Oculta el globo
            
            const rect = balloon.getBoundingClientRect();

            const letter = document.createElement('div');
            letter.classList.add('draggable-letter', 'dropping');
            letter.textContent = text;
            letter.dataset.text = balloon.dataset.text; // Guarda el texto para el chequeo final
            letter.dataset.order = balloon.dataset.order; // Guarda el orden correcto

            // Posición inicial de la letra caída (donde estaba el globo)
            letter.style.left = `${rect.left}px`;
            letter.style.top = `${rect.top}px`;
            
            document.body.appendChild(letter);
            
            // Animación de caída: forzar un reflow antes de cambiar la posición final
            setTimeout(() => {
                // Caída fluida: mueve la letra hacia el centro vertical del targetArea
                const targetRect = targetArea.getBoundingClientRect();
                const dropY = targetRect.top - letter.offsetHeight; // Cae justo encima del target

                letter.style.top = `${dropY}px`;
                letter.style.transition = 'top 1.5s cubic-bezier(0.5, 0, 1, 1)'; // Animación de caída (lenta al inicio, rápida al final)
                letter.style.zIndex = 20;

                // Después de la caída, habilitar el arrastre
                letter.addEventListener('transitionend', () => {
                    letter.classList.remove('dropping');
                    makeDraggable(letter);
                }, { once: true });
            }, 50); // Pequeño delay para asegurar que el CSS de la posición inicial se aplique
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
        element.style.position = 'absolute'; // Necesario para arrastrar libremente
        element.style.zIndex = 30; // Mover al frente
        
        // Determinar coordenadas iniciales
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
        
        // Calcular el desplazamiento (offset) del cursor dentro del elemento
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
        
        // Mover el elemento a la nueva posición del cursor menos el offset
        activeDrag.style.left = `${clientX - activeDrag.offsetX}px`;
        activeDrag.style.top = `${clientY - activeDrag.offsetY}px`;
    }

    function endDrag(e) {
        if (!activeDrag) return;
        
        // Revisa si el elemento está sobre el área objetivo (targetArea)
        const targetRect = targetArea.getBoundingClientRect();
        const letterRect = activeDrag.getBoundingClientRect();

        // Chequeo de colisión simple: si la mitad del elemento está sobre el target
        const isOverTarget = (
            letterRect.bottom > targetRect.top &&
            letterRect.top < targetRect.bottom &&
            letterRect.left < targetRect.right &&
            letterRect.right > targetRect.left
        );

        if (isOverTarget) {
            placeLetterInTarget(activeDrag);
        } else {
            // Si lo suelta fuera, simplemente se detiene el arrastre (queda donde lo soltó)
            activeDrag.style.zIndex = 20;
        }

        // Limpiar los listeners de arrastre
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
        
        // Si ya hay algo en esa posición, lo removemos para evitar duplicados
        if (placedLetters.includes(letterElement)) {
            const oldIndex = placedLetters.indexOf(letterElement);
            placedLetters[oldIndex] = null;
        }

        // Colocar la letra en la posición correcta (basado en el índice correcto)
        placedLetters[orderIndex] = letterElement;
        
        // Ajustar visualmente: eliminar el estilo de arrastre libre
        letterElement.style.position = 'relative';
        letterElement.style.top = '0';
        letterElement.style.left = '0';
        letterElement.style.transform = 'none';
        letterElement.style.zIndex = 5;
        letterElement.classList.add('target-letter');
        
        // Eliminar el evento de arrastre una vez colocada
        letterElement.removeEventListener('mousedown', startDrag);
        letterElement.removeEventListener('touchstart', startDrag);

        // Reconstruir el targetArea en el orden de placedLetters
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
            if (currentMessage === CORRECT_MESSAGE.replace(/\s/g, '')) { // Comparar sin espacios si el mensaje de chequeo no los tiene
                winMessage.classList.remove('hidden');
                targetArea.style.borderBottom = '3px solid gold';
            }
        }
    }

    // Inicializar el juego creando los globos
    balloonData.forEach(createBalloon);
});