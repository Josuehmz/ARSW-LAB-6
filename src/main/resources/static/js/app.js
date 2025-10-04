/**
 * Módulo JavaScript para la aplicación Blueprints
 * Implementa el patrón Módulo de JavaScript para manejar la lógica del frontend
 */
var app = (function () {
    'use strict';

    // ===== CONFIGURACIÓN DE API =====
    // Cambiar entre 'apimock' y 'apiclient' con solo modificar esta línea
    var _useApiClient = true; // true = apiclient, false = apimock
    
    // Referencia dinámica al módulo API seleccionado
    var _api = _useApiClient ? apiclient : apimock;
    // ================================

    var _currentAuthor = null;
    var _blueprintsList = [];
    var _totalPoints = 0;
    var _currentBlueprint = null; // Almacena el blueprint actual en memoria

    var _authorInput = null;
    var _getBlueprintsBtn = null;
    var _selectedAuthor = null;
    var _blueprintsTable = null;
    var _blueprintsTbody = null;
    var _totalPointsElement = null;
    var _blueprintCanvas = null;
    var _currentBlueprintName = null;
    var _authorBlueprintsTitle = null;
    var _saveBlueprintBtn = null;
    var _createBlueprintBtn = null;
    var _deleteBlueprintBtn = null;
    var _isNewBlueprint = false; // Flag para indicar si es un blueprint nuevo

    /**
     * Inicializa las referencias a los elementos del DOM
     */
    function _initializeElements() {
        _authorInput = document.getElementById('author-input');
        _getBlueprintsBtn = document.getElementById('get-blueprints-btn');
        _selectedAuthor = document.getElementById('selected-author');
        _blueprintsTable = document.getElementById('blueprints-table');
        _blueprintsTbody = document.getElementById('blueprints-tbody');
        _totalPointsElement = document.getElementById('total-points');
        _blueprintCanvas = document.getElementById('blueprint-canvas');
        _currentBlueprintName = document.getElementById('current-blueprint-name');
        _authorBlueprintsTitle = document.getElementById('author-blueprints-title');
        _saveBlueprintBtn = document.getElementById('save-blueprint-btn');
        _createBlueprintBtn = document.getElementById('create-blueprint-btn');
        _deleteBlueprintBtn = document.getElementById('delete-blueprint-btn');
    }

    /**
     * Configura los event listeners
     */
    function _setupEventListeners() {
        if (_getBlueprintsBtn) {
            _getBlueprintsBtn.addEventListener('click', function() {
                var author = _authorInput ? _authorInput.value.trim() : '';
                if (author) {
                    updateBlueprintsByAuthor(author);
                } else {
                    _showAlert('Por favor ingrese un nombre de autor');
                }
            });
        }

        if (_authorInput) {
            _authorInput.addEventListener('keypress', function(event) {
                if (event.key === 'Enter') {
                    var author = _authorInput.value.trim();
                    if (author) {
                        updateBlueprintsByAuthor(author);
                    } else {
                        _showAlert('Por favor ingrese un nombre de autor');
                    }
                }
            });
        }

        // Configurar manejador de eventos para el canvas
        _setupCanvasEventListeners();

        // Configurar event listener para el botón Save/Update
        if (_saveBlueprintBtn) {
            _saveBlueprintBtn.addEventListener('click', function() {
                saveBlueprint();
            });
        }

        // Configurar event listener para el botón Create new blueprint
        if (_createBlueprintBtn) {
            _createBlueprintBtn.addEventListener('click', function() {
                createNewBlueprint();
            });
        }

        // Configurar event listener para el botón DELETE
        if (_deleteBlueprintBtn) {
            _deleteBlueprintBtn.addEventListener('click', function() {
                deleteBlueprint();
            });
        }
    }

    /**
     * Configura los event listeners para el canvas usando PointerEvent
     * Maneja tanto clicks de mouse como eventos táctiles
     */
    function _setupCanvasEventListeners() {
        if (!_blueprintCanvas) {
            console.warn('Canvas no encontrado, no se pueden configurar los event listeners');
            return;
        }

        // Verificar soporte para PointerEvent
        if (window.PointerEvent) {
            console.log('Usando PointerEvent para manejo de eventos del canvas');
            
            // Evento de click/touch usando PointerEvent
            _blueprintCanvas.addEventListener('pointerdown', _handleCanvasPointerEvent);
            
            // Prevenir el menú contextual en dispositivos táctiles
            _blueprintCanvas.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        } else {
            console.log('PointerEvent no soportado, usando eventos tradicionales');
            
            // Fallback para navegadores que no soportan PointerEvent
            _blueprintCanvas.addEventListener('mousedown', _handleCanvasClick);
            _blueprintCanvas.addEventListener('touchstart', _handleCanvasTouch);
            
            // Prevenir el menú contextual
            _blueprintCanvas.addEventListener('contextmenu', function(event) {
                event.preventDefault();
            });
        }
    }

    /**
     * Maneja eventos PointerEvent (click y touch unificados)
     * @param {PointerEvent} event - Evento PointerEvent
     */
    function _handleCanvasPointerEvent(event) {
        event.preventDefault();
        
        // Obtener coordenadas relativas al canvas
        var rect = _blueprintCanvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        
        // Verificar que las coordenadas estén dentro del canvas
        if (x >= 0 && x <= _blueprintCanvas.width && y >= 0 && y <= _blueprintCanvas.height) {
            _processCanvasClick(x, y, event.pointerType);
        }
    }

    /**
     * Maneja eventos de click del mouse (fallback)
     * @param {MouseEvent} event - Evento MouseEvent
     */
    function _handleCanvasClick(event) {
        event.preventDefault();
        
        var rect = _blueprintCanvas.getBoundingClientRect();
        var x = event.clientX - rect.left;
        var y = event.clientY - rect.top;
        
        if (x >= 0 && x <= _blueprintCanvas.width && y >= 0 && y <= _blueprintCanvas.height) {
            _processCanvasClick(x, y, 'mouse');
        }
    }

    /**
     * Maneja eventos táctiles (fallback)
     * @param {TouchEvent} event - Evento TouchEvent
     */
    function _handleCanvasTouch(event) {
        event.preventDefault();
        
        if (event.touches.length > 0) {
            var touch = event.touches[0];
            var rect = _blueprintCanvas.getBoundingClientRect();
            var x = touch.clientX - rect.left;
            var y = touch.clientY - rect.top;
            
            if (x >= 0 && x <= _blueprintCanvas.width && y >= 0 && y <= _blueprintCanvas.height) {
                _processCanvasClick(x, y, 'touch');
            }
        }
    }

    /**
     * Procesa el click/touch en el canvas
     * @param {number} x - Coordenada X
     * @param {number} y - Coordenada Y
     * @param {string} inputType - Tipo de entrada ('mouse', 'touch', 'pen')
     */
    function _processCanvasClick(x, y, inputType) {
        console.log('Click detectado en canvas:', {
            x: Math.round(x),
            y: Math.round(y),
            inputType: inputType,
            timestamp: new Date().toISOString()
        });
        
        // Solo agregar puntos si hay un blueprint abierto
        if (_currentBlueprint && _currentBlueprint.points) {
            // Agregar el nuevo punto al final de la secuencia
            var newPoint = { x: Math.round(x), y: Math.round(y) };
            _currentBlueprint.points.push(newPoint);
            
            console.log('Punto agregado al blueprint:', newPoint);
            console.log('Total de puntos en el blueprint:', _currentBlueprint.points.length);
            
            // Repintar el dibujo con el nuevo punto
            _drawBlueprintPoints(_currentBlueprint.points);
        } else {
            console.log('No hay blueprint abierto, no se puede agregar punto');
        }
    }


    /**
     * Configura los event listeners para los botones de abrir blueprint
     */
    function _setupBlueprintButtons() {
        $('.open-blueprint-btn').off('click').on('click', function() {
            var author = $(this).data('author');
            var blueprint = $(this).data('blueprint');
            
            if (author && blueprint) {
                drawBlueprint(author, blueprint);
            } else {
                _showAlert('Error: No se pudo obtener la información del plano');
            }
        });
    }


    /**
     * Actualiza el campo de autor seleccionado
     */
    function _updateSelectedAuthor(author) {
        if (_selectedAuthor) {
            _selectedAuthor.textContent = author;
        }
        if (_authorBlueprintsTitle) {
            _authorBlueprintsTitle.textContent = author + "'s blueprints:";
        }
    }


    /**
     * Procesa los datos de blueprints y los convierte a la estructura requerida
     * @param {Array} data - Array de blueprints del backend
     */
    function _processBlueprintsData(data) {
        _blueprintsList = [];
        data.forEach(function(blueprint) {
            var blueprintInfo = {
                name: blueprint.name || '-',
                points: blueprint.points ? blueprint.points.length : 0
            };
            _blueprintsList.push(blueprintInfo);
        });
    }

    /**
     * Actualiza la tabla de blueprints
     */
    function _updateBlueprintsTable() {
        if (!_blueprintsTbody) return;

        _blueprintsTbody.innerHTML = '';

        if (_blueprintsList.length === 0) {
            var row = document.createElement('tr');
            row.innerHTML = '<td colspan="3" class="text-center">No se encontraron blueprints para este autor</td>';
            _blueprintsTbody.appendChild(row);
            return;
        }

        _blueprintsList.forEach(function(blueprintInfo) {
            var row = document.createElement('tr');
            
            row.innerHTML = 
                '<td>' + blueprintInfo.name + '</td>' +
                '<td>' + (_currentAuthor || '-') + '</td>' +
                '<td>' + blueprintInfo.points + '</td>';
            
            _blueprintsTbody.appendChild(row);
        });
    }

    /**
     * Calcula el total de puntos de todos los blueprints
     */
    function _calculateTotalPoints() {
        _totalPoints = 0;
        
        _blueprintsList.forEach(function(blueprintInfo) {
            _totalPoints += blueprintInfo.points;
        });

        _updateTotalPointsDisplay();
    }

    /**
     * Actualiza la visualización del total de puntos
     */
    function _updateTotalPointsDisplay() {
        if (_totalPointsElement) {
            _totalPointsElement.textContent = _totalPoints;
        }
    }

    /**
     * Limpia la tabla y resetea los valores
     */
    function _clearTable() {
        if (_blueprintsTbody) {
            _blueprintsTbody.innerHTML = '';
        }
        if (_totalPointsElement) {
            _totalPointsElement.textContent = '0';
        }
        _blueprintsList = [];
        _totalPoints = 0;
    }

    /**
     * Limpia la tabla usando jQuery
     */
    function _clearTableWithjQuery() {
        $('#blueprints-tbody').empty();
        $('#total-points').text('0');
        _blueprintsList = [];
        _totalPoints = 0;
    }

    /**
     * Muestra una alerta al usuario
     */
    function _showAlert(message) {
        alert(message);
    }

    /**
     * Limpia el canvas
     */
    function _clearCanvas() {
        if (_blueprintCanvas) {
            var ctx = _blueprintCanvas.getContext('2d');
            ctx.clearRect(0, 0, _blueprintCanvas.width, _blueprintCanvas.height);
            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(0, 0, _blueprintCanvas.width, _blueprintCanvas.height);
        }
    }

    /**
     * Dibuja los puntos del blueprint en el canvas con estilo cartoon sutil
     * @param {Array} points - Array de puntos con coordenadas x, y
     */
    function _drawBlueprintPoints(points) {
        if (!_blueprintCanvas || !points || points.length === 0) {
            return;
        }

        var ctx = _blueprintCanvas.getContext('2d');
        _clearCanvas();

        // Fondo blanco limpio
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, _blueprintCanvas.width, _blueprintCanvas.height);

        if (points.length === 1) {
            // Punto único
            _drawCartoonPoint(ctx, points[0].x, points[0].y, '#4ecdc4');
            return;
        }

        // Dibujar líneas con colores cartoon suaves
        for (var i = 0; i < points.length - 1; i++) {
            _drawCartoonLine(ctx, points[i], points[i + 1], i);
        }

        // Dibujar puntos con estilo cartoon
        for (var j = 0; j < points.length; j++) {
            var color = _getCartoonColor(j);
            _drawCartoonPoint(ctx, points[j].x, points[j].y, color);
        }
    }

    /**
     * Dibuja una línea con estilo blanco y negro
     */
    function _drawCartoonLine(ctx, point1, point2, index) {
        var colors = ['#000', '#333', '#666', '#000', '#333'];
        var color = colors[index % colors.length];
        
        ctx.beginPath();
        ctx.moveTo(point1.x, point1.y);
        ctx.lineTo(point2.x, point2.y);
        
        // Sombra dramática
        ctx.shadowColor = color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Línea principal
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Línea de contorno
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    /**
     * Dibuja un punto con estilo blanco y negro
     */
    function _drawCartoonPoint(ctx, x, y, color) {
        // Sombra exterior
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 3;
        ctx.shadowOffsetY = 3;
        
        // Círculo exterior
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Resetear sombra
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Círculo interior blanco
        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Punto central
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Contorno
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    /**
     * Obtiene un color blanco y negro basado en el índice
     */
    function _getCartoonColor(index) {
        var colors = ['#000', '#333', '#666', '#000', '#333'];
        return colors[index % colors.length];
    }

    /**
     * Actualiza el nombre del plano actual en el DOM
     * @param {string} blueprintName - Nombre del plano
     */
    function _updateCurrentBlueprintName(blueprintName) {
        if (_currentBlueprintName) {
            _currentBlueprintName.textContent = blueprintName || '-';
        }
    }

    /**
     * Obtiene el autor actual
     */
    function getCurrentAuthor() {
        return _currentAuthor;
    }

    /**
     * Obtiene la lista de blueprints actuales (nombre y puntos)
     */
    function getCurrentBlueprints() {
        return _blueprintsList.slice();
    }

    /**
     * Cambia el autor actualmente seleccionado
     * @param {string} newAuthor - Nuevo nombre del autor
     */
    function setCurrentAuthor(newAuthor) {
        if (newAuthor && typeof newAuthor === 'string') {
            _currentAuthor = newAuthor.trim();
            _updateSelectedAuthor(_currentAuthor);
            console.log('Autor cambiado a:', _currentAuthor);
        } else {
            console.warn('Nombre de autor inválido:', newAuthor);
        }
    }

    /**
     * Actualiza la lista de blueprints basada en el nombre del autor
     * @param {string} authorName - Nombre del autor
     */
    function updateBlueprintsByAuthor(authorName) {
        if (!authorName || typeof authorName !== 'string') {
            console.warn('Nombre de autor inválido:', authorName);
            return;
        }

        _currentAuthor = authorName.trim();
        _updateSelectedAuthor(_currentAuthor);

        _api.getBlueprintsByAuthor(authorName, function(error, blueprintsList) {
            if (error) {
                console.error('Error al obtener blueprints:', error);
                _showAlert('Error al obtener los blueprints del autor: ' + authorName);
                _clearTableWithjQuery();
                return;
            }

            var mappedBlueprints = blueprintsList.map(function(blueprint) {
                return {
                    name: blueprint.name || '-',
                    points: blueprint.points ? blueprint.points.length : 0
                };
            });

            _blueprintsList = mappedBlueprints;

            $('#blueprints-tbody').empty();

            if (mappedBlueprints.length === 0) {
                $('#blueprints-tbody').append('<tr><td colspan="3" class="text-center">No se encontraron blueprints para este autor</td></tr>');
            } else {
                mappedBlueprints.map(function(blueprintInfo) {
                    var rowHtml = '<tr>' +
                        '<td>' + blueprintInfo.name + '</td>' +
                        '<td>' + blueprintInfo.points + '</td>' +
                        '<td><button type="button" class="btn btn-primary btn-sm open-blueprint-btn" ' +
                        'data-author="' + _currentAuthor + '" data-blueprint="' + blueprintInfo.name + '">Open</button></td>' +
                        '</tr>';
                    $('#blueprints-tbody').append(rowHtml);
                });
                
                _setupBlueprintButtons();
            }

            var totalPoints = mappedBlueprints.reduce(function(total, blueprintInfo) {
                return total + blueprintInfo.points;
            }, 0);

            _totalPoints = totalPoints;
            $('#total-points').text(totalPoints);

            console.log('Blueprints actualizados para', authorName + ':', mappedBlueprints.length, 'blueprints,', totalPoints, 'puntos totales');
        });
    }

    /**
     * Obtiene el total de puntos actual
     */
    function getTotalPoints() {
        return _totalPoints;
    }

    /**
     * Cambia entre apimock y apiclient
     * @param {boolean} useApiClient - true para usar apiclient, false para apimock
     */
    function switchApi(useApiClient) {
        _useApiClient = useApiClient;
        _api = _useApiClient ? apiclient : apimock;
        console.log('API cambiada a:', _useApiClient ? 'apiclient' : 'apimock');
    }

    /**
     * Obtiene el módulo API actualmente en uso
     */
    function getCurrentApi() {
        return _useApiClient ? 'apiclient' : 'apimock';
    }

    /**
     * Dibuja un blueprint específico en el canvas
     * @param {string} authorName - Nombre del autor
     * @param {string} blueprintName - Nombre del blueprint
     */
    function drawBlueprint(authorName, blueprintName) {
        if (!authorName || !blueprintName || typeof authorName !== 'string' || typeof blueprintName !== 'string') {
            _showAlert('Parámetros inválidos para dibujar el plano');
            _clearCanvas();
            _updateCurrentBlueprintName('-');
            _currentBlueprint = null; // Limpiar blueprint actual
            _hideSaveButton();
            return;
        }

        _api.getBlueprintsByNameAndAuthor(authorName.trim(), blueprintName.trim(), function(error, blueprint) {
            if (error) {
                _showAlert('Error al obtener el plano: ' + error.message);
                _clearCanvas();
                _updateCurrentBlueprintName('-');
                _currentBlueprint = null; // Limpiar blueprint actual
                _hideSaveButton();
                return;
            }

            if (!blueprint || !blueprint.points || blueprint.points.length === 0) {
                _showAlert('El plano no tiene puntos para dibujar');
                _clearCanvas();
                _updateCurrentBlueprintName('-');
                _currentBlueprint = null; // Limpiar blueprint actual
                _hideSaveButton();
                return;
            }

            // Almacenar el blueprint actual en memoria (crear una copia)
            _currentBlueprint = {
                name: blueprint.name,
                author: authorName.trim(),
                points: blueprint.points.slice() // Crear una copia del array de puntos
            };

            _updateCurrentBlueprintName(blueprint.name);
            _drawBlueprintPoints(_currentBlueprint.points);
            _showSaveButton(); // Mostrar botón Save/Update
            _showDeleteButton(); // Mostrar botón DELETE para blueprints existentes
            _isNewBlueprint = false; // No es un blueprint nuevo
            
            console.log('Plano dibujado:', blueprint.name, 'con', blueprint.points.length, 'puntos');
            console.log('Blueprint almacenado en memoria para edición');
        });
    }

    /**
     * Guarda/actualiza el blueprint actual en el servidor
     */
    function saveBlueprint() {
        if (!_currentBlueprint || !_currentBlueprint.points || _currentBlueprint.points.length === 0) {
            _showAlert('No hay blueprint para guardar');
            return;
        }

        if (!_currentAuthor) {
            _showAlert('No hay autor seleccionado');
            return;
        }

        console.log('Guardando blueprint:', _currentBlueprint.name, 'con', _currentBlueprint.points.length, 'puntos');

        // Función para actualizar la lista después de guardar
        function updateBlueprintsList() {
            _api.getBlueprintsByAuthor(_currentAuthor, function(error, blueprintsList) {
                if (error) {
                    _showAlert('Error al obtener los blueprints actualizados: ' + error.message);
                    return;
                }

                // Procesar los datos actualizados
                var mappedBlueprints = blueprintsList.map(function(blueprint) {
                    return {
                        name: blueprint.name || '-',
                        points: blueprint.points ? blueprint.points.length : 0
                    };
                });

                _blueprintsList = mappedBlueprints;

                // Actualizar la tabla
                $('#blueprints-tbody').empty();

                if (mappedBlueprints.length === 0) {
                    $('#blueprints-tbody').append('<tr><td colspan="3" class="text-center">No se encontraron blueprints para este autor</td></tr>');
                } else {
                    mappedBlueprints.map(function(blueprintInfo) {
                        var rowHtml = '<tr>' +
                            '<td>' + blueprintInfo.name + '</td>' +
                            '<td>' + blueprintInfo.points + '</td>' +
                            '<td><button type="button" class="btn btn-primary btn-sm open-blueprint-btn" ' +
                            'data-author="' + _currentAuthor + '" data-blueprint="' + blueprintInfo.name + '">Open</button></td>' +
                            '</tr>';
                        $('#blueprints-tbody').append(rowHtml);
                    });
                    
                    _setupBlueprintButtons();
                }

                // Recalcular los puntos totales del usuario
                var totalPoints = mappedBlueprints.reduce(function(total, blueprintInfo) {
                    return total + blueprintInfo.points;
                }, 0);

                _totalPoints = totalPoints;
                $('#total-points').text(totalPoints);

                _showAlert('Blueprint guardado exitosamente. Total de puntos actualizado: ' + totalPoints);
                console.log('Blueprints actualizados para', _currentAuthor + ':', mappedBlueprints.length, 'blueprints,', totalPoints, 'puntos totales');
            });
        }

        if (_isNewBlueprint) {
            // i. Hacer POST al API para crear el nuevo blueprint
            _api.createBlueprint(_currentBlueprint, function(error, result) {
                if (error) {
                    _showAlert('Error al crear el blueprint: ' + error.message);
                    return;
                }

                console.log('Blueprint creado exitosamente');
                _isNewBlueprint = false; // Ya no es nuevo

                // ii. Hacer GET al recurso /blueprints para obtener todos los planos
                updateBlueprintsList();
            });
        } else {
            // i. Hacer PUT al API con el plano actualizado
            _api.updateBlueprint(_currentAuthor, _currentBlueprint.name, _currentBlueprint, function(error, result) {
                if (error) {
                    _showAlert('Error al guardar el blueprint: ' + error.message);
                    return;
                }

                console.log('Blueprint guardado exitosamente');

                // ii. Hacer GET al recurso /blueprints para obtener todos los planos
                updateBlueprintsList();
            });
        }
    }

    /**
     * Muestra el botón Save/Update
     */
    function _showSaveButton() {
        if (_saveBlueprintBtn) {
            _saveBlueprintBtn.style.display = 'inline-block';
        }
    }

    /**
     * Oculta el botón Save/Update
     */
    function _hideSaveButton() {
        if (_saveBlueprintBtn) {
            _saveBlueprintBtn.style.display = 'none';
        }
    }

    /**
     * Muestra el botón DELETE
     */
    function _showDeleteButton() {
        if (_deleteBlueprintBtn) {
            _deleteBlueprintBtn.style.display = 'inline-block';
        }
    }

    /**
     * Oculta el botón DELETE
     */
    function _hideDeleteButton() {
        if (_deleteBlueprintBtn) {
            _deleteBlueprintBtn.style.display = 'none';
        }
    }

    /**
     * Crea un nuevo blueprint
     */
    function createNewBlueprint() {
        if (!_currentAuthor) {
            _showAlert('Primero debe seleccionar un autor');
            return;
        }

        // Limpiar el canvas
        _clearCanvas();

        // Solicitar nombre del nuevo blueprint
        var blueprintName = prompt('Ingrese el nombre del nuevo blueprint:');
        if (!blueprintName || blueprintName.trim() === '') {
            _showAlert('Debe ingresar un nombre para el blueprint');
            return;
        }

        // Crear nuevo blueprint en memoria
        _currentBlueprint = {
            name: blueprintName.trim(),
            author: _currentAuthor,
            points: []
        };

        _isNewBlueprint = true;
        _updateCurrentBlueprintName(blueprintName.trim());
        _showSaveButton();
        _hideDeleteButton(); // Ocultar botón DELETE para nuevo blueprint

        console.log('Nuevo blueprint creado:', blueprintName.trim());
        _showAlert('Nuevo blueprint "' + blueprintName.trim() + '" creado. Puede agregar puntos haciendo click en el canvas.');
    }

    /**
     * Elimina el blueprint actual
     */
    function deleteBlueprint() {
        if (!_currentBlueprint || !_currentAuthor) {
            _showAlert('No hay blueprint para eliminar');
            return;
        }

        if (!confirm('¿Está seguro de que desea eliminar el blueprint "' + _currentBlueprint.name + '"?')) {
            return;
        }

        console.log('Eliminando blueprint:', _currentBlueprint.name);

        // Limpiar el canvas
        _clearCanvas();

        // Hacer DELETE al API
        _api.deleteBlueprint(_currentAuthor, _currentBlueprint.name, function(error, result) {
            if (error) {
                _showAlert('Error al eliminar el blueprint: ' + error.message);
                return;
            }

            console.log('Blueprint eliminado exitosamente');

            // Hacer GET al recurso /blueprints para obtener todos los planos
            _api.getBlueprintsByAuthor(_currentAuthor, function(error, blueprintsList) {
                if (error) {
                    _showAlert('Error al obtener los blueprints actualizados: ' + error.message);
                    return;
                }

                // Procesar los datos actualizados
                var mappedBlueprints = blueprintsList.map(function(blueprint) {
                    return {
                        name: blueprint.name || '-',
                        points: blueprint.points ? blueprint.points.length : 0
                    };
                });

                _blueprintsList = mappedBlueprints;

                // Actualizar la tabla
                $('#blueprints-tbody').empty();

                if (mappedBlueprints.length === 0) {
                    $('#blueprints-tbody').append('<tr><td colspan="3" class="text-center">No se encontraron blueprints para este autor</td></tr>');
                } else {
                    mappedBlueprints.map(function(blueprintInfo) {
                        var rowHtml = '<tr>' +
                            '<td>' + blueprintInfo.name + '</td>' +
                            '<td>' + blueprintInfo.points + '</td>' +
                            '<td><button type="button" class="btn btn-primary btn-sm open-blueprint-btn" ' +
                            'data-author="' + _currentAuthor + '" data-blueprint="' + blueprintInfo.name + '">Open</button></td>' +
                            '</tr>';
                        $('#blueprints-tbody').append(rowHtml);
                    });
                    
                    _setupBlueprintButtons();
                }

                // Recalcular los puntos totales del usuario
                var totalPoints = mappedBlueprints.reduce(function(total, blueprintInfo) {
                    return total + blueprintInfo.points;
                }, 0);

                _totalPoints = totalPoints;
                $('#total-points').text(totalPoints);

                // Limpiar estado actual
                _currentBlueprint = null;
                _isNewBlueprint = false;
                _updateCurrentBlueprintName('-');
                _hideSaveButton();
                _hideDeleteButton();

                _showAlert('Blueprint eliminado exitosamente. Total de puntos actualizado: ' + totalPoints);
                console.log('Blueprints actualizados para', _currentAuthor + ':', mappedBlueprints.length, 'blueprints,', totalPoints, 'puntos totales');
            });
        });
    }

    return {
        init: function() {
            console.log('Inicializando módulo Blueprints...');
            console.log('API configurada:', getCurrentApi());
            _initializeElements();
            _setupEventListeners();
            console.log('Módulo Blueprints inicializado correctamente');
        },
        
        getCurrentAuthor: getCurrentAuthor,
        getCurrentBlueprints: getCurrentBlueprints,
        getTotalPoints: getTotalPoints,
        setCurrentAuthor: setCurrentAuthor,
        updateBlueprintsByAuthor: updateBlueprintsByAuthor,
        drawBlueprint: drawBlueprint,
        switchApi: switchApi,
        getCurrentApi: getCurrentApi,
        
        // Funciones relacionadas con el canvas y eventos
        getCanvasElement: function() {
            return _blueprintCanvas;
        },
        
        isPointerEventSupported: function() {
            return !!window.PointerEvent;
        },
        
        clearCanvas: function() {
            _clearCanvas();
        },
        
        getCurrentBlueprint: function() {
            return _currentBlueprint;
        },
        
        saveBlueprint: saveBlueprint,
        createNewBlueprint: createNewBlueprint,
        deleteBlueprint: deleteBlueprint,
        
        clear: function() {
            _clearTable();
            if (_selectedAuthor) {
                _selectedAuthor.textContent = '-';
            }
            _currentAuthor = null;
            _currentBlueprint = null; // Limpiar blueprint actual
            _isNewBlueprint = false; // Resetear flag
            _clearCanvas();
            _updateCurrentBlueprintName('-');
            _hideSaveButton(); // Ocultar botón Save/Update
            _hideDeleteButton(); // Ocultar botón DELETE
        }
    };
})();

document.addEventListener('DOMContentLoaded', function() {
    app.init();
});
