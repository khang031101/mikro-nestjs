import { Migration } from '@mikro-orm/migrations';

export class Migration20260126064205 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table "user" add column "google_id" varchar(255) null, add column "avatar_url" varchar(255) null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "user" drop column "google_id", drop column "avatar_url";`);
  }

}
