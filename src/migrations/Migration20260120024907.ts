import { Migration } from '@mikro-orm/migrations';

export class Migration20260120024907 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `alter table "user" add column "is_admin" boolean not null default false;`,
    );
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "is_admin";`);
  }
}
