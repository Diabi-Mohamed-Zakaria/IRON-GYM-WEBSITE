# Animated Shader Background - Guida Integrazione

## 📋 Overview

Un componente **vanilla JavaScript** che crea un bellissimo animated background dinamico usando Three.js e shader GLSL. Completamente compatibile con il tuo stack EJS + Bootstrap.

## 🚀 Caratteristiche

- ✅ Vanilla JavaScript (niente React)
- ✅ Three.js per il rendering 3D
- ✅ Shader GLSL personalizzati
- ✅ Responsive e mobile-friendly
- ✅ Gestione automatica del resize
- ✅ Performance ottimizzate

## 📦 Dipendenze Installate

```bash
npm install three
```

## 📁 File Aggiunti

```
/public/javascripts/
  └── animated-shader-background.js    # Componente principale

/public/stylesheets/
  └── styles.css                        # CSS aggiornato con animazioni

/views/
  └── shader-demo.ejs                   # Demo page

/routes/
  └── pages.js                          # Route aggiunta: /shader-demo
```

## 🎯 Come Utilizzare

### 1. In una nuova pagina EJS

```html
<!DOCTYPE html>
<html>
<head>
    <link rel="stylesheet" href="/stylesheets/styles.css">
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
</head>
<body>
    <!-- Shader Background Container -->
    <div id="shader-container"></div>

    <!-- Contenuto sopra lo shader -->
    <div class="content" style="position: relative; z-index: 10;">
        <h1>Il tuo contenuto qui</h1>
    </div>

    <!-- Script -->
    <script src="/javascripts/animated-shader-background.js"></script>
    <script>
        document.addEventListener('DOMContentLoaded', () => {
            const shaderBackground = new AnimatedShaderBackground('#shader-container');
        });
    </script>
</body>
</html>
```

### 2. In una pagina EJS esistente

Aggiungi semplicemente all'inizio della pagina:

```html
<!-- Shader Background -->
<div id="shader-container"></div>

<!-- Il resto del contenuto con position: relative; z-index: 10 -->
<div class="content" style="position: relative; z-index: 10;">
    <!-- Contenuto -->
</div>

<script src="/javascripts/animated-shader-background.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const shaderBackground = new AnimatedShaderBackground('#shader-container');
    });
</script>
```

### 3. Con Layout EJS (Header/Footer)

Se usi un layout, aggiungi in `views/partials/header.ejs`:

```html
<div id="shader-container"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="/javascripts/animated-shader-background.js"></script>
```

E in fondo a `views/partials/footer.ejs`:

```html
<script>
    document.addEventListener('DOMContentLoaded', () => {
        const shaderBackground = new AnimatedShaderBackground('#shader-container');
    });
</script>
```

## 🎨 CSS Personalizzazioni

### Colorare il Background

Modifica il colore di sfondo in `styles.css`:

```css
#shader-container {
  background: #0e0f12; /* Cambia questo colore */
}
```

Oppure in `animated-shader-background.js`, riga ~45:

```javascript
this.renderer.setClearColor(0x0e0f12, 1); // Cambia il colore hex
```

### Animazioni su elementi

Usa la classe `float-animation` su elementi che vuoi animare:

```html
<h1 class="float-animation">Titolo Animato</h1>
```

### Divider

Aggiungi un divider stilizzato tra sezioni:

```html
<div class="divider"></div>
```

## ⚙️ Classe AnimatedShaderBackground API

```javascript
// Inizializzazione
const shader = new AnimatedShaderBackground('#container-id');

// Proprietà accessibili
shader.scene        // THREE.Scene
shader.camera       // THREE.Camera
shader.renderer     // THREE.WebGLRenderer
shader.material     // THREE.ShaderMaterial

// Metodo di cleanup (importante!)
shader.dispose();   // Libera le risorse
```

## 🔧 Performance Tips

1. **Una sola istanza per pagina**: Non inizializzare il componente multiple volte
2. **Cleanup**: Chiama `shader.dispose()` prima di navigare via
3. **Canvas resize**: Automatico al ridimensionamento della finestra
4. **Mobile**: Ridurrà le prestazioni su dispositivi con GPU deboli

## 🧪 Testare la Demo

```bash
npm start
```

Visita: `http://localhost:3000/shader-demo`

## 📝 Esempio Completo: Integrare nella Homepage

Modifica `views/index.ejs`:

```html
<%- include('partials/header') %>

<!-- Shader Background -->
<div id="shader-container"></div>

<!-- Hero Section con z-index 10 -->
<section class="hero-section" style="position: relative; z-index: 10;">
    <div class="container">
        <h1 class="gold-gradient">IRON GYM</h1>
        <p>Premium Fitness Experience</p>
    </div>
</section>

<!-- Resto del contenuto -->
<section style="position: relative; z-index: 10;">
    <!-- Content here -->
</section>

<%- include('partials/footer') %>

<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
<script src="/javascripts/animated-shader-background.js"></script>
<script>
    document.addEventListener('DOMContentLoaded', () => {
        new AnimatedShaderBackground('#shader-container');
    });
</script>
```

## ⚠️ Troubleshooting

**Problema**: Black screen senza shader
- Verificate che Three.js sia caricato: `console.log(THREE)` in dev tools
- Controllate che il container `#shader-container` esista nel DOM

**Problema**: Performance bassa
- Riducete il numero di loop nello shader (riga ~130)
- Usate `requestAnimationFrame` che è già implementato

**Problema**: Z-index non funziona
- Assicuratevi che il contenuto abbia `position: relative; z-index: 10` o superiore

## 🎓 Lezioni Imparate

- **Three.js**: Per il rendering 3D efficientemente
- **Shader GLSL**: Per effetti visivi complessi a GPU level
- **Vanilla JS**: Niente dipendenze React, funziona ovunque
- **EJS**: Integration perfetta con template server-side

---

**Creato**: 19 Febbraio 2026
**Compatibile con**: Node.js + Express + EJS + Bootstrap 5
