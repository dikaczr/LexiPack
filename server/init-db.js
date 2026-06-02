import { getPool, sql } from "./db.js";
import bcrypt from "bcryptjs";

async function initDb() {
  const pool = await getPool();

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
    CREATE TABLE Users (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      username    NVARCHAR(100) NOT NULL UNIQUE,
      email       NVARCHAR(255),
      password_hash NVARCHAR(255) NOT NULL,
      role        NVARCHAR(20) NOT NULL DEFAULT 'viewer',
      is_active   BIT NOT NULL DEFAULT 1,
      created_at  DATETIME2 DEFAULT GETDATE(),
      last_login  DATETIME2
    )
  `);

  // Migrácia: premenuj staré PascalCase stĺpce na snake_case (ak existujú)
  // Používa EXEC() aby T-SQL nevalidoval stĺpce pri parsovaní
  const legacyCols = [
    ["PasswordHash", "password_hash", "NVARCHAR(255)"],
    ["IsActive",     "is_active",     "BIT"],
    ["CreatedAt",    "created_at",    "DATETIME2"],
    ["LastLogin",    "last_login",    "DATETIME2"],
  ];
  for (const [oldName, newName, colType] of legacyCols) {
    await pool.request().query(`
      IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='${oldName}')
      BEGIN
        IF EXISTS(SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='${newName}')
        BEGIN
          -- oba existujú: skopíruj cez EXEC (dynamické SQL obíde parse validáciu)
          EXEC('UPDATE Users SET [${newName}] = [${oldName}] WHERE [${newName}] = '''' OR [${newName}] IS NULL');
          ALTER TABLE Users ALTER COLUMN [${oldName}] ${colType} NULL;
          ALTER TABLE Users DROP COLUMN [${oldName}];
        END
        ELSE
        BEGIN
          EXEC sp_rename 'Users.${oldName}', '${newName}', 'COLUMN';
        END
      END
    `);
  }

  // Pridaj chýbajúce stĺpce ak tabuľka existuje bez niektorých polí
  const missingCols = [
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='password_hash')
     ALTER TABLE Users ADD password_hash NVARCHAR(255) NOT NULL DEFAULT ''`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='email')
     ALTER TABLE Users ADD email NVARCHAR(255)`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='role')
     ALTER TABLE Users ADD role NVARCHAR(20) NOT NULL DEFAULT 'viewer'`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='is_active')
     ALTER TABLE Users ADD is_active BIT NOT NULL DEFAULT 1`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='created_at')
     ALTER TABLE Users ADD created_at DATETIME2 DEFAULT GETDATE()`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='last_login')
     ALTER TABLE Users ADD last_login DATETIME2`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='personal_name')
     ALTER TABLE Users ADD personal_name NVARCHAR(200)`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='personal_surname')
     ALTER TABLE Users ADD personal_surname NVARCHAR(200)`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='company')
     ALTER TABLE Users ADD company NVARCHAR(255)`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='phone')
     ALTER TABLE Users ADD phone NVARCHAR(50)`,
    `IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('Users') AND name='address')
     ALTER TABLE Users ADD address NVARCHAR(500)`,
  ];
  for (const m of missingCols) {
    await pool.request().query(m);
  }

  console.log("✅ Table Users ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AuditLog' AND xtype='U')
    CREATE TABLE AuditLog (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      user_id     INT REFERENCES Users(id),
      username    NVARCHAR(100),
      role        NVARCHAR(20),
      action      NVARCHAR(100) NOT NULL,
      details     NVARCHAR(MAX),
      ip_address  NVARCHAR(50),
      created_at  DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table AuditLog ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Packs' AND xtype='U')
    CREATE TABLE Packs (
      id           INT IDENTITY(1,1) PRIMARY KEY,
      file_name    NVARCHAR(255) NOT NULL UNIQUE,
      pack_id      NVARCHAR(255),
      status       NVARCHAR(30) NOT NULL DEFAULT 'Draft',
      created_by   INT REFERENCES Users(id),
      created_at   DATETIME2 DEFAULT GETDATE(),
      updated_at   DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table Packs ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PackReviews' AND xtype='U')
    CREATE TABLE PackReviews (
      id             INT IDENTITY(1,1) PRIMARY KEY,
      pack_id        INT REFERENCES Packs(id),
      reviewer_id    INT REFERENCES Users(id),
      reviewer_name  NVARCHAR(100),
      action         NVARCHAR(20) NOT NULL,
      note           NVARCHAR(MAX),
      created_at     DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table PackReviews ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='WordReviews' AND xtype='U')
    CREATE TABLE WordReviews (
      id             INT IDENTITY(1,1) PRIMARY KEY,
      pack_id        INT REFERENCES Packs(id) ON DELETE CASCADE,
      word_id        NVARCHAR(100) NOT NULL,
      word           NVARCHAR(255) NOT NULL,
      reviewer_id    INT REFERENCES Users(id),
      reviewer_name  NVARCHAR(100) NOT NULL,
      action         NVARCHAR(20) NOT NULL,
      comment        NVARCHAR(MAX),
      created_at     DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table WordReviews ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='UserSettings' AND xtype='U')
    CREATE TABLE UserSettings (
      id         INT IDENTITY(1,1) PRIMARY KEY,
      user_id    INT NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
      [key]      NVARCHAR(100) NOT NULL,
      value      NVARCHAR(MAX),
      updated_at DATETIME2 DEFAULT GETDATE(),
      CONSTRAINT UQ_UserSettings UNIQUE (user_id, [key])
    )
  `);
  console.log("✅ Table UserSettings ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Tags' AND xtype='U')
    CREATE TABLE Tags (
      id         INT IDENTITY(1,1) PRIMARY KEY,
      name       NVARCHAR(100) NOT NULL UNIQUE,
      created_at DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table Tags ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Heartbeats' AND xtype='U')
    CREATE TABLE Heartbeats (
      id        INT IDENTITY(1,1) PRIMARY KEY,
      user_id   INT NOT NULL REFERENCES Users(id),
      pack_file NVARCHAR(500) NOT NULL,
      ts        DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table Heartbeats ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AiTelemetry' AND xtype='U')
    CREATE TABLE AiTelemetry (
      id          INT IDENTITY(1,1) PRIMARY KEY,
      user_id     INT NOT NULL REFERENCES Users(id),
      username    NVARCHAR(100) NOT NULL,
      pack_file   NVARCHAR(500),
      action      NVARCHAR(50) NOT NULL,
      request_at  DATETIME2 NOT NULL,
      ts          DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('AiTelemetry') AND name='request_at')
      ALTER TABLE AiTelemetry ADD request_at DATETIME2
  `);
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id=OBJECT_ID('AiTelemetry') AND name='token_count')
      ALTER TABLE AiTelemetry ADD token_count INT
  `);
  console.log("✅ Table AiTelemetry ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='GlobalSettings' AND xtype='U')
    CREATE TABLE GlobalSettings (
      [key]      NVARCHAR(100) NOT NULL PRIMARY KEY,
      value      NVARCHAR(MAX),
      updated_at DATETIME2 DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table GlobalSettings ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AiAcceptance' AND xtype='U')
    CREATE TABLE AiAcceptance (
      id               INT IDENTITY(1,1) PRIMARY KEY,
      user_id          INT NOT NULL REFERENCES Users(id),
      username         NVARCHAR(100) NOT NULL,
      pack_file        NVARCHAR(500),
      action           NVARCHAR(50) NOT NULL,
      accepted         BIT NOT NULL,
      corrected_fields NVARCHAR(500),
      ts               DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table AiAcceptance ready");

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Notifications' AND xtype='U')
    CREATE TABLE Notifications (
      id           INT IDENTITY(1,1) PRIMARY KEY,
      from_user_id INT REFERENCES Users(id) ON DELETE SET NULL,
      to_user_id   INT NOT NULL REFERENCES Users(id),
      type         NVARCHAR(50) NOT NULL DEFAULT 'message',
      title        NVARCHAR(255) NOT NULL,
      body         NVARCHAR(MAX),
      ref_pack     NVARCHAR(255),
      is_read      BIT NOT NULL DEFAULT 0,
      created_at   DATETIME2 NOT NULL DEFAULT GETDATE()
    )
  `);
  console.log("✅ Table Notifications ready");

  // Vytvor default admin účet ak neexistuje
  const existing = await pool.request()
    .input("username", sql.NVarChar, "admin")
    .query("SELECT id FROM Users WHERE username = @username");

  if (existing.recordset.length === 0) {
    const hash = await bcrypt.hash("Admin1234!", 10);
    await pool.request()
      .input("username", sql.NVarChar, "admin")
      .input("email",    sql.NVarChar, "admin@lexipack.local")
      .input("hash",     sql.NVarChar, hash)
      .input("role",     sql.NVarChar, "admin")
      .query(`
        INSERT INTO Users (username, email, password_hash, role)
        VALUES (@username, @email, @hash, @role)
      `);
    console.log("✅ Default admin created  (user: admin / pass: Admin1234!)");
  }
}

initDb()
  .then(() => {
    console.log("Database init complete.");
    process.exit(0);
  })
  .catch((err) => {
    console.error("DB init failed:", err.message);
    process.exit(1);
  });
