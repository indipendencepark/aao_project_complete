const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

// Schema per gli utenti
const UserSchema = new Schema({
  nome: {
    type: String,
    required: true
  },
  cognome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  ruolo: {
    type: String,
    enum: ['admin', 'utente'],
    default: 'utente'
  },
  attivo: {
    type: Boolean,
    default: true
  },
  data_creazione: {
    type: Date,
    default: Date.now
  },
  ultimo_accesso: {
    type: Date
  }
});

// Metodo pre-save per hashare la password
UserSchema.pre('save', function(next) {
  const user = this;
  
  // Procedi solo se la password è stata modificata o è nuova
  if (!user.isModified('password')) return next();
  
  // Genera un salt
  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);
    
    // Hasha la password con il salt generato
    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      
      // Sostituisci la password in chiaro con quella hashata
      user.password = hash;
      next();
    });
  });
});

// Metodo per confrontare le password
UserSchema.methods.comparePassword = function(candidatePassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
      if (err) return reject(err);
      resolve(isMatch);
    });
  });
};

// Schema per le impostazioni dell'applicazione
const SettingSchema = new Schema({
  nome: {
    type: String,
    required: true,
    unique: true
  },
  valore: {
    type: Schema.Types.Mixed,
    required: true
  },
  descrizione: {
    type: String
  },
  categoria: {
    type: String,
    required: true
  },
  data_modifica: {
    type: Date,
    default: Date.now
  },
  modificato_da: {
    type: String
  }
});

// Schema per i log delle attività
const ActivityLogSchema = new Schema({
  utente_id: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  azione: {
    type: String,
    required: true
  },
  modulo: {
    type: String,
    required: true,
    enum: ['diagnosi', 'progettazione', 'monitoraggio', 'sistema']
  },
  dettagli: {
    type: Schema.Types.Mixed
  },
  data: {
    type: Date,
    default: Date.now
  },
  ip: {
    type: String
  }
});

const User = mongoose.model('User', UserSchema);
const Setting = mongoose.model('Setting', SettingSchema);
const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);

module.exports = {
  User,
  Setting,
  ActivityLog
};
