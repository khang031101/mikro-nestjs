import { Migration } from '@mikro-orm/migrations';

export class Migration20260122070741 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "whiteboard" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "content" bytea null, constraint "whiteboard_pkey" primary key ("id"));`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "whiteboard" cascade;`);
  }

}
