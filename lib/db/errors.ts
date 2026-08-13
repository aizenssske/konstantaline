export class DatabaseConfigError extends Error {
  constructor(
    message = "DATABASE_URL sozlanmagan. Neon PostgreSQL ulanish satrini server environment’iga qo‘shing. Production’da DEMO_MODE=false bo‘lishi kerak.",
  ) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}
