# IRON GYM - Sistema di Gestione Palestra

## 📋 Descrizione del Progetto

Sistema web completo per la gestione di una palestra che include:
- Gestione utenti (Admin, Trainer, Client)
- Prenotazione classi
- Sistema di recensioni
- Gestione membership e pagamenti
- Dashboard amministrativa

## 🚀 Tecnologie Utilizzate

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **Frontend**: EJS, HTML, CSS, JavaScript
- **Autenticazione**: Session-based con hash delle password
- **Styling**: CSS personalizzato con design moderno

## 📁 Struttura del Progetto

```
GYM_WEB/
├── db/
│   ├── gym.db          # Database SQLite
│   ├── gym.sql         # Schema database
│   └── init-db.js      # Script inizializzazione
├── models/             # Data Access Objects (ES6 Classes)
│   ├── booking-dao.js
│   ├── class-dao.js
│   ├── membership-dao.js
│   ├── review-dao.js
│   └── user-dao.js
├── routes/             # Route handlers
│   ├── admin.js
│   ├── auth.js
│   ├── booking.js
│   ├── class.js
│   ├── membership.js
│   ├── review.js
│   └── user.js
├── views/              # Template EJS
│   ├── partials/
│   ├── admin/
│   ├── auth/
│   ├── booking/
│   ├── class/
│   ├── membership/
│   ├── review/
│   └── user/
├── public/             # File statici
│   ├── css/
│   ├── js/
│   └── images/
├── app.js              # File principale
└── package.json        # Dipendenze
```

## 🛠️ Installazione e Setup

### Prerequisiti
- Node.js (versione 14 o superiore)
- npm

### Installazione
1. Clona il repository
2. Installa le dipendenze:
   ```bash
   npm install
   ```

3. Inizializza il database:
   ```bash
   node db/init-db.js
   ```

4. Avvia il server:
   ```bash
   npm start
   ```

5. Apri il browser e vai su: `http://localhost:3000`

## 👥 CREDENZIALI UTENTI DI TEST

### Admin
- **Username**: `admin`
- **Password**: `password123`
- **Ruolo**: Amministratore completo

### Trainer
- **Username**: `john.trainer`
- **Password**: `password123`
- **Ruolo**: Gestione classi e clienti

### Client
- **Username**: `luca.bianchi`
- **Password**: `password1234`
- **Ruolo**: Prenotazioni e recensioni

## 🔐 Altri Utenti di Test Disponibili

### Trainer
- `sara.trainer` / `password123`
- `mike.trainer` / `password123`

### Client
- `luca.bianchi` / `password1234`
- `giulia.verdi` / `password123`
- `marco.russo` / `password123`
- `anna.ferrari` / `password123`

## 📊 Funzionalità Principali

### Per Admin
- Dashboard completa con statistiche
- Gestione utenti (creazione, modifica, eliminazione)
- Gestione classi e trainer
- Visualizzazione prenotazioni e recensioni
- Gestione membership e pagamenti

### Per Trainer
- Dashboard personale
- Gestione delle proprie classi
- Visualizzazione prenotazioni
- Gestione clienti assegnati

### Per Client
- Visualizzazione classi disponibili
- Prenotazione/cancellazione classi
- Sistema di recensioni (palestra e trainer)
- Gestione profilo personale

## 🗄️ Database

Il database SQLite include le seguenti tabelle:
- `users` - Utenti del sistema
- `classes` - Classi della palestra
- `bookings` - Prenotazioni classi
- `reviews` - Sistema recensioni
- `memberships` - Abbonamenti
- `payments` - Pagamenti

## 🔧 Configurazione

### Variabili d'Ambiente
Il progetto utilizza configurazioni di default. Per personalizzare:

- **Porta**: Modifica `PORT` in `app.js` (default: 3000)
- **Database**: Path configurato in `db/init-db.js`

### Sicurezza
- Password hashate con salt
- Session-based authentication
- Protezione route con middleware
- Validazione input lato server

## 📝 Note di Sviluppo

### Architettura
- **MVC Pattern**: Separazione logica, vista e controllo
- **ES6 Classes**: Data Access Objects implementati come classi ES6
- **Promise-based**: Gestione asincrona consistente
- **Modular Design**: Codice organizzato in moduli


## 🐛 Risoluzione Problemi

### Database Issues
Se il database non si inizializza correttamente:
```bash
rm db/gym.db
node db/init-db.js
```

### Dipendenze
Se ci sono problemi con le dipendenze:
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📞 Supporto

Per problemi o domande sul progetto:
Mail: mohamedzakariadiabi@gmial.com

---

**Versione**: 1.0  
**Data**: 2025 
**Sviluppatore**: Diabi M Zakaria
