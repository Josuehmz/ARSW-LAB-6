
### Escuela Colombiana de Ingeniería
### Arquitecturas de Software
### Autor: Josué Hernández

## Descripción del Proyecto

Aplicación web completa para la gestión de blueprints (planos) con funcionalidades CRUD completas, interfaz interactiva con canvas HTML5, y arquitectura modular basada en el patrón Module de JavaScript.

## 🚀 Funcionalidades Principales

### ✅ Gestión Completa de Blueprints
- **Consultar blueprints** por autor
- **Crear nuevos blueprints** con puntos personalizados
- **Actualizar blueprints** existentes agregando puntos
- **Eliminar blueprints** con confirmación
- **Visualizar planos** en canvas HTML5 interactivo

### ✅ Canvas Interactivo
- **Eventos PointerEvent** para soporte de mouse y pantalla táctil
- **Agregar puntos** haciendo click/touch en el canvas
- **Dibujo automático** con líneas conectadas
- **Repintado dinámico** al agregar nuevos puntos
- **Estilo minimalista** con paleta blanco y negro

### ✅ Persistencia y Sincronización
- **Operaciones CRUD** completas vía REST API
- **Actualización automática** de listas y contadores
- **Recálculo de puntos** totales en tiempo real
- **Validaciones** y manejo de errores robusto

## 📋 Estructura del Proyecto

```
ARSW-LAB-6/
├── src/main/
│   ├── java/edu/eci/arsw/
│   │   ├── blueprintsapi/              # Aplicación Spring Boot
│   │   ├── blueprints/controllers/     # Controladores REST API
│   │   ├── config/                     # Configuración Spring
│   │   ├── model/                      # Modelos de datos (Blueprint, Point)
│   │   ├── persistence/                # Capa de persistencia thread-safe
│   │   ├── services/                   # Lógica de negocio
│   │   └── filters/                    # Filtros de blueprints
│   │
│   └── resources/
│       ├── application.properties      # Configuración (Puerto 8081)
│       └── static/                     # Frontend
│           ├── index.html              # Interfaz principal
│           └── js/
│               ├── app.js              # Módulo principal (patrón Module)
│               ├── apiclient.js        # Cliente REST API
│               └── apimock.js          # Datos mock para testing
│
└── test/java/                          # Tests unitarios
```

## 🎨 Interfaz de Usuario

### Diseño Minimalista
La aplicación presenta un diseño moderno con:
- **Paleta monocromática**: Blanco, negro y tonos de gris
- **Layout 50/50**: Columnas equilibradas para blueprints y canvas
- **Tipografías**: Fredoka One y Comic Neue
- **Efectos sutiles**: Sombras y transiciones suaves
- **Responsive**: Adaptable a diferentes tamaños de pantalla

### Componentes de la Interfaz

#### 1. Sección de Autor (Header)
- Campo de texto para ingresar nombre de autor
- Botón "Get blueprints" para consultar
- Soporte para tecla Enter

#### 2. Lista de Blueprints (Izquierda)
- Tabla con nombre y cantidad de puntos
- Botón "Open" para visualizar cada plano
- Contador de puntos totales del usuario

#### 3. Canvas Interactivo (Derecha)
- Visualización del plano actual
- Click/Touch para agregar puntos
- Tres botones de acción:
  - **Create new blueprint**: Crea un nuevo plano desde cero
  - **Save/Update Blueprint**: Guarda cambios (POST o PUT según contexto)
  - **DELETE**: Elimina el plano actual

## 🔧 Implementación Técnica

### Eventos PointerEvent en Canvas

Se implementó soporte completo para eventos PointerEvent con fallback para navegadores antiguos:

```javascript
// Detección automática de soporte
if (window.PointerEvent) {
    canvas.addEventListener('pointerdown', handlePointerEvent);
} else {
    // Fallback para navegadores sin soporte
    canvas.addEventListener('mousedown', handleMouseEvent);
    canvas.addEventListener('touchstart', handleTouchEvent);
}
```

**Características:**
- ✅ Soporte unificado para mouse, touch y pen
- ✅ Cálculo correcto de coordenadas relativas al canvas
- ✅ Validación de límites del canvas
- ✅ Logging detallado para debugging
- ✅ Modularización correcta de event handlers

### Agregar Puntos al Canvas

Cuando se capturan nuevos puntos en el canvas:

1. **Validación**: Solo funciona si hay un blueprint abierto
2. **Almacenamiento**: El punto se agrega al final de la secuencia en memoria
3. **Repintado**: El canvas se redibuja automáticamente con todos los puntos
4. **Logging**: Información del nuevo punto en consola

```javascript
function _processCanvasClick(x, y, inputType) {
    if (_currentBlueprint && _currentBlueprint.points) {
        var newPoint = { x: Math.round(x), y: Math.round(y) };
        _currentBlueprint.points.push(newPoint);
        _drawBlueprintPoints(_currentBlueprint.points);
    }
}
```

### Botón Save/Update

Implementación usando promesas (callbacks) y operaciones secuenciales:

**Para blueprints existentes (PUT):**
1. PUT al endpoint `/blueprints/{author}/{name}` con el plano actualizado
2. GET al endpoint `/blueprints/{author}` para obtener todos los planos
3. Recálculo de puntos totales del usuario
4. Actualización de la tabla UI

**Para blueprints nuevos (POST):**
1. POST al endpoint `/blueprints` con el nuevo plano
2. GET al endpoint `/blueprints/{author}` para actualizar lista
3. Recálculo de puntos totales
4. Actualización de la tabla UI

```javascript
// Configuración de petición PUT con jQuery
$.ajax({
    url: _baseUrl + '/' + author + '/' + blueprintName,
    method: 'PUT',
    contentType: 'application/json',
    data: JSON.stringify(blueprint),
    success: function(data) { callback(null, data); },
    error: function(xhr, status, error) { callback(error, null); }
});
```

### Botón Create New Blueprint

**Flujo de creación:**
1. Valida que haya un autor seleccionado
2. Limpia el canvas actual
3. Solicita nombre del nuevo blueprint (prompt)
4. Crea estructura en memoria con array de puntos vacío
5. Muestra botón "Save/Update" (oculta "DELETE")
6. Usuario agrega puntos haciendo click en canvas
7. Al guardar, hace POST al API

**Características:**
- Flag `_isNewBlueprint` para distinguir entre crear y actualizar
- Validación de nombre no vacío
- Canvas limpio para empezar desde cero

### Botón DELETE

**Flujo de eliminación con promesas:**
1. Valida que haya un blueprint seleccionado
2. Solicita confirmación del usuario
3. Limpia el canvas
4. DELETE al endpoint `/blueprints/{author}/{name}`
5. GET al endpoint `/blueprints/{author}` para actualizar lista
6. Recálculo de puntos totales
7. Limpieza de estado interno

```javascript
// Configuración de petición DELETE con jQuery
$.ajax({
    url: _baseUrl + '/' + author + '/' + blueprintName,
    method: 'DELETE',
    success: function(data) { callback(null, data); },
    error: function(xhr, status, error) { callback(error, null); }
});
```

**Características:**
- Confirmación obligatoria antes de eliminar
- Actualización automática de UI
- Manejo robusto de errores

## 📡 API REST

### Endpoints Disponibles

#### GET Endpoints
- **GET `/blueprints`** - Obtener todos los blueprints
- **GET `/blueprints/{author}`** - Obtener blueprints por autor
- **GET `/blueprints/{author}/{name}`** - Obtener blueprint específico

#### POST Endpoints
- **POST `/blueprints`** - Crear nuevo blueprint
  - Body: `{ "author": "string", "name": "string", "points": [{x, y}] }`

#### PUT Endpoints
- **PUT `/blueprints/{author}/{name}`** - Actualizar blueprint
  - Body: `{ "author": "string", "name": "string", "points": [{x, y}] }`

#### DELETE Endpoints
- **DELETE `/blueprints/{author}/{name}`** - Eliminar blueprint

## 🏗️ Arquitectura del Frontend

### Patrón Module de JavaScript

El código JavaScript está organizado usando el patrón Module para encapsulación:

```javascript
var app = (function () {
    'use strict';
    
    // Variables privadas
    var _currentAuthor = null;
    var _currentBlueprint = null;
    var _blueprintsList = [];
    
    // Funciones privadas
    function _processCanvasClick(x, y, inputType) { ... }
    function _drawBlueprintPoints(points) { ... }
    
    // API Pública
    return {
        init: function() { ... },
        updateBlueprintsByAuthor: function(author) { ... },
        drawBlueprint: function(author, name) { ... },
        saveBlueprint: function() { ... },
        createNewBlueprint: function() { ... },
        deleteBlueprint: function() { ... }
    };
})();
```

### Módulo API Client (apiclient.js)

Proporciona acceso al backend REST:

**Operaciones CRUD:**
- `getBlueprintsByAuthor(author, callback)`
- `getBlueprintsByNameAndAuthor(author, name, callback)`
- `createBlueprint(blueprint, callback)` - **POST**
- `updateBlueprint(author, name, blueprint, callback)` - **PUT**
- `deleteBlueprint(author, name, callback)` - **DELETE**

**Características:**
- Callbacks para manejo asíncrono
- Manejo de errores HTTP
- Conversión JSON automática
- URLs configurables

### Cambio Dinámico: apiclient vs apimock

La aplicación permite cambiar entre datos reales y mock:

```javascript
// En app.js, línea 10:
var _useApiClient = true;  // true = datos reales, false = datos mock

// O dinámicamente:
app.switchApi(true);   // Cambiar a datos reales
app.switchApi(false);  // Cambiar a datos mock
```

## 🎯 Flujos de Uso

### Flujo 1: Consultar y Visualizar Blueprints
1. Ingresar nombre de autor (ej: "john")
2. Click en "Get blueprints" (o Enter)
3. Ver lista de blueprints en tabla
4. Click en "Open" de cualquier blueprint
5. Visualizar plano en canvas

### Flujo 2: Crear Nuevo Blueprint
1. Ingresar nombre de autor
2. Consultar blueprints existentes
3. Click en "Create new blueprint"
4. Ingresar nombre del nuevo plano
5. Agregar puntos haciendo click en canvas
6. Click en "Save/Update Blueprint"
7. Blueprint creado y lista actualizada

### Flujo 3: Editar Blueprint Existente
1. Abrir blueprint con botón "Open"
2. Agregar nuevos puntos haciendo click en canvas
3. Observar repintado automático
4. Click en "Save/Update Blueprint"
5. Cambios guardados y puntos totales actualizados

### Flujo 4: Eliminar Blueprint
1. Abrir blueprint con botón "Open"
2. Click en "DELETE"
3. Confirmar eliminación
4. Blueprint eliminado y lista actualizada

## 🔍 Características Avanzadas

### Eventos PointerEvent
- **Unificación**: Un solo handler para mouse, touch y pen
- **Tipos soportados**: mouse, touch, pen
- **Fallback**: Eventos tradicionales para navegadores antiguos
- **Logging**: Tipo de entrada detectado automáticamente

### Gestión de Estado
- **Blueprint actual**: Se mantiene en memoria para edición
- **Flag de nuevo**: Distingue entre crear y actualizar
- **Validaciones**: Verificaciones antes de cada operación
- **Limpieza**: Estado se resetea apropiadamente

### Actualización de UI
- **Tablas dinámicas**: jQuery para manipulación DOM
- **Operaciones funcionales**: map, reduce para transformaciones
- **Recálculo automático**: Puntos totales siempre actualizados
- **Feedback visual**: Mensajes informativos de cada acción

### Manejo de Errores
- **Validaciones previas**: Antes de peticiones API
- **Confirmaciones**: Para operaciones destructivas
- **Mensajes claros**: Alertas informativas al usuario
- **Logging detallado**: Consola para debugging

## 🚦 Cómo Ejecutar

### Prerrequisitos
- Java 17 o superior
- Maven 3.6 o superior

### Ejecución

1. **Clonar el repositorio:**
   ```bash
   git clone <repository-url>
   cd ARSW-LAB-5
   ```

2. **Ejecutar la aplicación:**
   ```bash
   mvn spring-boot:run
   ```

3. **Acceder a la aplicación:**
   - Abrir navegador en: `http://localhost:8081`
   - La aplicación se ejecuta en el puerto **8081**

### Verificación

1. **Probar consulta de blueprints:**
   - Ingresar "john" como autor
   - Click en "Get blueprints"
   - Verificar que aparezcan resultados

2. **Probar canvas interactivo:**
   - Abrir un blueprint con "Open"
   - Hacer clicks en el canvas
   - Verificar que se agregan puntos y se repinta

3. **Probar creación:**
   - Click en "Create new blueprint"
   - Ingresar nombre
   - Agregar puntos
   - Guardar y verificar en lista

4. **Probar eliminación:**
   - Abrir un blueprint
   - Click en "DELETE"
   - Confirmar y verificar que desaparece


## 🛠️ Tecnologías Utilizadas

### Backend
- **Spring Boot 2.7.18** - Framework principal
- **Spring MVC** - REST API
- **Maven** - Gestión de dependencias

### Frontend
- **HTML5** - Estructura y Canvas
- **CSS3** - Estilos y animaciones
- **Bootstrap 3.3.7** - Framework CSS
- **jQuery 3.1.0** - Manipulación DOM y AJAX
- **JavaScript ES5** - Lógica de negocio

### Patrones y Arquitectura
- **Module Pattern** - Encapsulación JavaScript
- **REST API** - Arquitectura cliente-servidor
- **MVC** - Separación de responsabilidades
- **Dependency Injection** - Spring IoC

## 📝 Notas Importantes

### PointerEvent vs Eventos Tradicionales
El código detecta automáticamente el soporte del navegador:
- **Con PointerEvent**: Mejor experiencia, un solo handler
- **Sin PointerEvent**: Fallback a mousedown y touchstart

### Memoria vs Persistencia
- **Canvas**: Los puntos se agregan primero en memoria
- **Save/Update**: Los cambios se persisten en el servidor
- **Sincronización**: GET después de cada modificación

### Promesas y Callbacks
El código usa callbacks en lugar de Promises nativas:
- **Compatibilidad**: Funciona en navegadores antiguos
- **jQuery**: Usa su propio sistema de promesas
- **Patrón**: callback(error, data) consistente
