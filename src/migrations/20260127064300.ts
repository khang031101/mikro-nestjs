import { Migration } from '@mikro-orm/migrations';

export class Migration20260127064300 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "user" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "name" varchar(255) null, "password" varchar(255) null, "google_id" varchar(255) null, "avatar_url" varchar(255) null, "is_active" boolean not null default true, "is_admin" boolean not null default false, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "whiteboard" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "name" varchar(255) not null, "content" bytea null, constraint "whiteboard_pkey" primary key ("id"));`);

    this.addSql(`create table "whiteboard_version" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "whiteboard_id" varchar(255) not null, "content" bytea not null, "name" varchar(255) null, constraint "whiteboard_version_pkey" primary key ("id"));`);

    this.addSql(`alter table "whiteboard_version" add constraint "whiteboard_version_whiteboard_id_foreign" foreign key ("whiteboard_id") references "whiteboard" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "whiteboard_version" drop constraint "whiteboard_version_whiteboard_id_foreign";`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "whiteboard" cascade;`);

    this.addSql(`drop table if exists "whiteboard_version" cascade;`);
  }

}
