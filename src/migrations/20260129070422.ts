import { Migration } from '@mikro-orm/migrations';

export class Migration20260129070422 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table "role" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "tenant_id" uuid not null, "name" varchar(255) not null, "permissions" text[] not null, constraint "role_pkey" primary key ("id"));`);
    this.addSql(`alter table "role" add constraint "role_tenant_id_name_unique" unique ("tenant_id", "name");`);

    this.addSql(`create table "user" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "email" varchar(255) not null, "name" varchar(255) null, "password" varchar(255) null, "google_id" varchar(255) null, "avatar_url" varchar(255) null, "is_active" boolean not null default true, "is_admin" boolean not null default false, constraint "user_pkey" primary key ("id"));`);
    this.addSql(`alter table "user" add constraint "user_email_unique" unique ("email");`);

    this.addSql(`create table "member" ("id" varchar(255) not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "tenant_id" uuid not null, "user_id" varchar(255) not null, "role_id" varchar(255) not null, "is_active" boolean not null default true, constraint "member_pkey" primary key ("id"));`);
    this.addSql(`create index "member_user_id_tenant_id_index" on "member" ("user_id", "tenant_id");`);

    this.addSql(`alter table "member" add constraint "member_user_id_foreign" foreign key ("user_id") references "user" ("id") on update cascade;`);
    this.addSql(`alter table "member" add constraint "member_role_id_foreign" foreign key ("role_id") references "role" ("id") on update cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table "member" drop constraint "member_role_id_foreign";`);

    this.addSql(`alter table "member" drop constraint "member_user_id_foreign";`);

    this.addSql(`drop table if exists "role" cascade;`);

    this.addSql(`drop table if exists "user" cascade;`);

    this.addSql(`drop table if exists "member" cascade;`);
  }

}
