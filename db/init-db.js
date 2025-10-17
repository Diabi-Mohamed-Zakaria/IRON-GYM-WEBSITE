'use strict';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'gym.db');

console.log('🏋️  Inizializzazione database IRON GYM...\n');

// Elimina database esistente se presente
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('✅ Database esistente eliminato');
}

// Crea nuovo database
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Errore creazione database:', err);
    process.exit(1);
  }
  console.log('✅ Nuovo database creato\n');
});

// Funzione per salvare password in chiaro (solo per progetto scolastico)
function savePassword(password) {
  return password; // Password in chiaro per semplicità
}

// Inizializza database
db.serialize(() => {
  // CREA TABELLE
  console.log('📋 Creazione tabelle...');

  db.run(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'trainer', 'client')),
      nome TEXT NOT NULL,
      cognome TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      gender TEXT CHECK(gender IN ('male', 'female')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE classes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      trainer_id INTEGER,
      time TEXT NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 20,
      day_of_week TEXT NOT NULL CHECK(day_of_week IN ('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday')),
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE SET NULL
    )
  `);

  db.run(`
    CREATE TABLE bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      class_id INTEGER NOT NULL,
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
      UNIQUE(user_id, class_id)
    )
  `);

  db.run(`
    CREATE TABLE reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      trainer_id INTEGER,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT NOT NULL,
      comment TEXT NOT NULL,
      review_type TEXT NOT NULL CHECK(review_type IN ('gym', 'trainer')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (trainer_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `, () => {
    console.log('✅ Tabelle create\n');
    console.log('👥 Inserimento utenti...');

    // INSERISCI UTENTI
    const users = [
      { username: 'admin', password: 'password123', role: 'admin', nome: 'Mario', cognome: 'Rossi', email: 'admin@irongym.com', gender: 'male' },
      { username: 'john.trainer', password: 'password123', role: 'trainer', nome: 'John', cognome: 'Smith', email: 'john@irongym.com', gender: 'male' },
      { username: 'sara.trainer', password: 'password123', role: 'trainer', nome: 'Sara', cognome: 'Johnson', email: 'sara@irongym.com', gender: 'female' },
      { username: 'mike.trainer', password: 'password123', role: 'trainer', nome: 'Mike', cognome: 'Williams', email: 'mike@irongym.com', gender: 'male' },
      { username: 'luca.bianchi', password: 'password123', role: 'client', nome: 'Luca', cognome: 'Bianchi', email: 'luca@test.com', gender: 'male' },
      { username: 'giulia.verdi', password: 'password123', role: 'client', nome: 'Giulia', cognome: 'Verdi', email: 'giulia@test.com', gender: 'female' },
      { username: 'marco.russo', password: 'password123', role: 'client', nome: 'Marco', cognome: 'Russo', email: 'marco@test.com', gender: 'male' },
      { username: 'anna.ferrari', password: 'password123', role: 'client', nome: 'Anna', cognome: 'Ferrari', email: 'anna@test.com', gender: 'female' },
      { username: 'paolo.romano', password: 'password123', role: 'client', nome: 'Paolo', cognome: 'Romano', email: 'paolo@test.com', gender: 'male' }
    ];

    const stmt = db.prepare('INSERT INTO users (username, password, role, nome, cognome, email, gender) VALUES (?, ?, ?, ?, ?, ?, ?)');

    users.forEach(user => {
      const password = savePassword(user.password);
      stmt.run(user.username, password, user.role, user.nome, user.cognome, user.email, user.gender);
    });

    stmt.finalize(() => {
      console.log(`✅ ${users.length} utenti inseriti\n`);
      console.log('📅 Inserimento classi...');

      // INSERISCI CLASSI
      const classes = [
        { name: 'CrossFit Intensive', trainer_id: 2, time: '07:00', capacity: 15, day: 'Monday', desc: 'High-intensity functional training' },
        { name: 'Yoga Flow', trainer_id: 3, time: '09:00', capacity: 20, day: 'Monday', desc: 'Relaxing yoga session' },
        { name: 'HIIT Cardio', trainer_id: 2, time: '18:00', capacity: 25, day: 'Monday', desc: 'High-intensity interval training' },
        { name: 'Strength Training', trainer_id: 4, time: '08:00', capacity: 15, day: 'Tuesday', desc: 'Build muscle and strength' },
        { name: 'Pilates Core', trainer_id: 3, time: '10:00', capacity: 18, day: 'Tuesday', desc: 'Core strengthening' },
        { name: 'Boxing Workout', trainer_id: 2, time: '19:00', capacity: 20, day: 'Tuesday', desc: 'Boxing fitness' },
        { name: 'Spin Class', trainer_id: 4, time: '07:30', capacity: 25, day: 'Wednesday', desc: 'Indoor cycling' },
        { name: 'Functional Training', trainer_id: 2, time: '17:00', capacity: 20, day: 'Wednesday', desc: 'Movement patterns' },
        { name: 'Bootcamp', trainer_id: 2, time: '06:30', capacity: 20, day: 'Thursday', desc: 'Military-style training' },
        { name: 'Yoga Stretch', trainer_id: 3, time: '11:00', capacity: 20, day: 'Thursday', desc: 'Gentle stretching' },
        { name: 'Power Lifting', trainer_id: 4, time: '18:30', capacity: 12, day: 'Thursday', desc: 'Advanced weightlifting' },
        { name: 'Zumba Dance', trainer_id: 3, time: '10:00', capacity: 30, day: 'Friday', desc: 'Dance fitness' },
        { name: 'Circuit Training', trainer_id: 2, time: '17:30', capacity: 20, day: 'Friday', desc: 'Full body workout' },
        { name: 'Morning Yoga', trainer_id: 3, time: '08:00', capacity: 25, day: 'Saturday', desc: 'Mindful movement' },
        { name: 'CrossFit Open', trainer_id: 2, time: '10:00', capacity: 20, day: 'Saturday', desc: 'Community session' },
        { name: 'Recovery Yoga', trainer_id: 3, time: '09:00', capacity: 20, day: 'Sunday', desc: 'Recovery session' }
      ];

      const stmtClass = db.prepare('INSERT INTO classes (name, trainer_id, time, capacity, day_of_week, description) VALUES (?, ?, ?, ?, ?, ?)');

      classes.forEach(cls => {
        stmtClass.run(cls.name, cls.trainer_id, cls.time, cls.capacity, cls.day, cls.desc);
      });

      stmtClass.finalize(() => {
        console.log(`✅ ${classes.length} classi inserite\n`);
        console.log('🎫 Inserimento prenotazioni...');

        // INSERISCI PRENOTAZIONI
        const bookings = [
          { user_id: 5, class_id: 1 }, { user_id: 5, class_id: 4 }, { user_id: 5, class_id: 7 },
          { user_id: 6, class_id: 2 }, { user_id: 6, class_id: 5 }, { user_id: 6, class_id: 10 },
          { user_id: 7, class_id: 3 }, { user_id: 7, class_id: 6 }, { user_id: 7, class_id: 9 },
          { user_id: 8, class_id: 1 }, { user_id: 8, class_id: 2 }, { user_id: 8, class_id: 12 },
          { user_id: 9, class_id: 8 }, { user_id: 9, class_id: 11 }, { user_id: 9, class_id: 13 }
        ];

        const stmtBooking = db.prepare('INSERT INTO bookings (user_id, class_id) VALUES (?, ?)');

        bookings.forEach(booking => {
          stmtBooking.run(booking.user_id, booking.class_id);
        });

        stmtBooking.finalize(() => {
          console.log(`✅ ${bookings.length} prenotazioni inserite\n`);
          console.log('⭐ Inserimento recensioni...');

          // INSERISCI RECENSIONI
          const reviews = [
            { user_id: 5, trainer_id: null, rating: 5, title: 'Palestra fantastica!', comment: 'Ambiente moderno, attrezzature top e personale sempre disponibile. Consigliatissima!', type: 'gym' },
            { user_id: 6, trainer_id: 2, rating: 5, title: 'John è un trainer eccezionale', comment: 'Molto professionale e motivante. Le sue lezioni di CrossFit sono intense ma divertenti.', type: 'trainer' },
            { user_id: 7, trainer_id: null, rating: 4, title: 'Ottima struttura', comment: 'Palestra ben organizzata con tutto quello che serve. Unica pecca: a volte è un po\' affollata.', type: 'gym' },
            { user_id: 8, trainer_id: 3, rating: 5, title: 'Sara fantastica per lo yoga', comment: 'Lezioni di yoga molto rilassanti e ben strutturate. Sara è paziente e competente.', type: 'trainer' },
            { user_id: 9, trainer_id: null, rating: 5, title: 'Ambiente perfetto', comment: 'Pulizia impeccabile, attrezzature sempre funzionanti e atmosfera positiva.', type: 'gym' },
            { user_id: 5, trainer_id: 4, rating: 4, title: 'Mike ottimo per il sollevamento', comment: 'Molto esperto nel power lifting, mi ha aiutato a migliorare la tecnica.', type: 'trainer' },
            { user_id: 6, trainer_id: null, rating: 5, title: 'Servizio eccellente', comment: 'Reception sempre cordiale, spogliatoi puliti e servizi di qualità.', type: 'gym' },
            { user_id: 7, trainer_id: 2, rating: 5, title: 'HIIT con John', comment: 'Lezioni HIIT molto intense ma efficaci. John sa come motivare anche nei momenti più duri.', type: 'trainer' }
          ];

          const stmtReview = db.prepare('INSERT INTO reviews (user_id, trainer_id, rating, title, comment, review_type) VALUES (?, ?, ?, ?, ?, ?)');

          reviews.forEach(review => {
            stmtReview.run(review.user_id, review.trainer_id, review.rating, review.title, review.comment, review.type);
          });

          stmtReview.finalize(() => {
            console.log(`✅ ${reviews.length} recensioni inserite\n`);

            // VERIFICA
            db.get('SELECT COUNT(*) as total FROM users', (err, row) => {
              console.log('📊 RIEPILOGO:');
              console.log(`   👥 Utenti: ${row.total}`);
            });

            db.get('SELECT COUNT(*) as total FROM classes', (err, row) => {
              console.log(`   📅 Classi: ${row.total}`);
            });

            db.get('SELECT COUNT(*) as total FROM bookings', (err, row) => {
              console.log(`   🎫 Prenotazioni: ${row.total}`);
            });

            db.get('SELECT COUNT(*) as total FROM reviews', (err, row) => {
              console.log(`   ⭐ Recensioni: ${row.total}\n`);
              console.log('🎉 Database inizializzato con successo!\n');
              console.log('📝 CREDENZIALI DI TEST:');
              console.log('   Admin:   admin / password123');
              console.log('   Trainer: john.trainer / password123');
              console.log('   Client:  luca.bianchi / password123\n');

              db.close();
            });
          });
        });
      });
    });
  });
});