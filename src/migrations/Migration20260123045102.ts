import { Migration } from '@mikro-orm/migrations';

export class Migration20260123045102 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "whiteboard_version" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "whiteboard_id" varchar(255) not null, "content" bytea not null, "name" varchar(255) null, constraint "whiteboard_version_pkey" primary key ("id"));`);

    this.addSql(`alter table "whiteboard_version" add constraint "whiteboard_version_whiteboard_id_foreign" foreign key ("whiteboard_id") references "whiteboard" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "whiteboard_version" cascade;`);
  }

}
