/**
 * Módulo API Client para obtener datos reales del backend REST
 * Proporciona las mismas operaciones que apimock pero usando peticiones HTTP reales
 */
var apiclient = (function () {
    'use strict';

    var _baseUrl = '/blueprints';

    /**
     * Obtiene todos los blueprints del servidor
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getAllBlueprints(callback) {
        $.ajax({
            url: _baseUrl,
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Error al obtener todos los blueprints: ' + error);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Obtiene blueprints por autor del servidor
     * @param {string} author - Nombre del autor
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getBlueprintsByAuthor(author, callback) {
        $.ajax({
            url: _baseUrl + '/' + encodeURIComponent(author),
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Autor no encontrado: ' + author);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Obtiene un blueprint específico por nombre y autor del servidor
     * @param {string} author - Nombre del autor
     * @param {string} blueprintName - Nombre del blueprint
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getBlueprintsByNameAndAuthor(author, blueprintName, callback) {
        $.ajax({
            url: _baseUrl + '/' + encodeURIComponent(author) + '/' + encodeURIComponent(blueprintName),
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Blueprint no encontrado: ' + blueprintName + ' del autor ' + author);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Obtiene todos los autores disponibles del servidor
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getAuthors(callback) {
        $.ajax({
            url: _baseUrl + '/authors',
            method: 'GET',
            dataType: 'json',
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Error al obtener los autores: ' + error);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Obtiene el total de blueprints de un autor
     * @param {string} author - Nombre del autor
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getBlueprintCount(author, callback) {
        _getBlueprintsByAuthor(author, function(error, blueprints) {
            if (error) {
                callback(error, null);
            } else {
                callback(null, blueprints ? blueprints.length : 0);
            }
        });
    }

    /**
     * Obtiene el total de puntos de un autor
     * @param {string} author - Nombre del autor
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _getTotalPoints(author, callback) {
        _getBlueprintsByAuthor(author, function(error, blueprints) {
            if (error) {
                callback(error, null);
            } else {
                var total = 0;
                if (blueprints && Array.isArray(blueprints)) {
                    blueprints.forEach(function(blueprint) {
                        total += blueprint.points ? blueprint.points.length : 0;
                    });
                }
                callback(null, total);
            }
        });
    }

    /**
     * Actualiza un blueprint específico en el servidor
     * @param {string} author - Nombre del autor
     * @param {string} blueprintName - Nombre del blueprint
     * @param {Object} blueprint - Objeto blueprint con los puntos actualizados
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _updateBlueprint(author, blueprintName, blueprint, callback) {
        $.ajax({
            url: _baseUrl + '/' + encodeURIComponent(author) + '/' + encodeURIComponent(blueprintName),
            method: 'PUT',
            contentType: 'application/json',
            data: JSON.stringify(blueprint),
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Error al actualizar el blueprint: ' + error);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Crea un nuevo blueprint en el servidor
     * @param {Object} blueprint - Objeto blueprint con los puntos
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _createBlueprint(blueprint, callback) {
        $.ajax({
            url: _baseUrl,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(blueprint),
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Error al crear el blueprint: ' + error);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    /**
     * Elimina un blueprint específico del servidor
     * @param {string} author - Nombre del autor
     * @param {string} blueprintName - Nombre del blueprint
     * @param {function} callback - Función callback para manejar la respuesta
     */
    function _deleteBlueprint(author, blueprintName, callback) {
        $.ajax({
            url: _baseUrl + '/' + encodeURIComponent(author) + '/' + encodeURIComponent(blueprintName),
            method: 'DELETE',
            success: function(data) {
                callback(null, data);
            },
            error: function(xhr, status, error) {
                var errorObj = new Error('Error al eliminar el blueprint: ' + error);
                errorObj.status = xhr.status;
                callback(errorObj, null);
            }
        });
    }

    return {
        getBlueprintsByAuthor: _getBlueprintsByAuthor,
        getBlueprintsByNameAndAuthor: _getBlueprintsByNameAndAuthor,
        getAuthors: _getAuthors,
        getBlueprintCount: _getBlueprintCount,
        getTotalPoints: _getTotalPoints,
        getAllBlueprints: _getAllBlueprints,
        updateBlueprint: _updateBlueprint,
        createBlueprint: _createBlueprint,
        deleteBlueprint: _deleteBlueprint
    };
})();
