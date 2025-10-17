-- Script per aggiungere il campo gender alla tabella users esistente
-- Eseguire questo script se il database esiste già senza il campo gender

-- Aggiungi la colonna gender se non esiste
ALTER TABLE users ADD COLUMN gender TEXT CHECK(gender IN ('male', 'female'));

-- Aggiorna i dati esistenti con valori di default
-- (puoi modificare questi valori secondo le tue preferenze)
UPDATE users SET gender = 'male' WHERE gender IS NULL;

-- Verifica che la colonna sia stata aggiunta correttamente
SELECT sql FROM sqlite_master WHERE type='table' AND name='users';
